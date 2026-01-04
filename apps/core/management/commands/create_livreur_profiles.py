"""
Management command to create Livreur and StatistiquesLivreur profiles for existing users.
Usage: python manage.py create_livreur_profiles
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create Livreur and StatistiquesLivreur profiles for existing livreur users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recreate profiles even if they already exist',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        from apps.livreurs.models import Livreur, StatistiquesLivreur
        
        # Create Livreur profiles
        livreur_users = User.objects.filter(user_type='LIVREUR')
        livreurs_created = 0
        livreurs_skipped = 0
        
        self.stdout.write(f'\nProcessing {livreur_users.count()} livreur users...\n')
        
        for user in livreur_users:
            if hasattr(user, 'livreur'):
                if force:
                    # Delete existing profile and create new one
                    user.livreur.delete()
                    self.stdout.write(f'  Force recreating profile for user {user.id} ({user.email})')
                else:
                    self.stdout.write(f'  Skipping user {user.id} ({user.email}) - profile already exists')
                    livreurs_skipped += 1
                    continue
            
            try:
                # Generate a unique vehicle plate
                base_plate = f"LIVREUR-{user.id}"
                plate = base_plate
                counter = 1
                
                # Make sure the plate is unique
                while Livreur.objects.filter(vehicle_plate=plate).exists():
                    plate = f"{base_plate}-{counter}"
                    counter += 1
                
                livreur = Livreur.objects.create(
                    user=user,
                    vehicle_type='MOTO',
                    vehicle_brand='À compléter',
                    vehicle_model='À compléter',
                    vehicle_year=2020,
                    vehicle_plate=plate,
                    vehicle_color='Non spécifié',
                    status='HORS_LIGNE',
                )
                livreurs_created += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  Created profile for user {user.id} ({user.email})')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error creating profile for user {user.id} ({user.email}): {e}')
                )
        
        # Create StatistiquesLivreur profiles
        all_livreurs = Livreur.objects.all()
        stats_created = 0
        stats_skipped = 0
        
        self.stdout.write(f'\nCreating statistics for {all_livreurs.count()} livreurs...\n')
        
        for livreur in all_livreurs:
            if hasattr(livreur, 'statistics'):
                if force:
                    livreur.statistics.delete()
                    self.stdout.write(f'  Force recreating statistics for livreur {livreur.id}')
                else:
                    self.stdout.write(f'  Skipping livreur {livreur.id} - statistics already exist')
                    stats_skipped += 1
                    continue
            
            try:
                StatistiquesLivreur.objects.create(livreur=livreur)
                stats_created += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  Created statistics for livreur {livreur.id}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error creating statistics for livreur {livreur.id}: {e}')
                )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('Summary:')
        self.stdout.write(f'  Livreur profiles created: {livreurs_created}')
        self.stdout.write(f'  Livreur profiles skipped: {livreurs_skipped}')
        self.stdout.write(f'  Statistics profiles created: {stats_created}')
        self.stdout.write(f'  Statistics profiles skipped: {stats_skipped}')
        self.stdout.write('='*50 + '\n')
        
        if livreurs_created == 0 and stats_created == 0:
            self.stdout.write(
                self.style.WARNING('\nNo new profiles were created.')
            )
            if not force:
                self.stdout.write(
                    'Use --force to recreate existing profiles.\n'
                )

