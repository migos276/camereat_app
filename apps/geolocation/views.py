from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from apps.geolocation.models import ZoneLivraison, TrajetLivraison
from apps.geolocation.serializers import (
    ZoneLivraisonSerializer, GeocodingSerializer, DistanceCalculationSerializer,
    RouteCalculationSerializer, ZoneVerificationSerializer
)

geocoder = Nominatim(user_agent='quickdeliver')

class GeolocationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def geocode(self, request):
        """Convert address to coordinates"""
        serializer = GeocodingSerializer(data=request.data)
        if serializer.is_valid():
            try:
                location = geocoder.geocode(serializer.validated_data['address'])
                if location:
                    return Response({
                        'latitude': location.latitude,
                        'longitude': location.longitude,
                        'address': location.address,
                    })
                return Response(
                    {'error': 'Address not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reverse_geocode(self, request):
        """Convert coordinates to address"""
        serializer = GeocodingSerializer(data=request.data)
        if serializer.is_valid():
            try:
                location = geocoder.reverse(
                    f"{serializer.validated_data['latitude']}, {serializer.validated_data['longitude']}"
                )
                return Response({'address': location.address})
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def calculate_distance(self, request):
        """Calculate distance between two points"""
        serializer = DistanceCalculationSerializer(data=request.data)
        if serializer.is_valid():
            start = (
                serializer.validated_data['start_lat'],
                serializer.validated_data['start_lon']
            )
            end = (
                serializer.validated_data['end_lat'],
                serializer.validated_data['end_lon']
            )
            distance_km = geodesic(start, end).kilometers
            return Response({
                'distance_km': round(distance_km, 2),
                'distance_m': round(distance_km * 1000, 0),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def calculate_route(self, request):
        """Calculate route and estimated time"""
        serializer = RouteCalculationSerializer(data=request.data)
        if serializer.is_valid():
            start = (
                serializer.validated_data['start_lat'],
                serializer.validated_data['start_lon']
            )
            end = (
                serializer.validated_data['end_lat'],
                serializer.validated_data['end_lon']
            )
            distance_km = geodesic(start, end).kilometers
            
            avg_speed = 30
            estimated_minutes = int((distance_km / avg_speed) * 60) + 5
            
            return Response({
                'distance_km': round(distance_km, 2),
                'estimated_duration_minutes': estimated_minutes,
                'estimated_arrival': f"{estimated_minutes} minutes",
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def zones(self, request):
        """Get all active delivery zones"""
        zones = ZoneLivraison.objects.filter(is_active=True)
        serializer = ZoneLivraisonSerializer(zones, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def verifier_zone(self, request):
        """Verify if a position is within a delivery zone"""
        serializer = ZoneVerificationSerializer(data=request.data)
        if serializer.is_valid():
            point = Point(
                serializer.validated_data['longitude'],
                serializer.validated_data['latitude']
            )
            
            zones = ZoneLivraison.objects.filter(
                is_active=True,
                polygon__contains=point
            )
            
            if zones.exists():
                zone = zones.first()
                return Response({
                    'in_zone': True,
                    'zone': ZoneLivraisonSerializer(zone).data,
                })
            
            return Response({
                'in_zone': False,
                'available_zones': ZoneLivraisonSerializer(
                    ZoneLivraison.objects.filter(is_active=True),
                    many=True
                ).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ZoneLivraisonViewSet(viewsets.ModelViewSet):
    queryset = ZoneLivraison.objects.filter(is_active=True)
    serializer_class = ZoneLivraisonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            from apps.users.permissions import IsAdmin
            self.permission_classes = [IsAuthenticated, IsAdmin]
        return super().get_permissions()
