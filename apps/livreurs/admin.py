from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin
from apps.livreurs.models import Livreur, StatistiquesLivreur

@admin.register(Livreur)
class LivreurAdmin(GeoModelAdmin):
    list_display = ('get_full_name', 'vehicle_type', 'status', 'is_verified', 'average_rating')
    list_filter = ('vehicle_type', 'status', 'is_verified', 'date_created')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('average_rating', 'delivery_count', 'total_earnings', 'date_created')
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Véhicule', {
            'fields': ('vehicle_type', 'vehicle_brand', 'vehicle_model', 'vehicle_year', 'vehicle_plate', 'vehicle_color')
        }),
        ('Permis & Assurance', {
            'fields': ('driver_license_number', 'driver_license_expiry', 'insurance_number', 'insurance_expiry')
        }),
        ('Localisation', {
            'fields': ('current_position', 'current_latitude', 'current_longitude', 'last_position_update')
        }),
        ('Statut', {
            'fields': ('status', 'action_radius_km', 'is_verified', 'is_active')
        }),
        ('Performance', {
            'fields': ('average_rating', 'delivery_count', 'total_earnings')
        }),
        ('Paiement', {
            'fields': ('bank_account', 'commission_type', 'commission_value')
        }),
        ('Dates', {
            'fields': ('date_approved', 'date_started', 'date_created')
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Nom'

@admin.register(StatistiquesLivreur)
class StatistiquesLivreurAdmin(admin.ModelAdmin):
    list_display = ('get_livreur_name', 'date', 'deliveries_today', 'earnings_today', 'distance_today_km')
    list_filter = ('date',)
    search_fields = ('livreur__user__email',)
    readonly_fields = ['date']
    
    fieldsets = (
        ('Livreur', {
            'fields': ('livreur', 'date')
        }),
        ('Livraisons', {
            'fields': ('deliveries_today', 'deliveries_week', 'deliveries_month')
        }),
        ('Gains', {
            'fields': ('earnings_today', 'earnings_week', 'earnings_month')
        }),
        ('Distance', {
            'fields': ('distance_today_km', 'distance_week_km', 'distance_month_km')
        }),
        ('Performance', {
            'fields': ('active_time_minutes', 'average_rating_period')
        }),
    )
    
    def get_livreur_name(self, obj):
        return obj.livreur.user.get_full_name()
    get_livreur_name.short_description = 'Livreur'
