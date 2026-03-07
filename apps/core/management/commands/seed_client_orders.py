"""
Django management command to create test orders for clients.
Usage: python manage.py seed_client_orders
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Creates test orders for clients to test the My Orders screen'

    def add_arguments(self, parser):
        parser.add_argument(
            '--orders-per-client',
            type=int,
            default=5,
            help='Number of orders to create per client',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing orders before creating new ones',
        )

    def handle(self, *args, **options):
        orders_per_client = options['orders_per_client']
        clear_existing = options['clear_existing']

        self.stdout.write(self.style.SUCCESS('🚀 Starting order seeding...'))
        
        if clear_existing:
            self.clear_orders()
        
        # Create orders
        self.create_orders(orders_per_client)
        
        self.stdout.write(self.style.SUCCESS('✅ Order seeding completed successfully!'))
    
    def clear_orders(self):
        """Clear existing orders"""
        self.stdout.write('🗑️  Clearing existing orders...')
        
        from apps.orders.models import Commande, LigneCommande, Avis
        
        LigneCommande.objects.all().delete()
        Avis.objects.all().delete()
        Commande.objects.all().delete()
        
        self.stdout.write('   Orders cleared!')
    
    def create_orders(self, orders_per_client=5):
        """Create test orders for clients"""
        self.stdout.write('📦 Creating test orders...')
        
        from django.contrib.auth import get_user_model
        from apps.orders.models import Commande, LigneCommande
        from apps.products.models import Produit
        from apps.restaurants.models import Restaurant
        from apps.supermarches.models import Supermarche
        from django.contrib.gis.geos import Point
        
        User = get_user_model()
        
        # Get clients
        clients = list(User.objects.filter(user_type='CLIENT'))
        if not clients:
            self.stdout.write(self.style.ERROR('❌ No client users found. Run seed_data first!'))
            return
        
        # Get restaurants and products
        restaurants = list(Restaurant.objects.all())
        restaurant_products = list(Produit.objects.filter(restaurant__isnull=False))
        
        # Get supermarkets and products
        supermarkets = list(Supermarche.objects.all())
        supermarket_products = list(Produit.objects.filter(supermarche__isnull=False))
        
        # Order statuses
        statuses = [
            'EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION', 'PRETE', 
            'EN_LIVRAISON', 'LIVREE', 'ANNULEE'
        ]
        
        # Payment modes
        payment_modes = ['ESPECES', 'CARTE', 'MOBILE_MONEY']
        
        total_orders = 0
        
        for client in clients:
            self.stdout.write(f'   Creating orders for: {client.email}')
            
            # Mix of restaurant and supermarket orders
            for i in range(orders_per_client):
                is_restaurant_order = random.random() > 0.3  # 70% restaurant orders
                
                if is_restaurant_order and restaurants and restaurant_products:
                    restaurant = random.choice(restaurants)
                    products = [p for p in restaurant_products if p.restaurant_id == restaurant.id]
                    if not products:
                        products = random.sample(restaurant_products, min(3, len(restaurant_products)))
                elif supermarkets and supermarket_products:
                    supermarket = random.choice(supermarkets)
                    products = [p for p in supermarket_products if p.supermarche_id == supermarket.id]
                    if not products:
                        products = random.sample(supermarket_products, min(3, len(supermarket_products)))
                    restaurant = None
                else:
                    continue
                
                # Select random status (more likely to have delivered/completed orders)
                status_weights = [10, 15, 15, 15, 10, 20, 15]  # Higher weight for delivered
                status = random.choices(statuses, weights=status_weights, k=1)[0]
                
                # Calculate amounts
                items_data = []
                products_amount = 0
                
                num_items = random.randint(1, 4)
                selected_products = random.sample(products, min(num_items, len(products)))
                
                for product in selected_products:
                    quantity = random.randint(1, 3)
                    line_total = float(product.price) * quantity
                    products_amount += line_total
                    
                    items_data.append({
                        'produit': product,
                        'quantity': quantity,
                        'unit_price': product.price,
                        'line_total': line_total,
                    })
                
                delivery_fee = float(restaurant.base_delivery_fee if restaurant else (supermarket.base_delivery_fee if supermarket else 500))
                platform_commission = products_amount * 0.10  # 10% commission
                total_amount = products_amount + delivery_fee + float(platform_commission)
                
                # Create order
                order = Commande.objects.create(
                    client=client,
                    restaurant=restaurant,
                    supermarche=supermarket if not restaurant else None,
                    delivery_address_text=f"{random.randint(1, 999)} Rue Principal, Douala, Cameroun",
                    delivery_position=Point(9.7679 + random.uniform(-0.01, 0.01), 4.0511 + random.uniform(-0.01, 0.01)),
                    distance_km=random.uniform(1, 10),
                    estimated_duration_minutes=random.randint(15, 60),
                    status=status,
                    products_amount=products_amount,
                    delivery_fee=delivery_fee,
                    platform_commission=platform_commission,
                    total_amount=total_amount,
                    payment_mode=random.choice(payment_modes),
                    payment_status='PAYE' if status in ['LIVREE', 'EN_LIVRAISON'] else 'EN_ATTENTE',
                    special_instructions=random.choice(['', '', '', 'Merci de frapper à la porte', 'Laisser à la réception', 'Appeler à l\'arrivée']),
                    
                    # Set dates based on status
                    date_created=timezone.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23)),
                )
                
                # Set OTP code for delivered orders
                if status == 'LIVREE':
                    order.otp_code = f"{random.randint(100000, 999999)}"
                    order.date_delivered = order.date_created + timedelta(hours=random.randint(1, 4))
                    order.save()
                
                # Create order items
                for item_data in items_data:
                    LigneCommande.objects.create(
                        commande=order,
                        **item_data
                    )
                
                total_orders += 1
                self.stdout.write(f'      Created order: {order.numero} - {status}')
        
        self.stdout.write(self.style.SUCCESS(f'   Total orders created: {total_orders}'))
        
        # Show order statistics by status
        self.stdout.write('\n📊 Order Statistics by Status:')
        from django.db.models import Count
        status_counts = Commande.objects.values('status').annotate(count=Count('id'))
        for status_count in status_counts:
            self.stdout.write(f'   {status_count["status"]}: {status_count["count"]} orders')

