from django.contrib import admin
from apps.notifications.models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'date_created')
    list_filter = ('notification_type', 'is_read', 'date_created')
    search_fields = ('user__email', 'title', 'message')
    readonly_fields = ('date_created', 'date_read')
    
    fieldsets = (
        ('Destinataire', {
            'fields': ('user',)
        }),
        ('Contenu', {
            'fields': ('notification_type', 'title', 'message', 'data')
        }),
        ('Statut', {
            'fields': ('is_read', 'date_created', 'date_read')
        }),
    )
