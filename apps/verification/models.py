from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.users.models import User, DocumentVerification, HistoriqueVerification, NotificationVerification

class VerificationService(models.Model):
    """Service configuration for verification"""
    pass

class ParametresVerification(models.Model):
    VALUE_TYPE_CHOICES = (
        ('TEXTE', 'Texte'),
        ('NOMBRE', 'Nombre'),
        ('BOOLEAN', 'Booléen'),
        ('JSON', 'JSON'),
    )
    
    key = models.CharField(max_length=255, unique=True)
    value = models.JSONField(default=dict)
    description = models.TextField(blank=True)
    value_type = models.CharField(max_length=20, choices=VALUE_TYPE_CHOICES, default='TEXTE')
    is_editable = models.BooleanField(default=True)
    date_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Paramètres Vérification'
        ordering = ['key']
    
    def __str__(self):
        return self.key
