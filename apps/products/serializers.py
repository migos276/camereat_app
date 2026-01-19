from rest_framework import serializers
from apps.products.models import Produit

class ProduitSerializer(serializers.ModelSerializer):
    discount_price = serializers.SerializerMethodField()
    restaurant = serializers.SerializerMethodField()
    supermarche = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()  # Modifier pour retourner l'URL complète
    
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
    
    def get_image(self, obj):
        """Retourne l'URL complète de l'image"""
        if obj.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            # Fallback si pas de request dans le context
            return obj.image.url
        return None
    
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
    # Support both 'name' and 'product_name' for backward compatibility
    name = serializers.CharField(required=False, allow_blank=True)
    product_name = serializers.CharField(required=False, allow_blank=True, source='name')
    
    def validate(self, attrs):
        # Make image required when restaurant is provided
        if attrs.get('restaurant') and not attrs.get('image'):
            raise serializers.ValidationError({
                "image": "Image is required when adding a product for a restaurant."
            })
        return attrs
    
    def to_internal_value(self, data):
        # Handle both 'name' and 'product_name' fields
        if 'name' in data and 'product_name' not in data:
            data = data.copy()
            data['product_name'] = data['name']
        return super().to_internal_value(data)
    
    class Meta:
        model = Produit
        fields = [
            'name', 'product_name', 'description', 'price', 'image', 'category',
            'unit', 'available', 'stock', 'preparation_time',
            'discount_percentage', 'restaurant', 'supermarche'
        ]
