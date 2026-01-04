from django.contrib.gis.db import models as gis_models
from django.db import models
from apps.users.models import User

class Supermarche(models.Model):
    PRICE_CHOICES = (
        ('€', 'Budget'),
        ('€€', 'Moyen'),
        ('€€€', 'Cher'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='supermarche', limit_choices_to={'user_type': 'SUPERMARCHE'})
    
    commercial_name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    rccm_number = models.CharField(max_length=100, blank=True, null=True)
    tax_number = models.CharField(max_length=100, blank=True, null=True)
    
    logo = models.ImageField(upload_to='supermarches/logos/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='supermarches/covers/', null=True, blank=True)
    
    position = gis_models.PointField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    full_address = models.TextField()
    
    delivery_radius_km = models.PositiveIntegerField(default=10)
    opening_hours = models.JSONField(default=dict, blank=True)
    
    product_count = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    
    base_delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    bank_account = models.JSONField(default=dict, blank=True)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    
    is_open = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    date_approved = models.DateTimeField(null=True, blank=True)
    date_started = models.DateTimeField(auto_now_add=True)
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_created']
    
    def __str__(self):
        return self.commercial_name
    
    def save(self, *args, **kwargs):
        if self.latitude and self.longitude:
            from django.contrib.gis.geos import Point
            self.position = Point(float(self.longitude), float(self.latitude))
        super().save(*args, **kwargs)

class CategorieSupermarche(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#000000')
    display_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['display_order']
        verbose_name_plural = 'Catégories Supermarché'
    
    def __str__(self):
        return self.name
