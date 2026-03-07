from rest_framework import serializers
from apps.orders.models import Commande, LigneCommande, Avis, Promotion
from apps.products.serializers import ProduitSerializer
from decimal import Decimal

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
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('0'))
    delivery_address_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = Commande
        fields = [
            'restaurant', 'supermarche', 'delivery_address_text',
            'special_instructions', 'payment_mode', 'payment_phone',
            'campay_reference', 'operator', 'total_amount', 'delivery_fee', 'items',
            'delivery_address_id'
        ]
    
    def validate(self, attrs):
        if not attrs.get('restaurant') and not attrs.get('supermarche'):
            raise serializers.ValidationError(
                "Vous devez sélectionner un restaurant ou un supermarché."
            )
        if attrs.get('payment_mode') == 'MOBILE_MONEY' and not attrs.get('payment_phone'):
            raise serializers.ValidationError(
                {"payment_phone": "Le numéro de téléphone est requis pour Mobile Money."}
            )
        
        # Handle delivery_address_id - convert to delivery_address_text if provided
        delivery_address_id = attrs.pop('delivery_address_id', None)
        if delivery_address_id and not attrs.get('delivery_address_text'):
            from apps.users.models import Address
            try:
                address = Address.objects.get(id=delivery_address_id, user=self.context['request'].user)
                # Build address text from address fields
                address_parts = [address.street]
                if address.neighborhood:
                    address_parts.append(address.neighborhood)
                address_parts.append(address.city)
                if address.postal_code:
                    address_parts.append(address.postal_code)
                address_parts.append(address.country)
                attrs['delivery_address_text'] = ', '.join(filter(None, address_parts))
            except (Address.DoesNotExist, AttributeError):
                pass  # Will use delivery_address_text if already provided
        
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        requested_delivery_fee = validated_data.pop('delivery_fee', None)
        requested_total = validated_data.pop('total_amount', None)
        restaurant = validated_data.get('restaurant')
        supermarche = validated_data.get('supermarche')

        default_delivery_fee = Decimal('0')
        if requested_delivery_fee is not None:
            default_delivery_fee = Decimal(requested_delivery_fee)
        elif restaurant and getattr(restaurant, 'base_delivery_fee', None) is not None:
            default_delivery_fee = Decimal(restaurant.base_delivery_fee)
        elif supermarche and getattr(supermarche, 'base_delivery_fee', None) is not None:
            default_delivery_fee = Decimal(supermarche.base_delivery_fee)

        delivery_fee = default_delivery_fee

        products_amount = Decimal('0')
        line_items = []

        for item_data in items_data:
            produit = item_data['produit']
            quantity = item_data.get('quantity', 1)
            unit_price = getattr(produit, 'discounted_price', None) or produit.price
            line_total = unit_price * quantity
            products_amount += line_total
            line_items.append({
                'produit': produit,
                'quantity': quantity,
                'unit_price': unit_price,
                'line_total': line_total,
                'special_instructions': item_data.get('special_instructions', ''),
            })

        computed_total = products_amount + delivery_fee
        if requested_total is not None and Decimal(requested_total) < computed_total:
            raise serializers.ValidationError(
                {"total_amount": "Le total fourni est inférieur au montant calculé."}
            )
        total_amount = Decimal(requested_total) if requested_total is not None else computed_total

        commande = Commande.objects.create(
            products_amount=products_amount,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            **validated_data
        )

        for line_item in line_items:
            LigneCommande.objects.create(commande=commande, **line_item)

        return commande

class CommandeDetailSerializer(serializers.ModelSerializer):
    items = LigneCommandeSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.commercial_name', read_only=True)
    livreur_name = serializers.CharField(source='livreur.user.get_full_name', read_only=True)
    # USSD code is not stored but can be passed through for response
    ussd_code = serializers.SerializerMethodField()
    
    class Meta:
        model = Commande
        fields = [
            'id', 'numero', 'status', 'restaurant_name', 'livreur_name',
            'delivery_address_text', 'distance_km', 'estimated_duration_minutes',
            'products_amount', 'delivery_fee', 'platform_commission', 'total_amount',
            'payment_mode', 'payment_status', 'payment_phone', 'campay_reference',
            'operator', 'ussd_code', 'special_instructions', 'items',
            'date_created', 'date_accepted', 'date_delivered'
        ]
        read_only_fields = [
            'id', 'numero', 'status', 'distance_km', 'estimated_duration_minutes',
            'products_amount', 'delivery_fee', 'platform_commission', 'total_amount',
            'date_created', 'date_accepted', 'date_delivered'
        ]
    
    def get_ussd_code(self, obj):
        # USSD code is not stored in the model, but we can return a default based on operator
        # In production, this should be stored when initiating payment
        if obj.operator == 'MTN':
            return '*126#'
        elif obj.operator == 'ORANGE':
            return '#150*50#'
        return None

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
