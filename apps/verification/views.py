from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from apps.users.models import User, DocumentVerification, HistoriqueVerification, NotificationVerification
from apps.verification.serializers import (
    DocumentUploadSerializer, DocumentDetailSerializer, VerificationStatusSerializer,
    AdminVerificationListSerializer, AdminVerificationDetailSerializer,
    HistoriqueVerificationSerializer
)
from apps.verification.permissions import CanVerify, IsVerificationApplicable, IsOwnerOrAdmin
from apps.users.permissions import IsApproved

class VerificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsVerificationApplicable]
    
    @action(detail=False, methods=['get'])
    def documents_requis(self, request):
        """Get list of required documents for current user type"""
        user_type_docs = {
            'LIVREUR': [
                'PIECE_IDENTITE', 'PERMIS_CONDUIRE', 'CARTE_GRISE', 'ASSURANCE',
                'PHOTO_VEHICULE', 'CASIER_JUDICIAIRE', 'ATTESTATION_DOMICILE', 'CERTIFICAT_MEDICAL'
            ],
            'RESTAURANT': [
                'REGISTRE_COMMERCE', 'LICENCE_RESTAURANT', 'AUTORISATION_SANITAIRE',
                'PIECE_IDENTITE', 'PHOTO_ETABLISSEMENT', 'CERTIFICAT_DOMICILIATION', 'CONTRAT'
            ],
            'SUPERMARCHE': [
                'REGISTRE_COMMERCE', 'AUTORISATION_SANITAIRE', 'PIECE_IDENTITE',
                'PHOTO_ETABLISSEMENT', 'CERTIFICAT_DOMICILIATION'
            ],
        }
        
        required = user_type_docs.get(request.user.user_type, [])
        submitted = request.user.documents.values_list('document_type', flat=True)
        
        return Response({
            'required_documents': required,
            'submitted_documents': list(submitted),
            'pending_documents': [doc for doc in required if doc not in submitted]
        })
    
    @action(detail=False, methods=['post'])
    def soumettre_documents(self, request):
        """Submit multiple documents at once"""
        files = request.FILES.getlist('files')
        if not files:
            return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        documents = []
        for file in files:
            doc_type = request.data.get(f'type_{file.name}', 'AUTRE')
            doc = DocumentVerification.objects.create(
                user=request.user,
                document_type=doc_type,
                file=file,
                original_filename=file.name,
            )
            documents.append(doc)
        
        # Create history entry
        HistoriqueVerification.objects.create(
            user=request.user,
            action='DOCUMENTS_AJOUTES',
            old_status=request.user.statut_verification,
            new_status=request.user.statut_verification,
        )
        
        return Response(
            DocumentDetailSerializer(documents, many=True).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def document(self, request):
        """Upload a single document"""
        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            document = serializer.save()
            return Response(
                DocumentDetailSerializer(document).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def mes_documents(self, request):
        """Get user's submitted documents"""
        documents = request.user.documents.all()
        serializer = DocumentDetailSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statut(self, request):
        """Get verification status"""
        serializer = VerificationStatusSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def historique(self, request):
        """Get verification history"""
        history = request.user.verification_history.all()
        serializer = HistoriqueVerificationSerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def resoumission(self, request):
        """Resubmit after rejection"""
        if request.user.statut_verification != 'REJETE':
            return Response(
                {'error': 'Can only resubmit rejected accounts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request.user.statut_verification = 'EN_ATTENTE'
        request.user.date_soumission = timezone.now()
        request.user.motif_rejet = None
        request.user.save()
        
        HistoriqueVerification.objects.create(
            user=request.user,
            action='SOUMISSION_INITIALE',
            old_status='REJETE',
            new_status='EN_ATTENTE',
            performed_by=request.user,
        )
        
        return Response({'message': 'Resubmission successful'})


class AdminVerificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, CanVerify]
    
    @action(detail=False, methods=['get'])
    def en_attente(self, request):
        """Get accounts pending verification"""
        users = User.objects.filter(
            statut_verification='EN_ATTENTE',
            user_type__in=['RESTAURANT', 'SUPERMARCHE', 'LIVREUR']
        ).annotate(doc_count=Count('documents'))
        
        serializer = AdminVerificationListSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def en_cours(self, request):
        """Get accounts under verification"""
        users = User.objects.filter(
            statut_verification='EN_COURS_VERIFICATION',
            user_type__in=['RESTAURANT', 'SUPERMARCHE', 'LIVREUR']
        )
        serializer = AdminVerificationListSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Get verification statistics"""
        total = User.objects.filter(
            user_type__in=['RESTAURANT', 'SUPERMARCHE', 'LIVREUR']
        ).count()
        approved = User.objects.filter(is_approved=True).count()
        rejected = User.objects.filter(statut_verification='REJETE').count()
        pending = User.objects.filter(statut_verification='EN_ATTENTE').count()
        
        return Response({
            'total_accounts': total,
            'approved': approved,
            'rejected': rejected,
            'pending': pending,
            'approval_rate': f"{(approved/total*100):.1f}%" if total > 0 else "0%"
        })
    
    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        """Get account details for verification"""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AdminVerificationDetailSerializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approuver_compte(self, request, pk=None):
        """Approve entire account"""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user.statut_verification = 'APPROUVE'
        user.is_approved = True
        user.date_verification = timezone.now()
        user.admin_verificateur = request.user
        user.save()
        
        HistoriqueVerification.objects.create(
            user=user,
            action='APPROUVE',
            old_status='EN_COURS_VERIFICATION',
            new_status='APPROUVE',
            performed_by=request.user,
        )
        
        NotificationVerification.objects.create(
            user=user,
            notification_type='APPROUVE',
            title='Compte approuvé',
            message='Félicitations! Votre compte a été approuvé.',
        )
        
        return Response({'message': 'Account approved'})
    
    @action(detail=True, methods=['post'])
    def rejeter_compte(self, request, pk=None):
        """Reject account"""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        motif = request.data.get('motif', 'Raison non spécifiée')
        user.statut_verification = 'REJETE'
        user.is_approved = False
        user.motif_rejet = motif
        user.date_verification = timezone.now()
        user.admin_verificateur = request.user
        user.save()
        
        HistoriqueVerification.objects.create(
            user=user,
            action='REJETE',
            old_status='EN_COURS_VERIFICATION',
            new_status='REJETE',
            performed_by=request.user,
            comment=motif,
        )
        
        NotificationVerification.objects.create(
            user=user,
            notification_type='REJETE',
            title='Compte rejeté',
            message=f'Votre compte a été rejeté. Raison: {motif}',
        )
        
        return Response({'message': 'Account rejected'})
    
    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        """Suspend account"""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        motif = request.data.get('motif', 'Raison non spécifiée')
        user.statut_verification = 'SUSPENDU'
        user.is_active = False
        user.save()
        
        HistoriqueVerification.objects.create(
            user=user,
            action='SUSPENSION',
            old_status=user.statut_verification,
            new_status='SUSPENDU',
            performed_by=request.user,
            comment=motif,
        )
        
        return Response({'message': 'Account suspended'})
    
    @action(detail=True, methods=['post'])
    def reactiver(self, request, pk=None):
        """Reactivate account"""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user.is_active = True
        user.statut_verification = 'APPROUVE'
        user.save()
        
        HistoriqueVerification.objects.create(
            user=user,
            action='REACTIVATION',
            old_status='SUSPENDU',
            new_status='APPROUVE',
            performed_by=request.user,
        )
        
        return Response({'message': 'Account reactivated'})
