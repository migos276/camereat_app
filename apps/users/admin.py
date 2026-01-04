from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import User, Address, DocumentVerification, HistoriqueVerification

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'get_full_name', 'user_type', 'statut_verification', 'is_active')
    list_filter = ('user_type', 'statut_verification', 'is_approved', 'date_creation')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_creation',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'phone', 'photo_profil')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Vérification', {'fields': ('user_type', 'statut_verification', 'is_verified', 'is_approved')}),
        ('Admin', {'fields': ('admin_verificateur', 'motif_rejet', 'notes_admin', 'date_soumission', 'date_verification')}),
        ('Dates', {'fields': ('date_creation', 'date_modification', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
        ('Informations', {'fields': ('first_name', 'last_name', 'user_type')}),
    )

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'label', 'city', 'is_main')
    list_filter = ('city', 'is_main')
    search_fields = ('user__email', 'label', 'city')
