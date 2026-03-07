from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin
from apps.geolocation.models import ZoneLivraison, TrajetLivraison

@admin.register(ZoneLivraison)
class ZoneLivraisonAdmin(GeoModelAdmin):
    list_display = ('name', 'city', 'base_delivery_fee', 'is_active')
    list_filter = ('city', 'is_active')
    search_fields = ('name', 'city')
    ordering = ('city', 'name')
    
    fieldsets = (
        ('Informations', {
            'fields': ('name', 'city', 'neighborhoods', 'is_active')
        }),
        ('Tarification', {
            'fields': ('base_delivery_fee', 'additional_fee_per_km', 'average_delivery_time')
        }),
        ('Géolocalisation', {
            'fields': ('polygon',)
        }),
    )

@admin.register(TrajetLivraison)
class TrajetLivraisonAdmin(GeoModelAdmin):
    list_display = ('commande', 'livreur', 'distance_km', 'duration_minutes')
    list_filter = ('date_start', 'date_end')
    search_fields = ('commande__numero', 'livreur__user__email')
    readonly_fields = ('date_start', 'date_end')
    
    fieldsets = (
        ('Commande & Livreur', {
            'fields': ('commande', 'livreur')
        }),
        ('Trajet', {
            'fields': ('route', 'distance_km', 'duration_minutes', 'stops')
        }),
        ('Dates', {
            'fields': ('date_start', 'date_end')
        }),
    )
