from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from apps.restaurants.models import Restaurant
from apps.users.serializers import UserSerializer
import logging

logger = logging.getLogger(__name__)

class RestaurantListSerializer(GeoFeatureModelSerializer):
    distance_km = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        geo_field = 'position'
        fields = [
            'id', 'commercial_name', 'cuisine_type', 'logo', 'average_rating',
            'review_count', 'price_level', 'is_open', 'base_delivery_fee', 
            'distance_km', 'full_address', 'avg_preparation_time'
        ]
    
    def get_distance_km(self, obj):
        """Calculate distance between user and restaurant with robust error handling"""
        request = self.context.get('request')
        
        if not request or not hasattr(request, 'user_location'):
            return None
        
        user_location = request.user_location
        
        # Validate user_location format
        if not user_location or not isinstance(user_location, (tuple, list)) or len(user_location) != 2:
            logger.warning(f"[SERIALIZER] Invalid user_location format: {user_location}")
            return None
        
        try:
            user_lat, user_lon = float(user_location[0]), float(user_location[1])
            
            # Get restaurant coordinates
            if obj.latitude is None or obj.longitude is None:
                logger.warning(f"[SERIALIZER] Restaurant {obj.id} has null coordinates")
                return None
            
            rest_lat = float(obj.latitude)
            rest_lon = float(obj.longitude)
            
            # Calculate distance using geopy
            from geopy.distance import geodesic
            distance = geodesic(
                (user_lat, user_lon),
                (rest_lat, rest_lon)
            ).kilometers
            
            return round(distance, 2)
            
        except (ValueError, TypeError) as e:
            logger.error(f"[SERIALIZER] Error calculating distance for restaurant {obj.id}: {e}")
            return None
        except Exception as e:
            logger.exception(f"[SERIALIZER] Unexpected error calculating distance: {e}")
            return None

class RestaurantDetailSerializer(GeoFeatureModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Restaurant
        geo_field = 'position'
        fields = [
            'id', 'user', 'commercial_name', 'legal_name', 'description',
            'cuisine_type', 'logo', 'cover_image', 'latitude', 'longitude',
            'delivery_radius_km', 'opening_hours', 'avg_preparation_time',
            'average_rating', 'review_count', 'price_level', 'base_delivery_fee',
            'min_order_amount', 'is_open', 'is_active'
        ]
        read_only_fields = [
            'id', 'user', 'average_rating', 'review_count', 'is_active'
        ]

class RestaurantUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            'commercial_name', 'legal_name', 'description', 'logo', 'cover_image',
            'delivery_radius_km', 'opening_hours', 'avg_preparation_time',
            'price_level', 'base_delivery_fee', 'min_order_amount', 'is_open',
            'cuisine_type', 'full_address'
        ]
