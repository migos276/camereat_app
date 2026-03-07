"""
Django management command to seed Yaounde restaurant data.
Usage: python manage.py seed_yaounde_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds Yaounde restaurant data (users and restaurants)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--json-file',
            type=str,
            default='restaurants_yaounde_seed.json',
            help='Path to the JSON file with seed data',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        json_file = options['json_file']
        clear_existing = options['clear']

        self.stdout.write(self.style.SUCCESS('🚀 Starting Yaounde data seeding...'))

        # Load JSON data
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.stdout.write(f'   Loaded data from {json_file}')
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f'File {json_file} not found'))
            return
        except json.JSONDecodeError as e:
            self.stderr.write(self.style.ERROR(f'Invalid JSON: {e}'))
            return

        # Clear existing data if requested
        if clear_existing:
            self.clear_data()

        # Seed data
        with transaction.atomic():
            users_created = self.create_users(data['users'])
            restaurants_created = self.create_restaurants(data['restaurants'])

        self.stdout.write(self.style.SUCCESS(
            f'✅ Seeding completed! Created {users_created} users and {restaurants_created} restaurants.'
        ))

    def clear_data(self):
        """Clear existing test data"""
        self.stdout.write('🗑️  Clearing existing data...')

        from apps.restaurants.models import Restaurant
        from apps.supermarches.models import Supermarche

        # Delete restaurants first (foreign key dependencies)
        Restaurant.objects.filter(
            user__email__icontains='@yaoundefood.cm'
        ).delete()
        Supermarche.objects.filter(
            user__email__icontains='@yaoundefood.cm'
        ).delete()

        # Delete users with yaoundefood.cm email
        deleted_users, _ = User.objects.filter(
            email__icontains='@yaoundefood.cm'
        ).delete()

        self.stdout.write(f'   Deleted {deleted_users} existing records')

    def create_users(self, users_data):
        """Create users from the seed data"""
        self.stdout.write('👤 Creating users...')
        created_count = 0

        for user_data in users_data:
            fields = user_data['fields']
            email = fields['email']

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fields.get('first_name', ''),
                    'last_name': fields.get('last_name', ''),
                    'phone': fields.get('phone', ''),
                    'user_type': fields.get('user_type', 'RESTAURANT'),
                    'is_verified': fields.get('is_verified', False),
                    'is_approved': fields.get('is_approved', False),
                    'is_active': fields.get('is_active', True),
                }
            )

            if created:
                # Set a default password (the provided hash is for testing)
                user.set_password('password123')
                user.save()
                created_count += 1
                self.stdout.write(f'   ✅ Created: {email}')
            else:
                self.stdout.write(f'   ⏭️  Already exists: {email}')

        self.stdout.write(f'   Total users created: {created_count}')
        return created_count

    def create_restaurants(self, restaurants_data):
        """Create restaurants from the seed data"""
        self.stdout.write('🍽️  Creating restaurants...')
        created_count = 0

        for restaurant_data in restaurants_data:
            fields = restaurant_data['fields']
            user_email = fields['user']

            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f'   ⚠️  User not found for restaurant: {user_email}'
                    )
                )
                continue

            # Check if restaurant already exists for this user
            from apps.restaurants.models import Restaurant
            existing = Restaurant.objects.filter(user=user).first()

            if existing:
                self.stdout.write(
                    f'   ⏭️  Restaurant already exists for: {user_email}'
                )
                continue

            # Parse decimal fields
            latitude = float(fields.get('latitude') or 0)
            longitude = float(fields.get('longitude') or 0)
            average_rating = float(fields.get('average_rating') or 0)
            base_delivery_fee = float(fields.get('base_delivery_fee') or 0)
            min_order_amount = float(fields.get('min_order_amount') or 0)

            restaurant = Restaurant.objects.create(
                user=user,
                commercial_name=fields.get('commercial_name', ''),
                legal_name=fields.get('legal_name', ''),
                description=fields.get('description', ''),
                cuisine_type=fields.get('cuisine_type', 'AUTRE'),
                full_address=fields.get('full_address', ''),
                latitude=latitude,
                longitude=longitude,
                delivery_radius_km=fields.get('delivery_radius_km', 5),
                avg_preparation_time=fields.get('avg_preparation_time', 30),
                average_rating=average_rating,
                review_count=fields.get('review_count', 0),
                price_level=fields.get('price_level', '€€'),
                base_delivery_fee=base_delivery_fee,
                min_order_amount=min_order_amount,
                is_open=fields.get('is_open', True),
                is_active=fields.get('is_active', True),
            )

            created_count += 1
            self.stdout.write(
                f'   ✅ Created: {restaurant.commercial_name} ({user_email})'
            )

        self.stdout.write(f'   Total restaurants created: {created_count}')
        return created_count

