from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.users.models import User, Address, DocumentVerification

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'label', 'street', 'city', 'neighborhood', 'postal_code', 
                  'country', 'latitude', 'longitude', 'is_main', 'delivery_instructions']
        read_only_fields = ['id']

class DocumentVerificationSerializer(serializers.ModelSerializer):
    days_until_expiry = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentVerification
        fields = ['id', 'document_type', 'file', 'original_filename', 'document_number',
                  'expiry_date', 'status', 'rejection_reason', 'is_mandatory', 'date_upload',
                  'days_until_expiry', 'is_expired']
        read_only_fields = ['id', 'status', 'rejection_reason', 'date_upload']
    
    def get_days_until_expiry(self, obj):
        return obj.days_until_expiry()
    
    def get_is_expired(self, obj):
        return obj.is_expired()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    addresses = AddressSerializer(many=True, read_only=True)
    restaurant_id = serializers.SerializerMethodField()
    supermarket_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name', 'phone',
            'photo_profil', 'user_type', 'statut_verification', 'is_verified',
            'is_approved', 'addresses', 'restaurant_id', 'supermarket_id', 'date_creation'
        ]
        read_only_fields = ['id', 'date_creation', 'user_type', 'statut_verification']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_restaurant_id(self, obj):
        try:
            return obj.restaurant.id
        except:
            return None

    def get_supermarket_id(self, obj):
        try:
            return obj.supermarche.id
        except:
            return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm', 'user_type', 'phone']
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas'})
        
        # Normaliser user_type en majuscules si fourni
        if 'user_type' in data and data['user_type']:
            user_type_upper = data['user_type'].upper()
            
            # Vérifier que la valeur est valide
            valid_choices = [choice[0] for choice in User.USER_TYPE_CHOICES]
            if user_type_upper not in valid_choices:
                raise serializers.ValidationError({
                    'user_type': f'"{data["user_type"]}" n\'est pas un choix valide. '
                                 f'Les valeurs valides sont: {", ".join(valid_choices)}'
                })
            
            data['user_type'] = user_type_upper
        
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        import logging
        logger = logging.getLogger(__name__)
        
        email = data.get('email')
        password = data.get('password')
        
        logger.info(f"[Login] Tentative de connexion pour: {email}")
        
        # Log des données reçues (sans le mot de passe en clair)
        logger.info(f"[Login] Données reçues: email={email}, password_length={len(password)}")
        
        # Vérifier si l'email est valide
        if not email:
            logger.warning(f"[Login] Échec: Email vide")
            raise serializers.ValidationError({'error': 'L\'email est requis'})
        
        # Vérifier si le mot de passe est vide
        if not password:
            logger.warning(f"[Login] Échec: Mot de passe vide pour {email}")
            raise serializers.ValidationError({'error': 'Le mot de passe est requis'})
        
        # Vérifier si l'utilisateur existe
        try:
            user = User.objects.get(email=email)
            logger.info(f"[Login] Utilisateur trouvé: ID={user.id}, email={user.email}, type={user.user_type}")
            logger.info(f"[Login] Statuts: is_active={user.is_active}, is_approved={user.is_approved}, is_verified={user.is_verified}")
        except User.DoesNotExist:
            logger.warning(f"[Login] Échec: Aucun utilisateur avec l'email {email}")
            raise serializers.ValidationError({'error': 'Email ou mot de passe incorrect'})
        
        # Vérifier si le compte est actif
        if not user.is_active:
            logger.warning(f"[Login] Échec: Compte inactif pour {email}")
            raise serializers.ValidationError({'error': 'Votre compte a été désactivé. Veuillez contacter le support.'})
        
        # Vérifier si le compte est approuvé (pour les non-CLIENT)
        if user.user_type != 'CLIENT' and user.is_approved is False:
            logger.warning(f"[Login] Échec: Compte non approuvé pour {email}")
            raise serializers.ValidationError({'error': 'Votre compte est en attente d\'approbation par l\'administrateur.'})
        
        # Vérifier si le compte est vérifié
        if user.user_type != 'CLIENT' and not user.is_verified:
            logger.warning(f"[Login] Échec: Compte non vérifié pour {email}")
            raise serializers.ValidationError({'error': 'Votre compte n\'a pas encore été vérifié.'})
        
        # Vérifier le mot de passe
        if not user.check_password(password):
            logger.warning(f"[Login] Échec: Mot de passe incorrect pour {email}")
            # Utiliser un message générique pour des raisons de sécurité
            raise serializers.ValidationError({'error': 'Email ou mot de passe incorrect'})
        
        # Authentification réussie
        data['user'] = user
        logger.info(f"[Login] Connexion réussie pour {email}")
        return data
