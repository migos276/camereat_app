from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Approve a restaurant user account'

    def add_arguments(self, parser):
        parser.add_argument(
            'email',
            type=str,
            help='Email of the restaurant user to approve',
        )

    def handle(self, *args, **options):
        email = options['email']

        try:
            user = User.objects.get(email=email, user_type='RESTAURANT')
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'No restaurant user found with email: {email}')
            )
            return

        if user.is_approved:
            self.stdout.write(
                self.style.WARNING(f'Restaurant user {email} is already approved')
            )
            return

        # Approve the user
        user.is_approved = True
        user.statut_verification = 'APPROUVE'
        user.date_verification = timezone.now()
        user.save()

        # Update restaurant date_approved if it exists
        if hasattr(user, 'restaurant'):
            user.restaurant.date_approved = timezone.now()
            user.restaurant.save()

        self.stdout.write(
            self.style.SUCCESS(f'Successfully approved restaurant user: {email}')
        )
