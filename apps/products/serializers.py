from rest_framework import serializers
from apps.products.models import Produit

class ProduitSerializer(serializers.ModelSerializer):
    discount_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Produit
        fields = [
            'id', 'name', 'description', 'price', 'discount_percentage',
            'discount_price', 'image', 'category', 'unit', 'available',
            'stock', 'preparation_time', 'sales_count'
        ]
        read_only_fields = ['id', 'sales_count']
    
    def get_discount_price(self, obj):
        return obj.discounted_price

class ProduitCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = [
            'name', 'description', 'price', 'image', 'category',
            'unit', 'available', 'stock', 'preparation_time',
            'discount_percentage'
        ]
