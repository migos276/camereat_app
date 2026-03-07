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
from apps.users.permissions import IsClient, IsRestaurantOwner
from apps.payments.services import payment_service, PaymentService
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
    pagination_class = CommandePagination
    
    def get_permissions(self):
        """Allow both clients and restaurant owners"""
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommandeCreateSerializer
        return CommandeDetailSerializer
    
    def get_queryset(self):
        """Filter queryset based on user type"""
        user = self.request.user
        
        # If user is a client, return their orders
        if user.user_type == 'CLIENT':
            return Commande.objects.filter(client=user)
        
        # If user is a restaurant owner, return orders for their restaurant
        if hasattr(user, 'restaurant'):
            return Commande.objects.filter(restaurant=user.restaurant)
        
        # Default: return empty queryset
        return Commande.objects.none()
    
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

                    # Use the improved phone validation from PaymentService
                    is_valid, phone, operator = PaymentService.validate_phone(payment_phone)
                    if not is_valid:
                        return Response(
                            {'error': 'Numéro Mobile Money invalide. Utilisez un numéro MTN (650-679) ou Orange (655-699) Cameroun.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Validate amount is above minimum
                    is_valid, error_msg = PaymentService.validate_amount(total_amount)
                    if not is_valid:
                        return Response(
                            {'error': error_msg},
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
    
    @action(detail=True, methods=['post'], url_path='accepter')
    def accepter(self, request, pk=None):
        """Accept an order - changes status from EN_ATTENTE to ACCEPTEE"""
        from apps.restaurants.models import Restaurant
        
        # Check if user is a restaurant owner
        if not hasattr(request.user, 'restaurant'):
            return Response(
                {'error': 'Vous devez être propriétaire d\'un restaurant pour effectuer cette action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        commande = self.get_object()
        
        # Verify that the order belongs to this restaurant
        if commande.restaurant != request.user.restaurant:
            return Response(
                {'error': 'Cette commande ne appartient pas à votre restaurant.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow accepting if order is in waiting status
        if commande.status != 'EN_ATTENTE':
            return Response(
                {'error': f'Impossible d\'accepter cette commande. Statut actuel: {commande.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commande.status = 'ACCEPTEE'
        commande.date_accepted = timezone.now()
        commande.save()
        
        return Response(CommandeDetailSerializer(commande).data)
    
    @action(detail=True, methods=['post'], url_path='commencer-preparation')
    def commencer_preparation(self, request, pk=None):
        """Start preparing an order - changes status from ACCEPTEE to EN_PREPARATION"""
        from apps.restaurants.models import Restaurant
        
        # Check if user is a restaurant owner
        if not hasattr(request.user, 'restaurant'):
            return Response(
                {'error': 'Vous devez être propriétaire d\'un restaurant pour effectuer cette action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        commande = self.get_object()
        
        # Verify that the order belongs to this restaurant
        if commande.restaurant != request.user.restaurant:
            return Response(
                {'error': 'Cette commande n\'appartient pas à votre restaurant.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow starting preparation if order is accepted
        if commande.status != 'ACCEPTEE':
            return Response(
                {'error': f'Impossible de commencer la préparation. Statut actuel: {commande.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commande.status = 'EN_PREPARATION'
        commande.date_preparation = timezone.now()
        commande.save()
        
        return Response(CommandeDetailSerializer(commande).data)
    
    @action(detail=True, methods=['post'], url_path='marquer-prete')
    def marquer_prete(self, request, pk=None):
        """Mark order as ready for pickup - makes it visible to livreurs"""
        from apps.restaurants.models import Restaurant
        
        # Check if user is a restaurant owner with the same restaurant as the order
        if not hasattr(request.user, 'restaurant'):
            return Response(
                {'error': 'Vous devez être propriétaire d\'un restaurant pour effectuer cette action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        commande = self.get_object()
        
        # Verify that the order belongs to this restaurant
        if commande.restaurant != request.user.restaurant:
            return Response(
                {'error': 'Cette commande n\'appartient pas à votre restaurant.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow marking as ready if order is in preparation
        if commande.status != 'EN_PREPARATION':
            return Response(
                {'error': f'Impossible de marquer cette commande comme prête. Statut actuel: {commande.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commande.status = 'PRETE'
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

    @action(detail=True, methods=['post'], url_path='marquer-livree')
    def marquer_livree(self, request, pk=None):
        """Allow the assigned livreur to mark an order as delivered."""
        if not hasattr(request.user, 'livreur'):
            return Response(
                {'error': 'Vous devez être livreur pour effectuer cette action.'},
                status=status.HTTP_403_FORBIDDEN
            )

        commande = self.get_object()
        livreur = request.user.livreur

        if commande.livreur_id != livreur.id:
            return Response(
                {'error': "Cette commande n'est pas assignée à votre compte livreur."},
                status=status.HTTP_403_FORBIDDEN
            )

        if commande.status in ['LIVREE', 'ANNULEE', 'REFUSEE']:
            return Response(
                {'error': f'Impossible de marquer cette commande comme livrée. Statut actuel: {commande.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if commande.status not in ['LIVREUR_ASSIGNE', 'EN_ROUTE_COLLECTE', 'COLLECTEE', 'EN_LIVRAISON']:
            return Response(
                {'error': f'Statut non valide pour livraison: {commande.status}'},
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
