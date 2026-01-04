from django.contrib.gis.db import models as gis_models
from django.db import models
import uuid

class Commande(models.Model):
    STATUS_CHOICES = (
        ('EN_ATTENTE', 'En attente'),
        ('ACCEPTEE', 'Acceptée'),
        ('EN_PREPARATION', 'En préparation'),
        ('PRETE', 'Prête'),
        ('LIVREUR_ASSIGNE', 'Livreur assigné'),
        ('EN_ROUTE_COLLECTE', 'En route pour collecte'),
        ('COLLECTEE', 'Collectée'),
        ('EN_LIVRAISON', 'En livraison'),
        ('LIVREE', 'Livrée'),
        ('ANNULEE', 'Annulée'),
        ('REFUSEE', 'Refusée'),
    )
    
    PAYMENT_MODE_CHOICES = (
        ('ESPECES', 'Espèces'),
        ('CARTE', 'Carte bancaire'),
        ('MOBILE_MONEY', 'Mobile Money'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('EN_ATTENTE', 'En attente'),
        ('PAYE', 'Payé'),
        ('REMBOURSE', 'Remboursé'),
    )
    
    numero = models.CharField(max_length=50, unique=True, editable=False)
    client = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='orders', limit_choices_to={'user_type': 'CLIENT'})
    
    restaurant = models.ForeignKey('restaurants.Restaurant', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    supermarche = models.ForeignKey('supermarches.Supermarche', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    livreur = models.ForeignKey('livreurs.Livreur', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    start_position = gis_models.PointField(null=True, blank=True)
    delivery_position = gis_models.PointField(null=True, blank=True)
    delivery_address_text = models.TextField()
    
    distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_duration_minutes = models.PositiveIntegerField(default=0)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='EN_ATTENTE')
    
    products_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    platform_commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES, default='ESPECES')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='EN_ATTENTE')
    
    special_instructions = models.TextField(blank=True)
    otp_code = models.CharField(max_length=6, blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    date_created = models.DateTimeField(auto_now_add=True)
    date_accepted = models.DateTimeField(null=True, blank=True)
    date_preparation = models.DateTimeField(null=True, blank=True)
    date_collected = models.DateTimeField(null=True, blank=True)
    date_delivered = models.DateTimeField(null=True, blank=True)
    date_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_created']
    
    def __str__(self):
        return f"Commande {self.numero}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = f"CMD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

class LigneCommande(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='items')
    produit = models.ForeignKey('products.Produit', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)
    special_instructions = models.TextField(blank=True)
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"{self.commande.numero} - {self.produit.name if self.produit else 'Produit supprimé'}"

class Avis(models.Model):
    TYPE_CHOICES = (
        ('RESTAURANT', 'Restaurant'),
        ('LIVREUR', 'Livreur'),
        ('SUPERMARCHE', 'Supermarché'),
    )
    
    commande = models.OneToOneField(Commande, on_delete=models.CASCADE, related_name='avis')
    avis_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    rating = models.PositiveIntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    response = models.TextField(blank=True)
    is_flagged = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)
    date_response = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-date_created']
    
    def __str__(self):
        return f"Avis {self.get_avis_type_display()} - {self.rating}/5"

class Promotion(models.Model):
    TYPE_CHOICES = (
        ('POURCENTAGE', 'Pourcentage'),
        ('MONTANT_FIXE', 'Montant fixe'),
        ('LIVRAISON_GRATUITE', 'Livraison gratuite'),
    )
    
    restaurant = models.ForeignKey('restaurants.Restaurant', on_delete=models.CASCADE, null=True, blank=True, related_name='promotions')
    supermarche = models.ForeignKey('supermarches.Supermarche', on_delete=models.CASCADE, null=True, blank=True, related_name='promotions')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='promotions/', null=True, blank=True)
    
    promo_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    code = models.CharField(max_length=50, unique=True)
    
    date_start = models.DateTimeField()
    date_end = models.DateTimeField()
    
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_usage = models.PositiveIntegerField(null=True, blank=True)
    max_usage_per_user = models.PositiveIntegerField(default=1)
    
    is_active = models.BooleanField(default=True)
    usage_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-date_start']
    
    def __str__(self):
        return f"{self.code} - {self.title}"
