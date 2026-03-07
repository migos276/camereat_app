from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User, NotificationVerification
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def create_livreur_profile_safe(user):
    """
    Safely create Livreur profile for a livreur user.
    Handles unique constraint violations for vehicle_plate.
    """
    from apps.livreurs.models import Livreur, StatistiquesLivreur
    
    # Create Livreur profile if it doesn't exist
    if not hasattr(user, 'livreur'):
        # Generate a unique vehicle plate
        base_plate = f"LIVREUR-{user.id}"
        plate = base_plate
        counter = 1
        
        # Make sure the plate is unique
        while Livreur.objects.filter(vehicle_plate=plate).exists():
            plate = f"{base_plate}-{counter}"
            counter += 1
        
        try:
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
            
            # Create statistics
            try:
                StatistiquesLivreur.objects.create(livreur=livreur)
            except Exception as e:
                logger.error(f"Error creating statistics for livreur {livreur.id}: {e}")
                
        except Exception as e:
            logger.error(f"Error creating livreur profile for user {user.id}: {e}")


def create_restaurant_profile_safe(user):
    """
    Safely create Restaurant profile for a restaurant user.
    Creates a basic profile that the user can later update.
    """
    from apps.restaurants.models import Restaurant
    
    # Create Restaurant profile if it doesn't exist
    if not hasattr(user, 'restaurant'):
        try:
            # Generate default values for required fields
            commercial_name = user.first_name or "Mon Restaurant"
            legal_name = f"{commercial_name} SARL"
            
            restaurant = Restaurant.objects.create(
                user=user,
                commercial_name=commercial_name,
                legal_name=legal_name,
                description="À compléter",
                full_address="À compléter",
                cuisine_type='AUTRE',
                price_level='€€',
            )
            logger.info(f"Created Restaurant profile for user {user.id}")
            
        except Exception as e:
            logger.error(f"Error creating Restaurant profile for user {user.id}: {e}")


def create_supermarche_profile_safe(user):
    """
    Safely create Supermarche profile for a supermarche user.
    Creates a basic profile that the user can later update.
    """
    from apps.supermarches.models import Supermarche
    
    # Create Supermarche profile if it doesn't exist
    if not hasattr(user, 'supermarche'):
        try:
            # Generate default values for required fields
            commercial_name = user.first_name or "Mon Supermarché"
            legal_name = f"{commercial_name} SARL"
            
            supermarche = Supermarche.objects.create(
                user=user,
                commercial_name=commercial_name,
                legal_name=legal_name,
                description="À compléter",
                full_address="À compléter",
            )
            logger.info(f"Created Supermarche profile for user {user.id}")
            
        except Exception as e:
            logger.error(f"Error creating Supermarche profile for user {user.id}: {e}")


@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    """
    Signal handler for user creation.
    Sends welcome email, creates initial verification notification,
    and creates profiles for Livreur, Restaurant, and Supermarche users.
    """
    if created:
        # For non-clients, create initial verification notification
        if instance.user_type != 'CLIENT':
            instance.statut_verification = 'EN_ATTENTE'
            instance.date_soumission = timezone.now()
            instance.save(update_fields=['statut_verification', 'date_soumission'])
            
            NotificationVerification.objects.create(
                user=instance,
                notification_type='DOCUMENTS_REQUIS',
                title='Documents requis pour votre compte',
                message=f'Bienvenue! Veuillez soumettre les documents requis pour votre compte {instance.get_user_type_display()}',
            )
        
        # Auto-create Livreur profile for livreur users
        if instance.user_type == 'LIVREUR':
            create_livreur_profile_safe(instance)
        
        # Auto-create Restaurant profile for restaurant users
        if instance.user_type == 'RESTAURANT':
            create_restaurant_profile_safe(instance)
        
        # Auto-create Supermarche profile for supermarche users
        if instance.user_type == 'SUPERMARCHE':
            create_supermarche_profile_safe(instance)
