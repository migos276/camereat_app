"""
Data migration to create Livreur and StatistiquesLivreur profiles for existing users.
This fixes the 404 errors for livreurs/me/ and livreurs/statistiques/ endpoints.
"""
from django.db import migrations


def create_livreur_profiles(apps, schema_editor):
    """Create Livreur profiles for existing users with user_type='LIVREUR'"""
    User = apps.get_model('users', 'User')
    Livreur = apps.get_model('livreurs', 'Livreur')
    
    # Get all users with user_type='LIVREUR' who don't have a Livreur profile
    # Note: We need to use the User model's user_type field
    livreur_users = User.objects.filter(user_type='LIVREUR')
    
    created_count = 0
    for user in livreur_users:
        # Check if user already has a livreur profile by trying to access it
        try:
            # Try to access the related livreur - if it doesn't exist, this will raise an exception
            if user.livreur:
                continue
        except Livreur.DoesNotExist:
            pass
        except Exception:
            # Some other error, continue
            pass
        
        try:
            # Generate a unique vehicle plate using user.id
            base_plate = f"LIVREUR-{user.pk}"
            plate = base_plate
            counter = 1
            
            # Make sure the plate is unique
            while Livreur.objects.filter(vehicle_plate=plate).exists():
                plate = f"{base_plate}-{counter}"
                counter += 1
            
            Livreur.objects.create(
                user_id=user.pk,
                vehicle_type='MOTO',
                vehicle_brand='À compléter',
                vehicle_model='À compléter',
                vehicle_year=2020,
                vehicle_plate=plate,
                vehicle_color='Non spécifié',
                status='HORS_LIGNE',
            )
            created_count += 1
        except Exception as e:
            print(f"Error creating livreur profile for user {user.pk}: {e}")
    
    print(f"Created {created_count} Livreur profiles")


def create_statistiques_profiles(apps, schema_editor):
    """Create StatistiquesLivreur for existing Livreurs"""
    StatistiquesLivreur = apps.get_model('livreurs', 'StatistiquesLivreur')
    Livreur = apps.get_model('livreurs', 'Livreur')
    
    created_count = 0
    for livreur in Livreur.objects.all():
        # Check if statistics already exist
        if not StatistiquesLivreur.objects.filter(livreur_id=livreur.pk).exists():
            try:
                StatistiquesLivreur.objects.create(livreur_id=livreur.pk)
                created_count += 1
            except Exception as e:
                print(f"Error creating statistics for livreur {livreur.pk}: {e}")
    
    print(f"Created {created_count} StatistiquesLivreur profiles")


def reverse_migration(apps, schema_editor):
    """Reverse the migration - delete the created profiles"""
    Livreur = apps.get_model('livreurs', 'Livreur')
    # Only delete profiles that were created with the LIVREUR-{id} pattern
    Livreur.objects.filter(vehicle_plate__startswith='LIVREUR-').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('livreurs', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_livreur_profiles, reverse_migration),
        migrations.RunPython(create_statistiques_profiles, reverse_migration),
    ]

