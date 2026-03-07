"""
Django management command to create test data for the application.
Usage: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates test data for the application'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Starting data seeding...'))
        
        # Clear existing data
        self.clear_data()
        
        # Create users
        self.create_users()
        
        # Create restaurants
        self.create_restaurants()
        
        # Create products for restaurants
        self.create_restaurant_products()
        
        # Create supermarkets
        self.create_supermarkets()
        
        # Create products for supermarkets
        self.create_supermarket_products()
        
        self.stdout.write(self.style.SUCCESS('✅ Data seeding completed successfully!'))
    
    def clear_data(self):
        """Clear existing test data"""
        self.stdout.write('🗑️  Clearing existing data...')
        
        from apps.orders.models import Commande, LigneCommande, Avis, Promotion
        from apps.products.models import Produit
        from apps.restaurants.models import Restaurant
        from apps.supermarches.models import Supermarche
        from apps.geolocation.models import ZoneLivraison
        from apps.users.models import Address
        
        # Delete in order (respect foreign keys)
        Commande.objects.all().delete()
        LigneCommande.objects.all().delete()
        Avis.objects.all().delete()
        Promotion.objects.all().delete()
        Produit.objects.all().delete()
        Restaurant.objects.all().delete()
        Supermarche.objects.all().delete()
        ZoneLivraison.objects.all().delete()
        Address.objects.all().delete()
        
        # Delete users (except superusers)
        User.objects.filter(is_superuser=False).delete()
        
        self.stdout.write('   Data cleared!')
    
    def create_users(self):
        """Create test users"""
        self.stdout.write('👤 Creating test users...')
        
        # Create client users
        clients_data = [
            {'email': 'client1@test.com', 'first_name': 'Jean', 'last_name': 'Dupont', 'phone': '+237600000001'},
            {'email': 'client2@test.com', 'first_name': 'Marie', 'last_name': 'Martin', 'phone': '+237600000002'},
            {'email': 'client3@test.com', 'first_name': 'Pierre', 'last_name': ' Durand', 'phone': '+237600000003'},
        ]
        
        for data in clients_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    **data,
                    'user_type': 'CLIENT',
                    'is_verified': True,
                    'is_approved': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'   Created client: {user.email}')
        
        # Create restaurant owners
        restaurants_data = [
            {'email': 'restaurant1@test.com', 'first_name': 'Chef', 'last_name': 'Ali', 'phone': '+237600000010'},
            {'email': 'restaurant2@test.com', 'first_name': 'Chef', 'last_name': 'Marie', 'phone': '+237600000011'},
            {'email': 'restaurant3@test.com', 'first_name': 'Chef', 'last_name': 'Jean', 'phone': '+237600000012'},
        ]
        
        for data in restaurants_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    **data,
                    'user_type': 'RESTAURANT',
                    'is_verified': True,
                    'is_approved': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'   Created restaurant owner: {user.email}')
        
        # Create supermarket owners
        supermarkets_data = [
            {'email': 'supermarche1@test.com', 'first_name': 'Manager', 'last_name': 'Super', 'phone': '+237600000020'},
            {'email': 'supermarche2@test.com', 'first_name': 'Manager', 'last_name': 'Market', 'phone': '+237600000021'},
        ]
        
        for data in supermarkets_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    **data,
                    'user_type': 'SUPERMARCHE',
                    'is_verified': True,
                    'is_approved': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'   Created supermarket owner: {user.email}')
        
        # Create livreurs
        livreurs_data = [
            {'email': 'livreur1@test.com', 'first_name': 'Livreur', 'last_name': 'Paul', 'phone': '+237600000030'},
            {'email': 'livreur2@test.com', 'first_name': 'Livreur', 'last_name': 'Jacques', 'phone': '+237600000031'},
            {'email': 'livreur3@test.com', 'first_name': 'Livreur', 'last_name': 'Michel', 'phone': '+237600000032'},
        ]
        
        for data in livreurs_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    **data,
                    'user_type': 'LIVREUR',
                    'is_verified': True,
                    'is_approved': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'   Created livreur: {user.email}')
        
        self.stdout.write(f'   Total users created: {User.objects.count()}')
    
    def create_restaurants(self):
        """Create test restaurants"""
        self.stdout.write('🍽️  Creating test restaurants...')
        
        from apps.restaurants.models import Restaurant
        
        restaurant_owners = User.objects.filter(user_type='RESTAURANT')
        
        restaurants_data = [
            {
                'user': restaurant_owners[0],
                'commercial_name': 'Le Petit Chef',
                'legal_name': 'Le Petit Chef SARL',
                'description': 'Restaurant familial serving delicious African and European cuisine. Our chef has 20 years of experience.',
                'cuisine_type': 'AFRICAIN',
                'full_address': '123 Rue de la Paix, Douala, Cameroun',
                'latitude': 4.0511,
                'longitude': 9.7679,
                'delivery_radius_km': 10,
                'avg_preparation_time': 30,
                'average_rating': 4.5,
                'review_count': 120,
                'price_level': '€€',
                'base_delivery_fee': 500,
                'min_order_amount': 2000,
                'is_open': True,
                'is_active': True,
            },
            {
                'user': restaurant_owners[1],
                'commercial_name': 'Pizza Italia',
                'legal_name': 'Pizza Italia Cameroon',
                'description': 'Authentic Italian pizza with fresh ingredients imported from Italy. Best pizza in town!',
                'cuisine_type': 'PIZZA',
                'full_address': '456 Avenue des Cocotiers, Douala, Cameroun',
                'latitude': 4.0551,
                'longitude': 9.7699,
                'delivery_radius_km': 8,
                'avg_preparation_time': 25,
                'average_rating': 4.8,
                'review_count': 250,
                'price_level': '€€',
                'base_delivery_fee': 400,
                'min_order_amount': 1500,
                'is_open': True,
                'is_active': True,
            },
            {
                'user': restaurant_owners[2],
                'commercial_name': 'Sushi Master',
                'legal_name': 'Sushi Master Sarl',
                'description': 'Fresh sushi and Japanese cuisine. We use only the freshest fish available.',
                'cuisine_type': 'SUSHI',
                'full_address': '789 Boulevard de la Liberté, Douala, Cameroun',
                'latitude': 4.0591,
                'longitude': 9.7719,
                'delivery_radius_km': 12,
                'avg_preparation_time': 35,
                'average_rating': 4.6,
                'review_count': 180,
                'price_level': '€€€',
                'base_delivery_fee': 600,
                'min_order_amount': 3000,
                'is_open': True,
                'is_active': True,
            },
        ]
        
        for data in restaurants_data:
            restaurant, created = Restaurant.objects.get_or_create(
                user=data['user'],
                defaults=data
            )
            if created:
                self.stdout.write(f'   Created restaurant: {restaurant.commercial_name}')
        
        self.stdout.write(f'   Total restaurants created: {Restaurant.objects.count()}')
    
    def create_restaurant_products(self):
        """Create products for restaurants"""
        self.stdout.write('🍔 Creating restaurant products...')
        
        from apps.products.models import Produit
        from apps.restaurants.models import Restaurant
        
        restaurants = Restaurant.objects.all()
        
        products_data = [
            # Le Petit Chef products
            {
                'restaurant': restaurants[0] if len(restaurants) > 0 else None,
                'name': 'Poulet DG',
                'description': 'Classic Cameroonian chicken with fried plantains',
                'price': 3500,
                'category': 'Plats principaux',
                'unit': 'UNITE',
                'available': True,
                'stock': 50,
                'preparation_time': 25,
            },
            {
                'restaurant': restaurants[0] if len(restaurants) > 0 else None,
                'name': 'Ndolé',
                'description': 'Bitter leaves stew with shrimp and peanuts',
                'price': 3000,
                'category': 'Plats principaux',
                'unit': 'UNITE',
                'available': True,
                'stock': 30,
                'preparation_time': 30,
            },
            {
                'restaurant': restaurants[0] if len(restaurants) > 0 else None,
                'name': 'Eru avecokok',
                'description': 'Traditional Eru soup with yellow soup',
                'price': 3200,
                'category': 'Plats principaux',
                'unit': 'UNITE',
                'available': True,
                'stock': 25,
                'preparation_time': 35,
            },
            {
                'restaurant': restaurants[0] if len(restaurants) > 0 else None,
                'name': 'Poulet Rôti',
                'description': 'Grilled chicken with spices',
                'price': 2800,
                'category': 'Plats principaux',
                'unit': 'UNITE',
                'available': True,
                'stock': 40,
                'preparation_time': 20,
            },
            {
                'restaurant': restaurants[0] if len(restaurants) > 0 else None,
                'name': 'Frites',
                'description': 'Crispy french fries',
                'price': 1000,
                'category': 'Accompagnements',
                'unit': 'UNITE',
                'available': True,
                'stock': 100,
                'preparation_time': 10,
            },
            {
                'restaurant': restaurants[0] if len(restaurants) > 0 else None,
                'name': 'Jus de Gingembre',
                'description': 'Fresh ginger juice',
                'price': 500,
                'category': 'Boissons',
                'unit': 'LITRE',
                'available': True,
                'stock': 50,
                'preparation_time': 5,
            },
            # Pizza Italia products
            {
                'restaurant': restaurants[1] if len(restaurants) > 1 else None,
                'name': 'Margherita',
                'description': 'Tomato sauce, mozzarella, fresh basil',
                'price': 2500,
                'category': 'Pizzas',
                'unit': 'UNITE',
                'available': True,
                'stock': 30,
                'preparation_time': 15,
            },
            {
                'restaurant': restaurants[1] if len(restaurants) > 1 else None,
                'name': 'Pepperoni',
                'description': 'Tomato sauce, mozzarella, pepperoni',
                'price': 3000,
                'category': 'Pizzas',
                'unit': 'UNITE',
                'available': True,
                'stock': 25,
                'preparation_time': 15,
            },
            {
                'restaurant': restaurants[1] if len(restaurants) > 1 else None,
                'name': 'Quattro Formaggi',
                'description': 'Four cheeses pizza',
                'price': 3500,
                'category': 'Pizzas',
                'unit': 'UNITE',
                'available': True,
                'stock': 20,
                'preparation_time': 18,
            },
            {
                'restaurant': restaurants[1] if len(restaurants) > 1 else None,
                'name': 'Calzone',
                'description': 'Folded pizza with ham and cheese',
                'price': 2800,
                'category': 'Pizzas',
                'unit': 'UNITE',
                'available': True,
                'stock': 15,
                'preparation_time': 20,
            },
            {
                'restaurant': restaurants[1] if len(restaurants) > 1 else None,
                'name': 'Tiramisu',
                'description': 'Classic Italian dessert',
                'price': 1500,
                'category': 'Desserts',
                'unit': 'UNITE',
                'available': True,
                'stock': 20,
                'preparation_time': 5,
            },
            # Sushi Master products
            {
                'restaurant': restaurants[2] if len(restaurants) > 2 else None,
                'name': 'California Roll',
                'description': 'Crab, avocado, cucumber',
                'price': 3000,
                'category': 'Sushi',
                'unit': 'UNITE',
                'available': True,
                'stock': 40,
                'preparation_time': 10,
            },
            {
                'restaurant': restaurants[2] if len(restaurants) > 2 else None,
                'name': 'Salmon Sashimi',
                'description': 'Fresh salmon slices (8 pieces)',
                'price': 3500,
                'category': 'Sashimi',
                'unit': 'UNITE',
                'available': True,
                'stock': 25,
                'preparation_time': 5,
            },
            {
                'restaurant': restaurants[2] if len(restaurants) > 2 else None,
                'name': 'Tempura Mix',
                'description': 'Shrimp and vegetable tempura',
                'price': 4000,
                'category': 'Apéritifs',
                'unit': 'UNITE',
                'available': True,
                'stock': 20,
                'preparation_time': 15,
            },
            {
                'restaurant': restaurants[2] if len(restaurants) > 2 else None,
                'name': 'Miso Soup',
                'description': 'Traditional Japanese soup',
                'price': 800,
                'category': 'Soupes',
                'unit': 'UNITE',
                'available': True,
                'stock': 50,
                'preparation_time': 5,
            },
            {
                'restaurant': restaurants[2] if len(restaurants) > 2 else None,
                'name': 'Dragon Roll',
                'description': 'Eel, avocado, cucumber, tobiko',
                'price': 4500,
                'category': 'Sushi',
                'unit': 'UNITE',
                'available': True,
                'stock': 15,
                'preparation_time': 12,
            },
        ]
        
        for data in products_data:
            if data['restaurant']:
                product, created = Produit.objects.get_or_create(
                    restaurant=data['restaurant'],
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f'   Created product: {product.name}')
        
        self.stdout.write(f'   Total restaurant products created: {Produit.objects.filter(restaurant__isnull=False).count()}')
    
    def create_supermarkets(self):
        """Create test supermarkets"""
        self.stdout.write('🛒 Creating test supermarkets...')
        
        from apps.supermarches.models import Supermarche
        
        supermarket_owners = User.objects.filter(user_type='SUPERMARCHE')
        
        supermarkets_data = [
            {
                'user': supermarket_owners[0],
                'commercial_name': 'SuperMarché Douala',
                'legal_name': 'SuperMarché Douala SA',
                'description': 'Your one-stop shop for all grocery needs. Fresh products, household items, and more.',
                'full_address': '1000 Rue Commerce, Douala, Cameroun',
                'latitude': 4.0531,
                'longitude': 9.7659,
                'delivery_radius_km': 15,
                'product_count': 500,
                'average_rating': 4.3,
                'review_count': 85,
                'base_delivery_fee': 300,
                'min_order_amount': 1000,
                'is_open': True,
                'is_active': True,
            },
            {
                'user': supermarket_owners[1],
                'commercial_name': 'Marché Frais',
                'legal_name': 'Marché Frais Cameroon',
                'description': 'Fresh produce directly from local farmers. Quality guaranteed.',
                'full_address': '2000 Avenue Principale, Douala, Cameroun',
                'latitude': 4.0571,
                'longitude': 9.7739,
                'delivery_radius_km': 12,
                'product_count': 300,
                'average_rating': 4.6,
                'review_count': 120,
                'base_delivery_fee': 350,
                'min_order_amount': 1500,
                'is_open': True,
                'is_active': True,
            },
        ]
        
        for data in supermarkets_data:
            supermarket, created = Supermarche.objects.get_or_create(
                user=data['user'],
                defaults=data
            )
            if created:
                self.stdout.write(f'   Created supermarket: {supermarket.commercial_name}')
        
        self.stdout.write(f'   Total supermarkets created: {Supermarche.objects.count()}')
    
    def create_supermarket_products(self):
        """Create products for supermarkets"""
        self.stdout.write('📦 Creating supermarket products...')
        
        from apps.products.models import Produit
        from apps.supermarches.models import Supermarche
        
        supermarkets = Supermarche.objects.all()
        
        products_data = [
            # SuperMarché Douala products
            {
                'supermarche': supermarkets[0] if len(supermarkets) > 0 else None,
                'name': 'Riz local 5kg',
                'description': 'High quality local rice, 5kg bag',
                'price': 2500,
                'category': 'Riz et Céréales',
                'unit': 'UNITE',
                'available': True,
                'stock': 100,
            },
            {
                'supermarche': supermarkets[0] if len(supermarkets) > 0 else None,
                'name': 'Tomates 1kg',
                'description': 'Fresh tomatoes',
                'price': 800,
                'category': 'Légumes',
                'unit': 'KG',
                'available': True,
                'stock': 200,
            },
            {
                'supermarche': supermarkets[0] if len(supermarkets) > 0 else None,
                'name': 'Poulet entier',
                'description': 'Whole chicken',
                'price': 3000,
                'category': 'Viandes',
                'unit': 'UNITE',
                'available': True,
                'stock': 50,
            },
            {
                'supermarche': supermarkets[0] if len(supermarkets) > 0 else None,
                'name': 'Oil 5L',
                'description': 'Cooking oil, 5 liters',
                'price': 4500,
                'category': 'Huiles',
                'unit': 'UNITE',
                'available': True,
                'stock': 80,
            },
            {
                'supermarche': supermarkets[0] if len(supermarkets) > 0 else None,
                'name': 'Savon 500g',
                'description': 'Laundry soap',
                'price': 500,
                'category': 'Produits ménagers',
                'unit': 'UNITE',
                'available': True,
                'stock': 300,
            },
            {
                'supermarche': supermarkets[0] if len(supermarkets) > 0 else None,
                'name': 'Coca-Cola 1L',
                'description': 'Coca cola 1 liter',
                'price': 1000,
                'category': 'Boissons',
                'unit': 'UNITE',
                'available': True,
                'stock': 150,
            },
            # Marché Frais products
            {
                'supermarche': supermarkets[1] if len(supermarkets) > 1 else None,
                'name': 'Bananes plantains 3kg',
                'description': 'Green plantains',
                'price': 1500,
                'category': 'Légumes',
                'unit': 'KG',
                'available': True,
                'stock': 100,
            },
            {
                'supermarche': supermarkets[1] if len(supermarkets) > 1 else None,
                'name': 'Pommes 1kg',
                'description': 'Fresh apples',
                'price': 2000,
                'category': 'Fruits',
                'unit': 'KG',
                'available': True,
                'stock': 80,
            },
            {
                'supermarche': supermarkets[1] if len(supermarkets) > 1 else None,
                'name': 'Oeufs (30)',
                'description': '30 eggs tray',
                'price': 1800,
                'category': 'Produits laitiers',
                'unit': 'UNITE',
                'available': True,
                'stock': 100,
            },
            {
                'supermarche': supermarkets[1] if len(supermarkets) > 1 else None,
                'name': 'Poisson frais',
                'description': 'Fresh fish (tilapia)',
                'price': 3500,
                'category': 'Poisson',
                'unit': 'KG',
                'available': True,
                'stock': 40,
            },
            {
                'supermarche': supermarkets[1] if len(supermarkets) > 1 else None,
                'name': 'Manioc 2kg',
                'description': 'Fresh cassava',
                'price': 1000,
                'category': 'Tubercules',
                'unit': 'KG',
                'available': True,
                'stock': 60,
            },
            {
                'supermarche': supermarkets[1] if len(supermarkets) > 1 else None,
                'name': 'Haricots secs 1kg',
                'description': 'Dried beans',
                'price': 1200,
                'category': 'Légumineuses',
                'unit': 'KG',
                'available': True,
                'stock': 90,
            },
        ]
        
        for data in products_data:
            if data['supermarche']:
                product, created = Produit.objects.get_or_create(
                    supermarche=data['supermarche'],
                    name=data['name'],
                    defaults=data
                )
                if created:
                    self.stdout.write(f'   Created product: {product.name}')
        
        self.stdout.write(f'   Total supermarket products created: {Produit.objects.filter(supermarche__isnull=False).count()}')

