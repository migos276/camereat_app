from django.db import models

class Produit(models.Model):
    UNIT_CHOICES = (
        ('KG', 'Kilogramme'),
        ('UNITE', 'Unité'),
        ('LITRE', 'Litre'),
        ('ML', 'Millilitre'),
        ('GRAMME', 'Gramme'),
    )
    
    restaurant = models.ForeignKey(
        'restaurants.Restaurant', on_delete=models.CASCADE,
        null=True, blank=True, related_name='products'
    )
    supermarche = models.ForeignKey(
        'supermarches.Supermarche', on_delete=models.CASCADE,
        null=True, blank=True, related_name='products'
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    
    category = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='UNITE')
    available = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(null=True, blank=True)
    preparation_time = models.PositiveIntegerField(null=True, blank=True, help_text="Minutes")
    
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    sales_count = models.PositiveIntegerField(default=0)
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_created']
    
    def __str__(self):
        return f"{self.name}"
    
    def save(self, *args, **kwargs):
        if self.discount_percentage > 0:
            self.discounted_price = self.price * (1 - self.discount_percentage / 100)
        super().save(*args, **kwargs)
