from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from apps.livreurs.models import Livreur, StatistiquesLivreur
from apps.users.serializers import UserSerializer

class LivreurDetailSerializer(GeoFeatureModelSerializer):
    user = UserSerializer(read_only=True)
    days_until_license_expiry = serializers.SerializerMethodField()
    days_until_insurance_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = Livreur
        geo_field = 'current_position'
        fields = [
            'id', 'user', 'vehicle_type', 'vehicle_brand', 'vehicle_model',
            'vehicle_year', 'vehicle_plate', 'vehicle_color', 'driver_license_number',
            'driver_license_expiry', 'insurance_number', 'insurance_expiry',
            'current_latitude', 'current_longitude', 'status', 'action_radius_km',
            'average_rating', 'delivery_count', 'total_earnings',
            'days_until_license_expiry', 'days_until_insurance_expiry',
            'is_verified', 'is_active', 'date_started', 'date_created'
        ]
        read_only_fields = [
            'id', 'user', 'average_rating', 'delivery_count', 'total_earnings',
            'is_verified', 'is_active', 'date_started', 'date_created'
        ]
    
    def get_days_until_license_expiry(self, obj):
        if obj.driver_license_expiry:
            from datetime import date
            days = (obj.driver_license_expiry - date.today()).days
            return max(0, days)
        return None
    
    def get_days_until_insurance_expiry(self, obj):
        if obj.insurance_expiry:
            from datetime import date
            days = (obj.insurance_expiry - date.today()).days
            return max(0, days)
        return None

class LivreurUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Livreur
        fields = [
            'vehicle_type', 'vehicle_brand', 'vehicle_model', 'vehicle_year',
            'vehicle_plate', 'vehicle_color', 'driver_license_number',
            'driver_license_expiry', 'insurance_number', 'insurance_expiry',
            'action_radius_km'
        ]

class LivreurPositionSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)

class LivreurStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['HORS_LIGNE', 'EN_LIGNE', 'EN_PAUSE'])

class StatistiquesLivreurSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatistiquesLivreur
        fields = [
            'id', 'date', 'deliveries_today', 'deliveries_week', 'deliveries_month',
            'earnings_today', 'earnings_week', 'earnings_month',
            'distance_today_km', 'distance_week_km', 'distance_month_km',
            'active_time_minutes', 'average_rating_period'
        ]
        read_only_fields = fields
