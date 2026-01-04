from django.contrib.gis.db import models as gis_models
from django.db import models
from apps.users.models import User

class Livreur(models.Model):
    VEHICLE_CHOICES = (
        ('MOTO', 'Moto'),
        ('VOITURE', 'Voiture'),
        ('VELO', 'Vélo'),
        ('SCOOTER', 'Scooter'),
    )
    
    STATUS_CHOICES = (
        ('HORS_LIGNE', 'Hors ligne'),
        ('EN_LIGNE', 'En ligne'),
        ('EN_LIVRAISON', 'En livraison'),
        ('EN_PAUSE', 'En pause'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='livreur', limit_choices_to={'user_type': 'LIVREUR'})
    
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES)
    vehicle_brand = models.CharField(max_length=100)
    vehicle_model = models.CharField(max_length=100)
    vehicle_year = models.PositiveIntegerField()
    vehicle_plate = models.CharField(max_length=20, unique=True)
    vehicle_color = models.CharField(max_length=50)
    
    driver_license_number = models.CharField(max_length=50, blank=True, null=True)
    driver_license_expiry = models.DateField(null=True, blank=True)
    insurance_number = models.CharField(max_length=50, blank=True, null=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    
    current_position = gis_models.PointField(null=True, blank=True)
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='HORS_LIGNE')
    action_radius_km = models.PositiveIntegerField(default=10)
    
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    delivery_count = models.PositiveIntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    last_position_update = models.DateTimeField(null=True, blank=True)
    
    bank_account = models.JSONField(default=dict, blank=True)
    commission_type = models.CharField(max_length=20, choices=[('PERCENTAGE', 'Pourcentage'), ('FIXED', 'Montant fixe')], default='PERCENTAGE')
    commission_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    date_approved = models.DateTimeField(null=True, blank=True)
    date_started = models.DateTimeField(auto_now_add=True)
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_created']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.vehicle_type}"
    
    def save(self, *args, **kwargs):
        if self.current_latitude and self.current_longitude:
            from django.contrib.gis.geos import Point
            self.current_position = Point(float(self.current_longitude), float(self.current_latitude))
        super().save(*args, **kwargs)

class StatistiquesLivreur(models.Model):
    livreur = models.OneToOneField(Livreur, on_delete=models.CASCADE, related_name='statistics')
    
    date = models.DateField(auto_now_add=True)
    
    deliveries_today = models.PositiveIntegerField(default=0)
    deliveries_week = models.PositiveIntegerField(default=0)
    deliveries_month = models.PositiveIntegerField(default=0)
    
    earnings_today = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    earnings_week = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    earnings_month = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    distance_today_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    distance_week_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    distance_month_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    active_time_minutes = models.PositiveIntegerField(default=0)
    average_rating_period = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"Stats {self.livreur.user.email} - {self.date}"
