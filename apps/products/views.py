from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.products.models import Produit
from apps.products.serializers import ProduitSerializer, ProduitCreateUpdateSerializer
from apps.users.permissions import IsApproved

class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        restaurant = self.request.query_params.get('restaurant')
        supermarche = self.request.query_params.get('supermarche')
        
        queryset = Produit.objects.filter(available=True)
        if restaurant:
            queryset = queryset.filter(restaurant_id=restaurant)
        if supermarche:
            queryset = queryset.filter(supermarche_id=supermarche)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProduitCreateUpdateSerializer
        return ProduitSerializer
