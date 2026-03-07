from django.core.management.base import BaseCommand
from django.db import transaction
from apps.orders.models import Commande

class Command(BaseCommand):
    help = 'Met à jour les livreur_earnings pour les commandes existantes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simuler sans enregistrer les modifications',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Calculate delivery fee percentage (typically 70-80% goes to livreur)
        LIVREUR_PERCENTAGE = 0.75  # Livreur gets 75% of delivery fee
        
        # Get all delivered orders without livreur_earnings
        orders_to_update = Commande.objects.filter(
            status='LIVREE',
            livreur_earnings=0,
            livreur__isnull=False,
            date_delivered__isnull=False
        )
        
        total_orders = orders_to_update.count()
        
        if total_orders == 0:
            self.stdout.write(self.style.SUCCESS('Aucune commande à mettre à jour.'))
            return
        
        self.stdout.write(f'Trouvé {total_orders} commandes à mettre à jour.')
        
        if dry_run:
            self.stdout.write('DRY RUN - Aucune modification enregistrée.')
            for order in orders_to_update[:5]:  # Show first 5
                earnings = float(order.delivery_fee) * LIVREUR_PERCENTAGE
                self.stdout.write(f'  CMD-{order.numero}: {earnings} XOF')
            self.stdout.write(f'... et {total_orders - 5} autres')
            return
        
        # Update orders in a transaction
        with transaction.atomic():
            updated_count = 0
            for order in orders_to_update:
                # Calculate livreur earnings (75% of delivery fee)
                earnings = float(order.delivery_fee) * LIVREUR_PERCENTAGE
                order.livreur_earnings = round(earnings, 2)
                order.save(update_fields=['livreur_earnings'])
                updated_count += 1
                
                if updated_count % 100 == 0:
                    self.stdout.write(f'Mis à jour {updated_count}/{total_orders}...')
        
        self.stdout.write(
            self.style.SUCCESS(f'Succès! {updated_count} commandes mises à jour.')
        )
        
        # Show summary
        self.stdout.write('\nRécapitulatif:')
        total_earnings = Commande.objects.filter(
            status='LIVREE',
            livreur__isnull=False
        ).aggregate(total=models.Sum('livreur_earnings'))['total'] or 0
        
        self.stdout.write(f'Total des earnings des livreurs: {total_earnings} XOF')
        self.stdout.write(f'Nombre de livreurs actifs: {Commande.objects.filter(status="LIVREE").exclude(livreur__isnull=True).values("livreur").distinct().count()}')

