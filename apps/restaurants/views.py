import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.db.models import Q
from apps.restaurants.models import Restaurant, CategorieRestaurant
from apps.restaurants.serializers import (
    RestaurantListSerializer, RestaurantDetailSerializer, 
    RestaurantUpdateSerializer
)
from apps.users.permissions import IsRestaurantOwner, IsApproved

logger = logging.getLogger(__name__)

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.filter(is_active=True, user__is_approved=True)
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RestaurantDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return RestaurantUpdateSerializer
        return RestaurantListSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search restaurants by name or description"""
        query = request.query_params.get('q', '').strip()
        logger.info(f"[RESTAURANTS] search endpoint called with query: '{query}'")

        if not query:
            logger.warning("[RESTAURANTS] Empty search query provided")
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()
        restaurants = queryset.filter(
            Q(commercial_name__icontains=query) |
            Q(description__icontains=query) |
            Q(cuisine_type__icontains=query)
        )

        result_count = restaurants.count()
        logger.info(f"[RESTAURANTS] Found {result_count} restaurants matching query '{query}'")

        serializer = RestaurantListSerializer(restaurants, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get nearby restaurants with distance"""
        logger.info(f"[RESTAURANTS] nearby endpoint called with params: {request.query_params}")
        
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius_km = request.query_params.get('radius', 5)
        
        logger.info(f"[RESTAURANTS] Parsed params - lat: {lat}, lon: {lon}, radius: {radius_km}")
        
        if not lat or not lon:
            logger.warning(f"[RESTAURANTS] Missing coordinates - lat: {lat}, lon: {lon}")
            return Response({'error': 'Latitude and longitude required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            lat_float = float(lat)
            lon_float = float(lon)
            radius_float = float(radius_km)
            
            logger.info(f"[RESTAURANTS] Converting to float - lat: {lat_float}, lon: {lon_float}, radius: {radius_float}")
            
            # Validate coordinate ranges
            if not (-90 <= lat_float <= 90):
                logger.warning(f"[RESTAURANTS] Invalid latitude: {lat_float}")
                return Response({'error': 'Invalid latitude value. Must be between -90 and 90.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not (-180 <= lon_float <= 180):
                logger.warning(f"[RESTAURANTS] Invalid longitude: {lon_float}")
                return Response({'error': 'Invalid longitude value. Must be between -180 and 180.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create point with SRID 4326 (WGS84 - standard GPS coordinates)
            user_location = Point(lon_float, lat_float, srid=4326)
            
            # Log queryset info
            queryset = self.get_queryset()
            total_restaurants = queryset.count()
            logger.info(f"[RESTAURANTS] Total active/approved restaurants: {total_restaurants}")
            
            # Check how many have valid positions
            restaurants_with_position = queryset.exclude(position__isnull=True).count()
            logger.info(f"[RESTAURANTS] Restaurants with valid position: {restaurants_with_position}")
            
            restaurants = queryset.annotate(
                distance=Distance('position', user_location)
            ).filter(distance__lte=D(km=radius_float)).order_by('distance')
            
            result_count = restaurants.count()
            logger.info(f"[RESTAURANTS] Restaurants found within {radius_float}km: {result_count}")
            
            if result_count == 0:
                logger.info(f"[RESTAURANTS] No restaurants found in radius, returning empty list")
                return Response([])
            
            request.user_location = (lat_float, lon_float)
            serializer = RestaurantListSerializer(
                restaurants, many=True, context={'request': request}
            )
            logger.info(f"[RESTAURANTS] Successfully serialized {result_count} restaurants")
            return Response(serializer.data)
        except ValueError as e:
            logger.error(f"[RESTAURANTS] ValueError in nearby endpoint: {e}")
            return Response(
                {'error': f'Invalid coordinate format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"[RESTAURANTS] Unexpected error in nearby endpoint: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def menu(self, request, pk=None):
        """Get restaurant menu"""
        restaurant = self.get_object()
        from apps.products.models import Produit
        products = Produit.objects.filter(restaurant=restaurant, available=True)
        from apps.products.serializers import ProduitSerializer
        serializer = ProduitSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsRestaurantOwner])
    def my_restaurant(self, request):
        """Get current user's restaurant"""
        try:
            restaurant = request.user.restaurant
            serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
            return Response(serializer.data)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated, IsRestaurantOwner, IsApproved])
    def update_profile(self, request):
        """Update restaurant profile"""
        try:
            restaurant = request.user.restaurant
            serializer = RestaurantUpdateSerializer(
                restaurant, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
