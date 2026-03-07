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
from apps.users.permissions import IsClient, IsApproved
import requests
from django.conf import settings
import logging

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
        # Filter by status if provided in query params
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommandeCreateSerializer
        return CommandeDetailSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Check if this is a Mobile Money payment with CamPay
            payment_mode = serializer.validated_data.get('payment_mode')
            payment_phone = serializer.validated_data.get('payment_phone')
            total_amount = float(request.data.get('total_amount', 0))
            
            campay_reference = None
            operator = None
            
            # If Mobile Money payment, initiate CamPay payment
            if payment_mode == 'MOBILE_MONEY' and payment_phone:
                try:
                    # Get CamPay token
                    token = self._get_campay_token()
                    if token:
                        # Format phone number
                        phone = payment_phone.replace(' ', '').replace('-', '')
                        if not phone.startswith('237'):
                            if phone.startswith('6'):
                                phone = '237' + phone
                        
                        # Initiate payment
                        campay_result = self._initiate_campay_payment(
                            token, 
                            str(int(total_amount)), 
                            phone,
                            f"Order payment - {request.user.email}"
                        )
                        
                        if campay_result.get('success'):
                            campay_reference = campay_result.get('reference')
                            operator = campay_result.get('operator')
                            logger.info(f"CamPay payment initiated: {campay_reference}")
                        else:
                            logger.error(f"CamPay payment failed: {campay_result}")
                            return Response(
                                {'error': f"Échec du paiement mobile: {campay_result.get('error', 'Erreur inconnue')}"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        return Response(
                            {'error': 'Échec de connexion à CamPay'},
                            status=status.HTTP_500_BAD_REQUEST
                        )
                except Exception as e:
                    logger.error(f"CamPay exception: {str(e)}")
                    return Response(
                        {'error': f'Erreur lors du paiement: {str(e)}'},
                        status=status.HTTP_500_BAD_REQUEST
                    )
            
            # Save the order with CamPay reference
            commande = serializer.save(
                client=request.user,
                campay_reference=campay_reference,
                operator=operator
            )
            
            # If payment was successful, update payment status
            if campay_reference:
                # For now, keep as EN_ATTENTE until we verify payment
                # The client will poll to check payment status
                pass
            
            return Response(
                CommandeDetailSerializer(commande).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_campay_token(self):
        """Get CamPay API token"""
        from django.conf import settings
        
        CAMPAY_BASE_URL = 'https://demo.campay.net/api'
        if hasattr(settings, 'CAMPAY_ENVIRONMENT') and settings.CAMPAY_ENVIRONMENT == 'PROD':
            CAMPAY_BASE_URL = 'https://www.campay.net/api'
        
        url = f"{CAMPAY_BASE_URL}/token/"
        data = {
            'username': getattr(settings, 'CAMPAY_APP_USERNAME', ''),
            'password': getattr(settings, 'CAMPAY_APP_PASSWORD', '')
        }
        try:
            response = requests.post(url, data=data)
            if response.status_code == 200:
                return response.json().get('token')
            logger.error(f"CamPay token error: {response.text}")
            return None
        except Exception as e:
            logger.error(f"CamPay token exception: {str(e)}")
            return None
    
    def _initiate_campay_payment(self, token, amount, phone, description):
        """Initiate CamPay payment"""
        from django.conf import settings
        
        CAMPAY_BASE_URL = 'https://demo.campay.net/api'
        if hasattr(settings, 'CAMPAY_ENVIRONMENT') and settings.CAMPAY_ENVIRONMENT == 'PROD':
            CAMPAY_BASE_URL = 'https://www.campay.net/api'
        
        url = f"{CAMPAY_BASE_URL}/collect/"
        
        headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'amount': amount,
            'currency': 'XAF',
            'from': phone,
            'description': description,
            'external_reference': ''
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            logger.info(f"CamPay collect response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'reference': result.get('reference'),
                    'status': result.get('status'),
                    'operator': result.get('operator')
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('detail', 'Payment failed')
                }
        except Exception as e:
            logger.error(f"CamPay collect exception: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Cancel an order"""
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
        """Get order tracking info"""
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
        """Validate delivery with OTP"""
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
        """Check CamPay payment status"""
        commande = self.get_object()
        
        if not commande.campay_reference:
            return Response({
                'has_payment': False,
                'message': 'No CamPay payment associated with this order'
            })
        
        try:
            token = self._get_campay_token()
            if not token:
                return Response(
                    {'error': 'Failed to connect to CamPay'},
                    status=status.HTTP_500_BAD_REQUEST
                )
            
            from django.conf import settings
            CAMPAY_BASE_URL = 'https://demo.campay.net/api'
            if hasattr(settings, 'CAMPAY_ENVIRONMENT') and settings.CAMPAY_ENVIRONMENT == 'PROD':
                CAMPAY_BASE_URL = 'https://www.campay.net/api'
            
            url = f"{CAMPAY_BASE_URL}/get_transaction_status/"
            headers = {
                'Authorization': f'Token {token}',
                'Content-Type': 'application/json'
            }
            data = {'reference': commande.campay_reference}
            
            response = requests.post(url, json=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                payment_status = result.get('status')
                
                # Update order payment status if payment is successful
                if payment_status == 'SUCCESSFUL' and commande.payment_status != 'PAYE':
                    commande.payment_status = 'PAYE'
                    commande.save()
                
                return Response({
                    'has_payment': True,
                    'campay_reference': commande.campay_reference,
                    'payment_status': payment_status,
                    'operator': commande.operator,
                    'amount': result.get('amount'),
                    'order_payment_status': commande.payment_status
                })
            else:
                return Response({
                    'error': 'Failed to get payment status',
                    'details': response.json()
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Check payment exception: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_BAD_REQUEST
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
