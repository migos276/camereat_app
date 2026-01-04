from django.contrib import admin
from apps.orders.models import Commande, LigneCommande, Avis, Promotion

class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 1

@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('numero', 'client', 'status', 'total_amount', 'date_created')
    list_filter = ('status', 'payment_mode', 'date_created')
    search_fields = ('numero', 'client__email')
    readonly_fields = ('numero', 'distance_km', 'estimated_duration_minutes', 'date_created')
    inlines = [LigneCommandeInline]
    
    fieldsets = (
        ('Informations', {
            'fields': ('numero', 'client', 'restaurant', 'supermarche', 'livreur')
        }),
        ('Localisation', {
            'fields': ('start_position', 'delivery_position', 'delivery_address_text', 'distance_km')
        }),
        ('Durée', {
            'fields': ('estimated_duration_minutes',)
        }),
        ('Montants', {
            'fields': ('products_amount', 'delivery_fee', 'platform_commission', 'total_amount')
        }),
        ('Paiement', {
            'fields': ('payment_mode', 'payment_status')
        }),
        ('Statut', {
            'fields': ('status', 'special_instructions', 'cancellation_reason')
        }),
        ('Sécurité', {
            'fields': ('otp_code',)
        }),
        ('Dates', {
            'fields': ('date_created', 'date_accepted', 'date_preparation', 'date_collected', 'date_delivered', 'date_updated')
        }),
    )

@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    list_display = ('commande', 'avis_type', 'rating', 'is_flagged')
    list_filter = ('avis_type', 'rating', 'is_flagged')
    search_fields = ('commande__numero', 'comment')

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'promo_type', 'value', 'is_active')
    list_filter = ('promo_type', 'is_active', 'date_start')
    search_fields = ('code', 'title')
