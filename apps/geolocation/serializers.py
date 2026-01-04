from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from apps.geolocation.models import ZoneLivraison, TrajetLivraison

class ZoneLivraisonSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ZoneLivraison
        geo_field = 'polygon'
        fields = [
            'id', 'name', 'city', 'neighborhoods', 'base_delivery_fee',
            'additional_fee_per_km', 'average_delivery_time', 'is_active'
        ]

class TrajetLivraisonSerializer(GeoFeatureModelSerializer):
    livreur_info = serializers.SerializerMethodField()
    
    class Meta:
        model = TrajetLivraison
        geo_field = 'route'
        fields = [
            'id', 'commande', 'livreur', 'livreur_info', 'distance_km',
            'duration_minutes', 'date_start', 'date_end', 'stops'
        ]
    
    def get_livreur_info(self, obj):
        return {
            'id': obj.livreur.user.id,
            'name': obj.livreur.user.get_full_name(),
            'phone': obj.livreur.user.phone,
        }

class GeocodingSerializer(serializers.Serializer):
    address = serializers.CharField(required=False)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)

class DistanceCalculationSerializer(serializers.Serializer):
    start_lat = serializers.DecimalField(max_digits=9, decimal_places=6)
    start_lon = serializers.DecimalField(max_digits=9, decimal_places=6)
    end_lat = serializers.DecimalField(max_digits=9, decimal_places=6)
    end_lon = serializers.DecimalField(max_digits=9, decimal_places=6)

class RouteCalculationSerializer(serializers.Serializer):
    start_lat = serializers.DecimalField(max_digits=9, decimal_places=6)
    start_lon = serializers.DecimalField(max_digits=9, decimal_places=6)
    end_lat = serializers.DecimalField(max_digits=9, decimal_places=6)
    end_lon = serializers.DecimalField(max_digits=9, decimal_places=6)

class ZoneVerificationSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
