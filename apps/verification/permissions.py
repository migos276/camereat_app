from rest_framework.permissions import BasePermission

class IsOwnerOrAdmin(BasePermission):
    """Allow users to view their own data, or admin users."""
    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.is_admin_user()

class CanVerify(BasePermission):
    """Only admin users can verify accounts."""
    def has_permission(self, request, view):
        return request.user.is_admin_user()

class IsVerificationApplicable(BasePermission):
    """Check if user type requires verification."""
    def has_permission(self, request, view):
        user_type = request.user.user_type
        return user_type in ['RESTAURANT', 'SUPERMARCHE', 'LIVREUR']
