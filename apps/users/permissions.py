from rest_framework.permissions import BasePermission

class IsApproved(BasePermission):
    """
    Permission to check if user is approved.
    Clients don't need approval.
    Delivery personnel and business owners need approval.
    """
    message = {
        'error': 'permission_denied',
        'detail': 'Votre compte n\'a pas encore été approuvé. Veuillez attendre la validation de votre compte par un administrateur.',
        'code': 'not_approved',
        'status': 'EN_ATTENTE'
    }
    
    def has_permission(self, request, view):
        user = request.user
        
        # Clients don't need approval
        if user.user_type == 'CLIENT':
            return True
        
        # Check if user has a delivery profile or business profile
        if user.user_type == 'LIVREUR':
            try:
                # Try to access the livreur profile to verify it exists
                if hasattr(user, 'livreur'):
                    if not user.livreur.is_active:
                        self.message = {
                            'error': 'account_inactive',
                            'detail': 'Votre compte de livreur est désactivé. Veuillez contacter le support.',
                            'code': 'account_inactive',
                            'status': 'INACTIVE'
                        }
                        return False
                else:
                    # Profile doesn't exist
                    self.message = {
                        'error': 'profile_not_found',
                        'detail': 'Profil livreur non trouvé. Veuillez compléter votre inscription.',
                        'code': 'profile_not_found',
                        'status': 'NOT_FOUND'
                    }
                    return False
            except Exception:
                self.message = {
                    'error': 'profile_not_found',
                    'detail': 'Profil livreur non trouvé. Veuillez compléter votre inscription.',
                    'code': 'profile_not_found',
                    'status': 'NOT_FOUND'
                }
                return False
        
        # For other user types (RESTAURANT, SUPERMARCHE)
        if user.user_type in ['RESTAURANT', 'SUPERMARCHE']:
            try:
                if user.user_type == 'RESTAURANT':
                    if not hasattr(user, 'restaurant') or not user.restaurant:
                        self.message = {
                            'error': 'profile_not_found',
                            'detail': f'Profil {user.get_user_type_display().lower()} non trouvé.',
                            'code': 'profile_not_found',
                            'status': 'NOT_FOUND'
                        }
                        return False
                elif user.user_type == 'SUPERMARCHE':
                    if not hasattr(user, 'supermarche') or not user.supermarche:
                        self.message = {
                            'error': 'profile_not_found',
                            'detail': f'Profil {user.get_user_type_display().lower()} non trouvé.',
                            'code': 'profile_not_found',
                            'status': 'NOT_FOUND'
                        }
                        return False
            except Exception:
                self.message = {
                    'error': 'profile_not_found',
                    'detail': 'Profil non trouvé.',
                    'code': 'profile_not_found',
                    'status': 'NOT_FOUND'
                }
                return False
        
        # Check approval status
        if user.is_approved is True:
            return True
        elif user.is_approved is False:
            self.message = {
                'error': 'not_approved',
                'detail': 'Votre compte a été rejeté. Veuillez contacter le support pour plus d\'informations.',
                'code': 'rejected',
                'status': 'REJETE'
            }
            return False
        else:  # is_approved is None (pending)
            self.message = {
                'error': 'pending_approval',
                'detail': 'Votre demande d\'approbation est en cours de traitement. Vous recevrez une notification une fois votre compte approuvé.',
                'code': 'pending',
                'status': 'EN_ATTENTE'
            }
            return False

class IsVerified(BasePermission):
    """Permission to check if user's email is verified."""
    def has_permission(self, request, view):
        return request.user.is_verified

class IsAdmin(BasePermission):
    """Permission to check if user is admin."""
    def has_permission(self, request, view):
        return request.user.is_admin_user()

class IsRestaurantOwner(BasePermission):
    """Permission to check if user is a restaurant owner."""
    def has_permission(self, request, view):
        return request.user.is_restaurant()

class IsSupermarketOwner(BasePermission):
    """Permission to check if user is a supermarket owner."""
    def has_permission(self, request, view):
        return request.user.is_supermarche()

class IsDelivery(BasePermission):
    """Permission to check if user is delivery personnel."""
    def has_permission(self, request, view):
        return request.user.is_livreur()

class IsClient(BasePermission):
    """Permission to check if user is a client."""
    def has_permission(self, request, view):
        return request.user.is_client()
