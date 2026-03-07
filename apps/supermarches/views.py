from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from apps.supermarches.models import Supermarche, CategorieSupermarche
from apps.supermarches.serializers import (
    SupermarcheListSerializer, SupermarcheDetailSerializer,
    SupermarcheUpdateSerializer, CategorieSupermarceSerializer
)
from apps.users.permissions import IsSupermarketOwner, IsApproved

class SupermarcheViewSet(viewsets.ModelViewSet):
    queryset = Supermarche.objects.filter(is_active=True, user__is_approved=True)
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SupermarcheDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return SupermarcheUpdateSerializer
        return SupermarcheListSerializer
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get nearby supermarkets"""
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius_km = request.query_params.get('radius', 10)
        
        if not lat or not lon:
            return Response({'error': 'Latitude and longitude required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_location = Point(float(lon), float(lat))
            supermarches = self.get_queryset().annotate(
                distance=Distance('position', user_location)
            ).filter(distance__lte=f'{radius_km} km').order_by('distance')
            
            request.user_location = (float(lat), float(lon))
            serializer = SupermarcheListSerializer(
                supermarches, many=True, context={'request': request}
            )
            return Response(serializer.data)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid coordinates'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsSupermarketOwner])
    def my_supermarche(self, request):
        """Get current user's supermarket"""
        try:
            supermarche = request.user.supermarche
            serializer = SupermarcheDetailSerializer(supermarche, context={'request': request})
            return Response(serializer.data)
        except Supermarche.DoesNotExist:
            return Response({'error': 'Supermarket not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated, IsSupermarketOwner, IsApproved])
    def update_profile(self, request):
        """Update supermarket profile"""
        try:
            supermarche = request.user.supermarche
            serializer = SupermarcheUpdateSerializer(
                supermarche, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Supermarche.DoesNotExist:
            return Response({'error': 'Supermarket not found'}, status=status.HTTP_404_NOT_FOUND)
