from rest_framework import serializers
from apps.products.models import Produit

class ProduitSerializer(serializers.ModelSerializer):
    discount_price = serializers.SerializerMethodField()
    restaurant = serializers.SerializerMethodField()
    supermarche = serializers.SerializerMethodField()
    
    class Meta:
        model = Produit
        fields = [
            'id', 'name', 'description', 'price', 'discount_percentage',
            'discount_price', 'image', 'category', 'unit', 'available',
            'stock', 'preparation_time', 'sales_count', 'restaurant', 'supermarche'
        ]
        read_only_fields = ['id', 'sales_count']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure price is never null, default to 0 if null
        if data.get('price') is None:
            data['price'] = 0
        return data
    
    def get_discount_price(self, obj):
        return obj.discounted_price
    
    def get_restaurant(self, obj):
        if obj.restaurant:
            return {
                'id': obj.restaurant.id,
                'name': obj.restaurant.commercial_name
            }
        return None
    
    def get_supermarche(self, obj):
        if obj.supermarche:
            return {
                'id': obj.supermarche.id,
                'name': obj.supermarche.commercial_name
            }
        return None

class ProduitCreateUpdateSerializer(serializers.ModelSerializer):
    restaurant = serializers.CharField(required=False, allow_null=True)
    supermarche = serializers.CharField(required=False, allow_null=True)
    
    class Meta:
        model = Produit
        fields = [
            'name', 'description', 'price', 'image', 'category',
            'unit', 'available', 'stock', 'preparation_time',
            'discount_percentage', 'restaurant', 'supermarche'
        ]
