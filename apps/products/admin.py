from django.contrib import admin
from apps.products.models import Produit

@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'available', 'stock', 'sales_count')
    list_filter = ('available', 'unit', 'date_created')
    search_fields = ('name', 'category')
    readonly_fields = ('sales_count', 'date_created')
    
    fieldsets = (
        ('Informations', {
            'fields': ('name', 'description', 'category', 'price', 'image')
        }),
        ('Détails', {
            'fields': ('unit', 'available', 'stock', 'preparation_time')
        }),
        ('Promotion', {
            'fields': ('discount_percentage', 'discounted_price')
        }),
        ('Statut', {
            'fields': ('sales_count', 'date_created')
        }),
    )
