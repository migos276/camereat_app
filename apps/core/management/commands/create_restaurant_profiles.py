from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Creates missing restaurant profiles for restaurant users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find all restaurant users without a restaurant profile
        restaurant_users = User.objects.filter(user_type='RESTAURANT')
        
        total_users = restaurant_users.count()
        self.stdout.write(f"Found {total_users} restaurant users")
        
        created_count = 0
        skipped_count = 0
        
        for user in restaurant_users:
            if hasattr(user, 'restaurant'):
                self.stdout.write(f"  ✓ User {user.email} already has a restaurant profile")
                skipped_count += 1
            else:
                if dry_run:
                    self.stdout.write(f"  [DRY-RUN] Would create profile for {user.email}")
                else:
                    try:
                        from apps.restaurants.models import Restaurant
                        
                        # Create default values
                        commercial_name = user.first_name or user.get_full_name() or f"Restaurant de {user.email.split('@')[0]}"
                        legal_name = f"{commercial_name} SARL"
                        
                        restaurant = Restaurant.objects.create(
                            user=user,
                            commercial_name=commercial_name,
                            legal_name=legal_name,
                            description="À compléter - Profil créé automatiquement",
                            full_address="À compléter",
                            cuisine_type='AUTRE',
                            price_level='€€',
                        )
                        
                        logger.info(f"Created Restaurant profile for user {user.id}: {restaurant.commercial_name}")
                        self.stdout.write(f"  ✓ Created profile for {user.email}: {commercial_name}")
                        created_count += 1
                        
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"  ✗ Error creating profile for {user.email}: {e}"))
                        logger.exception(f"Error creating Restaurant profile for user {user.id}: {e}")
        
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Summary:"))
        self.stdout.write(f"  Total restaurant users: {total_users}")
        self.stdout.write(f"  Profiles created: {created_count}")
        self.stdout.write(f"  Already had profiles: {skipped_count}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("  [DRY-RUN] No changes were made"))

