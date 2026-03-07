from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from apps.supermarches.models import Supermarche, CategorieSupermarche
from apps.users.serializers import UserSerializer

class CategorieSupermarceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieSupermarche
        fields = ['id', 'name', 'slug', 'icon', 'color']

class SupermarcheListSerializer(GeoFeatureModelSerializer):
    distance_km = serializers.SerializerMethodField()
    
    class Meta:
        model = Supermarche
        geo_field = 'position'
        fields = [
            'id', 'commercial_name', 'logo', 'average_rating', 'review_count',
            'base_delivery_fee', 'product_count', 'is_open', 'distance_km'
        ]
    
    def get_distance_km(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user_location'):
            from geopy.distance import geodesic
            dist = geodesic(
                request.user_location,
                (float(obj.latitude), float(obj.longitude))
            ).kilometers
            return round(dist, 2)
        return None

class SupermarcheDetailSerializer(GeoFeatureModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Supermarche
        geo_field = 'position'
        fields = [
            'id', 'user', 'commercial_name', 'legal_name', 'description',
            'logo', 'cover_image', 'latitude', 'longitude', 'delivery_radius_km',
            'opening_hours', 'average_rating', 'review_count', 'product_count',
            'base_delivery_fee', 'min_order_amount', 'is_open', 'is_active'
        ]
        read_only_fields = [
            'id', 'user', 'average_rating', 'review_count', 'product_count', 'is_active'
        ]

class SupermarcheUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supermarche
        fields = [
            'commercial_name', 'description', 'logo', 'cover_image',
            'delivery_radius_km', 'opening_hours', 'base_delivery_fee',
            'min_order_amount', 'is_open'
        ]
