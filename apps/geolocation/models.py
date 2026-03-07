from django.contrib.gis.db import models as gis_models
from django.db import models

class ZoneLivraison(models.Model):
    name = models.CharField(max_length=255, unique=True)
    polygon = gis_models.PolygonField(null=True, blank=True)
    city = models.CharField(max_length=100)
    neighborhoods = models.JSONField(default=list, blank=True)
    base_delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    additional_fee_per_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_delivery_time = models.PositiveIntegerField(default=30, help_text="Minutes")
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['city', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.city}"

class TrajetLivraison(models.Model):
    from apps.orders.models import Commande
    from apps.livreurs.models import Livreur
    
    commande = models.OneToOneField(Commande, on_delete=models.CASCADE, related_name='trajet')
    livreur = models.ForeignKey('livreurs.Livreur', on_delete=models.CASCADE, related_name='trajets')
    
    route = gis_models.LineStringField(null=True, blank=True)
    distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration_minutes = models.PositiveIntegerField(default=0)
    
    date_start = models.DateTimeField(null=True, blank=True)
    date_end = models.DateTimeField(null=True, blank=True)
    
    stops = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-date_start']
    
    def __str__(self):
        return f"Trajet {self.commande.numero}"
