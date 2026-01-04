from rest_framework import serializers
from apps.orders.models import Commande, LigneCommande, Avis, Promotion
from apps.products.serializers import ProduitSerializer

class LigneCommandeSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)
    
    class Meta:
        model = LigneCommande
        fields = ['id', 'produit', 'quantity', 'unit_price', 'line_total', 'special_instructions']
        read_only_fields = ['id', 'unit_price', 'line_total']

class LigneCommandeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneCommande
        fields = ['produit', 'quantity', 'special_instructions']

class CommandeCreateSerializer(serializers.ModelSerializer):
    items = LigneCommandeCreateSerializer(many=True, write_only=True)
    
    class Meta:
        model = Commande
        fields = [
            'restaurant', 'supermarche', 'delivery_address_text',
            'special_instructions', 'payment_mode', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        commande = Commande.objects.create(**validated_data)
        
        for item_data in items_data:
            LigneCommande.objects.create(commande=commande, **item_data)
        
        return commande

class CommandeDetailSerializer(serializers.ModelSerializer):
    items = LigneCommandeSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.commercial_name', read_only=True)
    livreur_name = serializers.CharField(source='livreur.user.get_full_name', read_only=True)
    
    class Meta:
        model = Commande
        fields = [
            'id', 'numero', 'status', 'restaurant_name', 'livreur_name',
            'delivery_address_text', 'distance_km', 'estimated_duration_minutes',
            'products_amount', 'delivery_fee', 'platform_commission', 'total_amount',
            'payment_mode', 'payment_status', 'special_instructions', 'items',
            'date_created', 'date_accepted', 'date_delivered'
        ]
        read_only_fields = [
            'id', 'numero', 'status', 'distance_km', 'estimated_duration_minutes',
            'products_amount', 'delivery_fee', 'platform_commission', 'total_amount',
            'date_created', 'date_accepted', 'date_delivered'
        ]

class AvisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avis
        fields = ['id', 'avis_type', 'rating', 'comment', 'response', 'date_created']
        read_only_fields = ['id', 'response', 'date_created']

class PromotionSerializer(serializers.ModelSerializer):
    is_active_now = serializers.SerializerMethodField()
    
    class Meta:
        model = Promotion
        fields = [
            'id', 'title', 'description', 'image', 'promo_type', 'value',
            'code', 'date_start', 'date_end', 'min_order_amount', 'is_active',
            'usage_count', 'is_active_now'
        ]
        read_only_fields = ['id', 'usage_count']
    
    def get_is_active_now(self, obj):
        from django.utils import timezone
        now = timezone.now()
        return obj.is_active and obj.date_start <= now <= obj.date_end
