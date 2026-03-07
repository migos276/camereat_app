from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from apps.users.models import User, DocumentVerification, HistoriqueVerification, NotificationVerification, CriteresVerification
from apps.verification.models import ParametresVerification

class DocumentVerificationInline(admin.TabularInline):
    model = DocumentVerification
    extra = 1
    fields = ('document_type', 'status', 'expiry_date', 'file')
    readonly_fields = ('date_upload',)

@admin.register(DocumentVerification)
class DocumentVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type', 'status_colored', 'expiry_date', 'is_expired_colored')
    list_filter = ('document_type', 'status', 'date_upload')
    search_fields = ('user__email', 'document_number')
    readonly_fields = ('date_upload', 'date_verification')
    
    fieldsets = (
        ('Informations Document', {
            'fields': ('user', 'document_type', 'file', 'original_filename', 'document_number')
        }),
        ('Statut', {
            'fields': ('status', 'rejection_reason', 'expiry_date', 'is_mandatory')
        }),
        ('Vérification', {
            'fields': ('admin_verificateur', 'admin_notes', 'date_upload', 'date_verification')
        }),
    )
    
    def status_colored(self, obj):
        colors = {
            'APPROUVE': 'green',
            'REJETE': 'red',
            'EN_ATTENTE': 'orange',
            'EXPIRE': 'darkred',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_colored.short_description = 'Statut'
    
    def is_expired_colored(self, obj):
        if obj.is_expired():
            return format_html('<span style="color: red;">EXPIRÉ</span>')
        elif obj.days_until_expiry() and obj.days_until_expiry() < 30:
            return format_html(
                '<span style="color: orange;">Expire dans {} jours</span>',
                obj.days_until_expiry()
            )
        return format_html('<span style="color: green;">Valide</span>')
    is_expired_colored.short_description = 'Expiration'

@admin.register(HistoriqueVerification)
class HistoriqueVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'performed_by', 'date_action')
    list_filter = ('action', 'date_action')
    search_fields = ('user__email', 'comment')
    readonly_fields = ('date_action',)

@admin.register(CriteresVerification)
class CriteresVerificationAdmin(admin.ModelAdmin):
    list_display = ('user_type', 'name', 'is_mandatory', 'verification_order')
    list_filter = ('user_type', 'is_mandatory')
    ordering = ('user_type', 'verification_order')

@admin.register(NotificationVerification)
class NotificationVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'is_read', 'email_sent', 'date_creation')
    list_filter = ('notification_type', 'is_read', 'email_sent', 'date_creation')
    search_fields = ('user__email', 'title')
    readonly_fields = ('date_creation', 'date_read')

@admin.register(ParametresVerification)
class ParametresVerificationAdmin(admin.ModelAdmin):
    list_display = ('key', 'value_type', 'is_editable', 'date_modified')
    list_filter = ('value_type', 'is_editable')
    search_fields = ('key', 'description')
    readonly_fields = ('date_modified',)
