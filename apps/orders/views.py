from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.contrib.gis.geos import Point
from geopy.distance import geodesic
from apps.orders.models import Commande, LigneCommande, Avis, Promotion
from apps.orders.serializers import (
    CommandeCreateSerializer, CommandeDetailSerializer,
    LigneCommandeSerializer, AvisSerializer, PromotionSerializer
)
from apps.users.permissions import IsClient
from apps.payments.services import payment_service
from django.conf import settings
import logging
from decimal import Decimal
import uuid

logger = logging.getLogger(__name__)


class CommandePagination(PageNumberPagination):
    page_size = 10
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 100


class CommandeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsClient]
    pagination_class = CommandePagination
    
    def get_queryset(self):
        queryset = Commande.objects.filter(client=self.request.user)
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommandeCreateSerializer
        return CommandeDetailSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            payment_mode = serializer.validated_data.get('payment_mode')
            payment_phone = serializer.validated_data.get('payment_phone')
            total_amount = serializer.validated_data.get('total_amount')

            campay_reference = None
            operator = None
            ussd_code = None

            if payment_mode == 'MOBILE_MONEY' and payment_phone:
                try:
                    if total_amount is None:
                        return Response(
                            {'error': 'Le montant total est requis pour un paiement Mobile Money'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    phone = payment_phone.replace(' ', '').replace('-', '')
                    if phone.startswith('+237'):
                        phone = phone.replace('+237', '237')
                    elif not phone.startswith('237'):
                        if phone.startswith('6'):
                            phone = '237' + phone

                    if not phone.isdigit() or len(phone) != 12 or not phone.startswith('2376'):
                        return Response(
                            {'error': 'Numéro Mobile Money invalide. Format attendu: 2376XXXXXXXX'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    amount_str = str(Decimal(total_amount).quantize(Decimal('1.')))
                    external_reference = f"ORDER-{request.user.id}-{uuid.uuid4().hex[:12].upper()}"
                    
                    campay_result = payment_service.init_collect(
                        amount=amount_str,
                        phone=phone,
                        description=f"Order payment - {request.user.email}",
                        external_reference=external_reference
                    )

                    if campay_result.get('success'):
                        payment_api_status = campay_result.get('status')
                        if payment_api_status == 'FAILED':
                            logger.warning(f"CamPay payment failed, order not created: {campay_result}")
                            return Response(
                                {
                                    'error': "Le paiement Mobile Money a échoué immédiatement. Vérifiez le numéro et réessayez.",
                                    'payment_status': 'FAILED',
                                    'campay_reference': campay_result.get('reference')
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        else:
                            campay_reference = campay_result.get('reference')
                            operator = campay_result.get('operator')
                            ussd_code = campay_result.get('ussd_code')
                            logger.info(f"CamPay payment initiated: {campay_reference}, USSD: {ussd_code}")
                    else:
                        logger.error(f"CamPay payment failed, order not created: {campay_result}")
                        return Response(
                            {'error': campay_result.get('error', 'Échec de l’initiation du paiement CamPay')},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Exception as e:
                    logger.error(f"CamPay exception: {str(e)}")
                    return Response(
                        {'error': 'Erreur lors de l’initiation du paiement Mobile Money'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            commande = serializer.save(
                client=request.user,
                campay_reference=campay_reference,
                operator=operator,
                payment_phone=phone if payment_mode == 'MOBILE_MONEY' else payment_phone
            )
            
            response_data = CommandeDetailSerializer(commande).data
            
            if ussd_code:
                response_data['ussd_code'] = ussd_code
                response_data['payment_instructions'] = f"Composez {ussd_code} sur votre téléphone pour compléter le paiement"
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        commande = self.get_object()
        if commande.status in ['LIVREE', 'ANNULEE']:
            return Response(
                {'error': 'Cannot cancel this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commande.status = 'ANNULEE'
        commande.cancellation_reason = request.data.get('reason', '')
        commande.save()
        
        return Response(CommandeDetailSerializer(commande).data)
    
    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        commande = self.get_object()
        return Response({
            'numero': commande.numero,
            'status': commande.status,
            'estimated_duration_minutes': commande.estimated_duration_minutes,
            'distance_km': commande.distance_km,
            'livreur': commande.livreur.user.get_full_name() if commande.livreur else None,
            'livreur_phone': commande.livreur.user.phone if commande.livreur else None,
        })
    
    @action(detail=True, methods=['post'])
    def valider_livraison(self, request, pk=None):
        commande = self.get_object()
        otp = request.data.get('otp_code')
        
        if commande.otp_code != otp:
            return Response(
                {'error': 'Invalid OTP code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commande.status = 'LIVREE'
        commande.date_delivered = timezone.now()
        commande.save()
        
        return Response(CommandeDetailSerializer(commande).data)
    
    @action(detail=True, methods=['get'])
    def check_payment(self, request, pk=None):
        commande = self.get_object()
        
        if not commande.campay_reference:
            return Response({
                'has_payment': False,
                'message': 'No CamPay payment associated with this order'
            })
        
        try:
            result = payment_service.get_transaction_status(commande.campay_reference)

            if result.get('success'):
                payment_status = result.get('status')

                if payment_status == 'SUCCESSFUL' and commande.payment_status != 'PAYE':
                    commande.payment_status = 'PAYE'
                    commande.save()

                return Response({
                    'has_payment': True,
                    'campay_reference': commande.campay_reference,
                    'payment_status': payment_status,
                    'operator': result.get('operator') or commande.operator,
                    'amount': result.get('amount'),
                    'operator_reference': result.get('operator_reference'),
                    'order_payment_status': commande.payment_status
                })
            else:
                return Response({
                    'error': result.get('error', 'Failed to get payment status'),
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Check payment exception: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AvisViewSet(viewsets.ModelViewSet):
    serializer_class = AvisSerializer
    permission_classes = [IsAuthenticated, IsClient]
    
    def get_queryset(self):
        return Avis.objects.filter(commande__client=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            commande_id = request.data.get('commande')
            try:
                commande = Commande.objects.get(id=commande_id, client=request.user)
                avis = serializer.save(commande=commande)
                return Response(
                    AvisSerializer(avis).data,
                    status=status.HTTP_201_CREATED
                )
            except Commande.DoesNotExist:
                return Response(
                    {'error': 'Order not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
