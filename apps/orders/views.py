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
            commande = serializer.save(client=request.user)
            return Response(
                CommandeDetailSerializer(commande).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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
