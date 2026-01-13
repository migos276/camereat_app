from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.products.models import Produit
from apps.products.serializers import ProduitSerializer, ProduitCreateUpdateSerializer
from apps.users.permissions import IsApproved
from apps.restaurants.models import Restaurant
from apps.supermarches.models import Supermarche

class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated, IsApproved]
    
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
    
    def perform_create(self, serializer):
        """
        Automatically assign the product to the restaurant or supermarket
        based on the authenticated user's profile.
        """
        user = self.request.user
        
        # Check if user has a restaurant profile
        if hasattr(user, 'restaurant_owner') and user.restaurant_owner:
            restaurant = Restaurant.objects.filter(owner=user).first()
            if restaurant:
                serializer.save(restaurant=restaurant)
                return
        
        # Check if user has a supermarket profile
        if hasattr(user, 'supermarche_owner') and user.supermarche_owner:
            supermarche = Supermarche.objects.filter(owner=user).first()
            if supermarche:
                serializer.save(supermarche=supermarche)
                return
        
        # If restaurant or supermarche is provided in the request data
        restaurant_id = self.request.data.get('restaurant')
        supermarche_id = self.request.data.get('supermarche')
        
        if restaurant_id:
            try:
                restaurant = Restaurant.objects.get(id=restaurant_id)
                serializer.save(restaurant=restaurant)
            except Restaurant.DoesNotExist:
                pass
        elif supermarche_id:
            try:
                supermarche = Supermarche.objects.get(id=supermarche_id)
                serializer.save(supermarche=supermarche)
            except Supermarche.DoesNotExist:
                pass
        else:
            # No restaurant or supermarket assigned - save without it
            serializer.save()
