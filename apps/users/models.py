from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import URLValidator
from django.utils import timezone
from django.contrib.gis.db import models as gis_models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'ADMIN')
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('is_approved', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('CLIENT', 'Client'),
        ('LIVREUR', 'Livreur'),
        ('RESTAURANT', 'Restaurant'),
        ('SUPERMARCHE', 'Supermarché'),
        ('ADMIN', 'Admin'),
    )
    
    VERIFICATION_STATUS_CHOICES = (
        ('EN_ATTENTE', 'En attente'),
        ('EN_COURS_VERIFICATION', 'En cours de vérification'),
        ('APPROUVE', 'Approuvé'),
        ('REJETE', 'Rejeté'),
        ('SUSPENDU', 'Suspendu'),
    )

    email = models.EmailField(_('email address'), unique=True)
    username = None
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='CLIENT')
    phone = models.CharField(max_length=20, blank=True, null=True)
    photo_profil = models.ImageField(upload_to='profils/', null=True, blank=True)
    
    is_verified = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=None, null=True)
    statut_verification = models.CharField(
        max_length=30,
        choices=VERIFICATION_STATUS_CHOICES,
        default='EN_ATTENTE'
    )
    
    date_soumission = models.DateTimeField(null=True, blank=True)
    date_verification = models.DateTimeField(null=True, blank=True)
    motif_rejet = models.TextField(blank=True, null=True)
    notes_admin = models.TextField(blank=True, null=True)
    
    admin_verificateur = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_users',
        limit_choices_to={'user_type': 'ADMIN'}
    )
    
    fcm_token = models.CharField(max_length=500, blank=True, null=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        ordering = ['-date_creation']
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_user_type_display()})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def is_client(self):
        return self.user_type == 'CLIENT'
    
    def is_livreur(self):
        return self.user_type == 'LIVREUR'
    
    def is_restaurant(self):
        return self.user_type == 'RESTAURANT'
    
    def is_supermarche(self):
        return self.user_type == 'SUPERMARCHE'
    
    def is_admin_user(self):
        return self.user_type == 'ADMIN' or self.is_superuser


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    
    label = models.CharField(max_length=100, help_text="Maison, Bureau, etc.")
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    neighborhood = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='Cameroun')
    
    position = gis_models.PointField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    is_main = models.BooleanField(default=False)
    delivery_instructions = models.TextField(blank=True, null=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'is_main')
        ordering = ['-is_main', '-date_creation']
    
    def __str__(self):
        return f"{self.label} - {self.city}"


class DocumentVerification(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('PIECE_IDENTITE', 'Pièce d\'identité'),
        ('PERMIS_CONDUIRE', 'Permis de conduire'),
        ('CARTE_GRISE', 'Carte grise'),
        ('REGISTRE_COMMERCE', 'Registre de commerce'),
        ('LICENCE_RESTAURANT', 'Licence restaurant'),
        ('AUTORISATION_SANITAIRE', 'Autorisation sanitaire'),
        ('PHOTO_ETABLISSEMENT', 'Photo établissement'),
        ('CONTRAT', 'Contrat'),
        ('ASSURANCE', 'Assurance'),
        ('CERTIFICAT_DOMICILIATION', 'Certificat de domiciliation'),
        ('CASIER_JUDICIAIRE', 'Casier judiciaire'),
        ('ATTESTATION_DOMICILE', 'Attestation de domicile'),
        ('CERTIFICAT_MEDICAL', 'Certificat médical'),
        ('PHOTO_VEHICULE', 'Photo véhicule'),
        ('AUTRE', 'Autre'),
    )
    
    STATUS_CHOICES = (
        ('EN_ATTENTE', 'En attente'),
        ('APPROUVE', 'Approuvé'),
        ('REJETE', 'Rejeté'),
        ('EXPIRE', 'Expiré'),
        ('RENOUVELLEMENT_REQUIS', 'Renouvellement requis'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='documents/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    document_number = models.CharField(max_length=100, blank=True, null=True)
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='EN_ATTENTE')
    rejection_reason = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    is_mandatory = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    
    date_upload = models.DateTimeField(auto_now_add=True)
    date_verification = models.DateTimeField(null=True, blank=True)
    admin_verificateur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents',
        limit_choices_to={'user_type': 'ADMIN'}
    )
    
    class Meta:
        ordering = ['display_order', '-date_upload']
        unique_together = ('user', 'document_type', 'date_upload')
    
    def __str__(self):
        return f"{self.user.email} - {self.get_document_type_display()}"
    
    def is_expired(self):
        if self.expiry_date and timezone.now().date() > self.expiry_date:
            return True
        return False
    
    def days_until_expiry(self):
        if self.expiry_date:
            days = (self.expiry_date - timezone.now().date()).days
            return max(0, days)
        return None


class HistoriqueVerification(models.Model):
    ACTION_CHOICES = (
        ('SOUMISSION_INITIALE', 'Soumission initiale'),
        ('DOCUMENTS_AJOUTES', 'Documents ajoutés'),
        ('EN_VERIFICATION', 'En vérification'),
        ('APPROUVE', 'Approuvé'),
        ('REJETE', 'Rejeté'),
        ('SUSPENSION', 'Suspension'),
        ('REACTIVATION', 'Réactivation'),
        ('DEMANDE_INFO_SUPPLEMENTAIRE', 'Demande d\'info supplémentaire'),
        ('RENOUVELLEMENT_REQUIS', 'Renouvellement requis'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_history')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    old_status = models.CharField(max_length=30, blank=True, null=True)
    new_status = models.CharField(max_length=30, blank=True, null=True)
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verification_actions'
    )
    comment = models.TextField(blank=True, null=True)
    documents = models.ManyToManyField(DocumentVerification, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    date_action = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_action']
    
    def __str__(self):
        return f"{self.user.email} - {self.get_action_display()}"


class CriteresVerification(models.Model):
    USER_TYPE_CHOICES = (
        ('LIVREUR', 'Livreur'),
        ('RESTAURANT', 'Restaurant'),
        ('SUPERMARCHE', 'Supermarché'),
    )
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    required_documents = models.ManyToManyField(DocumentVerification, blank=True)
    is_mandatory = models.BooleanField(default=True)
    verification_order = models.PositiveIntegerField(default=0)
    verification_checklist = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['verification_order']
        unique_together = ('user_type', 'name')
    
    def __str__(self):
        return f"{self.get_user_type_display()} - {self.name}"


class NotificationVerification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('DOCUMENTS_REQUIS', 'Documents requis'),
        ('DOCUMENTS_RECUS', 'Documents reçus'),
        ('EN_VERIFICATION', 'En vérification'),
        ('APPROUVE', 'Approuvé'),
        ('REJETE', 'Rejeté'),
        ('DOCUMENTS_MANQUANTS', 'Documents manquants'),
        ('DOCUMENT_EXPIRE', 'Document expiré'),
        ('RENOUVELLEMENT_REQUIS', 'Renouvellement requis'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    documents = models.ManyToManyField(DocumentVerification, blank=True)
    required_actions = models.JSONField(default=list, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_read = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.user.email} - {self.get_notification_type_display()}"
