from django.db import models
from apps.users.models import User

class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('NOUVELLE_COMMANDE', 'Nouvelle commande'),
        ('COMMANDE_ACCEPTEE', 'Commande acceptée'),
        ('LIVREUR_ASSIGNE', 'Livreur assigné'),
        ('EN_ROUTE', 'En route'),
        ('LIVREE', 'Livrée'),
        ('PROMOTION', 'Promotion'),
        ('VERIFICATION', 'Vérification'),
        ('ALERTE_DOCUMENT', 'Alerte document'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)
    date_read = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-date_created']
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
