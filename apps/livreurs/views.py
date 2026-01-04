from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from geopy.distance import geodesic
from apps.livreurs.models import Livreur, StatistiquesLivreur
from apps.livreurs.serializers import (
    LivreurDetailSerializer, LivreurUpdateSerializer, LivreurPositionSerializer,
    LivreurStatusUpdateSerializer, StatistiquesLivreurSerializer
)
from apps.orders.models import Commande
from apps.users.permissions import IsDelivery, IsApproved

class LivreurViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsDelivery]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's delivery profile"""
        try:
            livreur = request.user.livreur
            serializer = LivreurDetailSerializer(livreur, context={'request': request})
            return Response(serializer.data)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update delivery profile"""
        try:
            livreur = request.user.livreur
            serializer = LivreurUpdateSerializer(
                livreur, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(LivreurDetailSerializer(livreur).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def update_position(self, request):
        """Update GPS position"""
        try:
            livreur = request.user.livreur
            serializer = LivreurPositionSerializer(data=request.data)
            if serializer.is_valid():
                livreur.current_latitude = serializer.validated_data['latitude']
                livreur.current_longitude = serializer.validated_data['longitude']
                livreur.last_position_update = timezone.now()
                livreur.save()
                return Response({'message': 'Position updated'})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated, IsDelivery, IsApproved])
    def update_status(self, request):
        """Update online status"""
        try:
            livreur = request.user.livreur
            if not request.user.is_approved and request.data.get('status') == 'EN_LIGNE':
                return Response(
                    {'error': 'Cannot go online without approval'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = LivreurStatusUpdateSerializer(data=request.data)
            if serializer.is_valid():
                livreur.status = serializer.validated_data['status']
                livreur.save()
                return Response({'status': livreur.status})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsDelivery, IsApproved])
    def commandes_disponibles(self, request):
        """Get available deliveries nearby"""
        try:
            livreur = request.user.livreur
            
            # Check if livreur profile exists
            if not livreur:
                return Response({
                    'error': 'profile_not_found',
                    'message': 'Profil livreur non trouvé. Veuillez compléter votre inscription.',
                    'detail': 'Vous devez d\'abord compléter votre profil de livreur pour accéder aux commandes.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if livreur account is active
            if not livreur.is_active:
                return Response({
                    'error': 'account_inactive',
                    'message': 'Compte désactivé',
                    'detail': 'Votre compte de livreur est désactivé. Veuillez contacter le support.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if position is set
            if not livreur.current_latitude or not livreur.current_longitude:
                return Response({
                    'error': 'position_not_set',
                    'message': 'Position non définie',
                    'detail': 'Vous devez définir votre position GPS pour voir les commandes disponibles.',
                    'action_required': 'update_position'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_location = Point(float(livreur.current_longitude), float(livreur.current_latitude))
            commandes = Commande.objects.filter(
                status='PRETE',
                livreur__isnull=True
            ).annotate(
                distance=Distance('delivery_position', user_location)
            ).filter(
                distance__lte=f'{livreur.action_radius_km} km'
            ).order_by('distance')[:20]
            
            from apps.orders.serializers import CommandeDetailSerializer
            serializer = CommandeDetailSerializer(commandes, many=True)
            return Response(serializer.data)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsDelivery, IsApproved])
    def accepter_commande(self, request):
        """Accept a delivery order"""
        try:
            livreur = request.user.livreur
            commande_id = request.data.get('commande_id')
            
            try:
                commande = Commande.objects.get(id=commande_id, status='PRETE', livreur__isnull=True)
            except Commande.DoesNotExist:
                return Response({'error': 'Order not available'}, status=status.HTTP_404_NOT_FOUND)
            
            commande.livreur = livreur
            commande.status = 'LIVREUR_ASSIGNE'
            commande.save()
            
            from apps.orders.serializers import CommandeDetailSerializer
            return Response(CommandeDetailSerializer(commande).data)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsDelivery, IsApproved])
    def commande_active(self, request):
        """Get current active delivery"""
        try:
            livreur = request.user.livreur
            commande = Commande.objects.filter(
                livreur=livreur,
                status__in=['LIVREUR_ASSIGNE', 'EN_ROUTE_COLLECTE', 'COLLECTEE', 'EN_LIVRAISON']
            ).first()
            
            if not commande:
                return Response({'error': 'No active delivery'}, status=status.HTTP_404_NOT_FOUND)
            
            from apps.orders.serializers import CommandeDetailSerializer
            return Response(CommandeDetailSerializer(commande).data)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsDelivery])
    def statistiques(self, request):
        """Get delivery statistics"""
        try:
            livreur = request.user.livreur
            stats = livreur.statistics
            serializer = StatistiquesLivreurSerializer(stats)
            return Response(serializer.data)
        except (Livreur.DoesNotExist, StatistiquesLivreur.DoesNotExist):
            return Response({'error': 'Statistics not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsDelivery])
    def historique(self, request):
        """Get delivery history"""
        try:
            livreur = request.user.livreur
            commandes = Commande.objects.filter(
                livreur=livreur,
                status__in=['LIVREE', 'ANNULEE']
            ).order_by('-date_delivered')[:50]
            
            from apps.orders.serializers import CommandeDetailSerializer
            serializer = CommandeDetailSerializer(commandes, many=True)
            return Response(serializer.data)
        except Livreur.DoesNotExist:
            return Response({'error': 'Delivery profile not found'}, status=status.HTTP_404_NOT_FOUND)
