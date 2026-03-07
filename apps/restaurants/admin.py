from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin
from apps.restaurants.models import Restaurant, CategorieRestaurant

@admin.register(Restaurant)
class RestaurantAdmin(GeoModelAdmin):
    list_display = ('commercial_name', 'cuisine_type', 'is_active', 'is_open', 'average_rating')
    list_filter = ('cuisine_type', 'is_active', 'is_open', 'date_created')
    search_fields = ('commercial_name', 'user__email')
    readonly_fields = ('average_rating', 'review_count', 'date_created', 'date_approved')
    
    fieldsets = (
        ('Informations', {
            'fields': ('user', 'commercial_name', 'legal_name', 'description', 'cuisine_type')
        }),
        ('Documents', {
            'fields': ('rccm_number', 'tax_number', 'restaurant_license')
        }),
        ('Images', {
            'fields': ('logo', 'cover_image')
        }),
        ('Localisation', {
            'fields': ('position', 'latitude', 'longitude', 'full_address', 'delivery_radius_km')
        }),
        ('Horaires', {
            'fields': ('opening_hours', 'avg_preparation_time', 'is_open')
        }),
        ('Évaluation', {
            'fields': ('average_rating', 'review_count', 'price_level')
        }),
        ('Tarification', {
            'fields': ('base_delivery_fee', 'min_order_amount', 'commission_percentage')
        }),
        ('Statut', {
            'fields': ('is_active', 'date_approved', 'date_created')
        }),
    )

@admin.register(CategorieRestaurant)
class CategorieRestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'display_order')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('display_order',)
