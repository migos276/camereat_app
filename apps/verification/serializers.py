from rest_framework import serializers
from apps.users.models import User, DocumentVerification, HistoriqueVerification, NotificationVerification

class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVerification
        fields = ['document_type', 'file', 'original_filename', 'document_number', 'expiry_date']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['original_filename'] = validated_data['file'].name
        return super().create(validated_data)

class DocumentDetailSerializer(serializers.ModelSerializer):
    days_until_expiry = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentVerification
        fields = [
            'id', 'document_type', 'file', 'original_filename', 'document_number',
            'expiry_date', 'status', 'rejection_reason', 'admin_notes', 'is_mandatory',
            'date_upload', 'date_verification', 'days_until_expiry', 'is_expired'
        ]
        read_only_fields = [
            'id', 'status', 'rejection_reason', 'admin_notes',
            'date_upload', 'date_verification', 'admin_verificateur'
        ]
    
    def get_days_until_expiry(self, obj):
        return obj.days_until_expiry()
    
    def get_is_expired(self, obj):
        return obj.is_expired()

class HistoriqueVerificationSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = HistoriqueVerification
        fields = [
            'id', 'action', 'action_display', 'old_status', 'new_status',
            'performed_by', 'performed_by_name', 'comment', 'date_action'
        ]
        read_only_fields = ['id', 'date_action']

class VerificationStatusSerializer(serializers.Serializer):
    user_type = serializers.CharField(read_only=True)
    statut_verification = serializers.CharField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    documents_submitted = serializers.IntegerField(read_only=True)
    documents_approved = serializers.IntegerField(read_only=True)
    documents_pending = serializers.IntegerField(read_only=True)
    motif_rejet = serializers.CharField(read_only=True, allow_null=True)
    date_soumission = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        user = instance
        return {
            'user_type': user.get_user_type_display(),
            'statut_verification': user.statut_verification,
            'is_verified': user.is_verified,
            'is_approved': user.is_approved,
            'documents_submitted': user.documents.count(),
            'documents_approved': user.documents.filter(status='APPROUVE').count(),
            'documents_pending': user.documents.filter(status='EN_ATTENTE').count(),
            'motif_rejet': user.motif_rejet,
            'date_soumission': user.date_soumission,
        }

class AdminVerificationListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    documents_count = serializers.SerializerMethodField()
    approved_documents = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'user_type', 'statut_verification',
            'date_soumission', 'documents_count', 'approved_documents', 'is_approved'
        ]
        read_only_fields = fields
    
    def get_documents_count(self, obj):
        return obj.documents.count()
    
    def get_approved_documents(self, obj):
        return obj.documents.filter(status='APPROUVE').count()

class AdminVerificationDetailSerializer(serializers.ModelSerializer):
    documents = DocumentDetailSerializer(many=True, read_only=True)
    verification_history = HistoriqueVerificationSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'user_type', 'statut_verification',
            'is_verified', 'is_approved', 'date_soumission', 'date_verification',
            'motif_rejet', 'notes_admin', 'admin_verificateur', 'documents',
            'verification_history'
        ]
        read_only_fields = [
            'id', 'email', 'user_type', 'date_soumission', 'date_verification',
            'documents', 'verification_history'
        ]
