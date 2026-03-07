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

class DailyEarningsSerializer(serializers.Serializer):
    """Serializer for daily earnings breakdown"""
    date = serializers.DateField()
    day_name = serializers.CharField()
    earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    deliveries = serializers.IntegerField()

class RevenusLivreurSerializer(serializers.Serializer):
    """Serializer for delivery person earnings"""
    total_earnings_week = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_earnings_month = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    deliveries_week = serializers.IntegerField(default=0)
    bonuses = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    daily_breakdown = DailyEarningsSerializer(many=True, default=[])
    
    weekly_goal = serializers.IntegerField(default=25)
    weekly_goal_progress = serializers.FloatField(default=0)
    
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, default=4.5)
    average_delivery_time = serializers.IntegerField(default=22)  # in minutes
    completion_rate = serializers.FloatField(default=0.95)
    
    def to_internal_value(self, data):
        """Ensure all fields have defaults when data is missing"""
        if not data or not isinstance(data, dict):
            return {
                'total_earnings_week': 0,
                'total_earnings_month': 0,
                'deliveries_week': 0,
                'bonuses': 0,
                'daily_breakdown': [],
                'weekly_goal': 25,
                'weekly_goal_progress': 0,
                'average_rating': 4.5,
                'average_delivery_time': 22,
                'completion_rate': 0.95
            }
        return super().to_internal_value(data)
    
    def validate(self, attrs):
        """Validate and ensure all required fields exist"""
        if not attrs.get('daily_breakdown'):
            attrs['daily_breakdown'] = []
        return attrs
