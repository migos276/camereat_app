from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin
from apps.supermarches.models import Supermarche, CategorieSupermarche

@admin.register(Supermarche)
class SupermarcheAdmin(GeoModelAdmin):
    list_display = ('commercial_name', 'is_active', 'is_open', 'average_rating', 'product_count')
    list_filter = ('is_active', 'is_open', 'date_created')
    search_fields = ('commercial_name', 'user__email')
    readonly_fields = ('average_rating', 'review_count', 'product_count', 'date_created', 'date_approved')
    
    fieldsets = (
        ('Informations', {
            'fields': ('user', 'commercial_name', 'legal_name', 'description')
        }),
        ('Documents', {
            'fields': ('rccm_number', 'tax_number')
        }),
        ('Images', {
            'fields': ('logo', 'cover_image')
        }),
        ('Localisation', {
            'fields': ('position', 'latitude', 'longitude', 'full_address', 'delivery_radius_km')
        }),
        ('Horaires', {
            'fields': ('opening_hours', 'is_open')
        }),
        ('Évaluation', {
            'fields': ('average_rating', 'review_count', 'product_count')
        }),
        ('Tarification', {
            'fields': ('base_delivery_fee', 'min_order_amount', 'commission_percentage')
        }),
        ('Statut', {
            'fields': ('is_active', 'date_approved', 'date_created')
        }),
    )

@admin.register(CategorieSupermarche)
class CategorieSupermarceAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'display_order')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('display_order',)
