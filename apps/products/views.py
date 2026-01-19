from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.products.models import Produit
from apps.products.serializers import ProduitSerializer, ProduitCreateUpdateSerializer
from apps.users.permissions import IsApproved
from apps.restaurants.models import Restaurant
from apps.supermarches.models import Supermarche

class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated, IsApproved]
    
    def get_queryset(self):
        """
        Override get_queryset to handle different querysets for read vs write operations.
        
        For write operations (PATCH, PUT, DELETE), return all products to allow finding them.
        For read operations (GET, LIST):
        - If the user is viewing their own products (restaurant owner or supermarket owner), 
          return ALL products (including unavailable) so they can manage their menu.
        - If the user is a client or browsing, only return available products.
        """
        user = self.request.user
        
        # For write operations, return all products without filtering by available
        if self.action in ['update', 'partial_update', 'destroy', 'retrieve']:
            queryset = Produit.objects.all()
        else:
            # For read operations (list), check if user owns the products they're viewing
            restaurant = self.request.query_params.get('restaurant')
            supermarche = self.request.query_params.get('supermarche')
            
            # Check if the user is viewing their own products
            is_own_products = False
            
            if user and user.is_authenticated:
                # Check if user has a restaurant profile and is viewing their own restaurant's products
                try:
                    if hasattr(user, 'restaurant') and user.restaurant:
                        if restaurant == str(user.restaurant.id):
                            is_own_products = True
                except (Restaurant.DoesNotExist, AttributeError):
                    pass
                
                # Check if user has a supermarket profile and is viewing their own supermarket's products
                try:
                    if hasattr(user, 'supermarche') and user.supermarche:
                        if supermarche == str(user.supermarche.id):
                            is_own_products = True
                except (Supermarche.DoesNotExist, AttributeError):
                    pass
            
            # If viewing own products, show ALL products (including unavailable)
            # If browsing as client:
            #   - With restaurant/supermarche filter: show ALL products so clients can see full menu
            #   - Without filter: only show available products
            if is_own_products:
                queryset = Produit.objects.all()
            elif restaurant or supermarche:
                # When viewing a specific restaurant/supermarket, show ALL products
                # so clients can see the full menu (including unavailable items)
                queryset = Produit.objects.all()
            else:
                # Browsing all products without specific restaurant/supermarket
                queryset = Produit.objects.filter(available=True)
            
            # Apply filters
            if restaurant:
                queryset = queryset.filter(restaurant_id=restaurant)
            if supermarche:
                queryset = queryset.filter(supermarche_id=supermarche)
        
        return queryset
    
    def get_object(self):
        """
        Retrieve the object and check ownership for write operations.
        """
        queryset = self.get_queryset()
        # Use the full queryset (not filtered by available) for get_object
        obj = get_object_or_404(queryset, pk=self.kwargs.get('pk'))
        
        # Check ownership for write operations
        if self.action in ['update', 'partial_update', 'destroy']:
            user = self.request.user
            product = obj
            
            # Check if user owns this product (through restaurant or supermarche)
            is_owner = False
            
            # Check if user has a restaurant profile and owns this product
            try:
                if hasattr(user, 'restaurant') and user.restaurant:
                    restaurant = user.restaurant
                    if product.restaurant_id == restaurant.id:
                        is_owner = True
            except Restaurant.DoesNotExist:
                pass
            
            # Check if user has a supermarche profile and owns this product
            try:
                if hasattr(user, 'supermarche') and user.supermarche:
                    supermarche = user.supermarche
                    if product.supermarche_id == supermarche.id:
                        is_owner = True
            except Supermarche.DoesNotExist:
                pass
            
            # Also check if product was created with the user's profile (fallback)
            if not is_owner:
                try:
                    if product.restaurant and product.restaurant.owner_id == user.id:
                        is_owner = True
                except (Restaurant.DoesNotExist, AttributeError):
                    pass
                
                try:
                    if product.supermarche and product.supermarche.owner_id == user.id:
                        is_owner = True
                except (Supermarche.DoesNotExist, AttributeError):
                    pass
            
            if not is_owner:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Vous n'êtes pas autorisé à modifier ce produit.")
        
        return obj
    
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
        if hasattr(user, 'restaurant') and user.restaurant:
            serializer.save(restaurant=user.restaurant)
            return
        
        # Check if user has a supermarket profile
        if hasattr(user, 'supermarche') and user.supermarche:
            serializer.save(supermarche=user.supermarche)
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
    
    def update(self, request, *args, **kwargs):
        """
        Override update to handle partial updates properly.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Refresh the instance to get updated data
        instance.refresh_from_db()
        
        # Return the updated serializer with the base serializer class
        return Response(ProduitSerializer(instance).data, status=status.HTTP_200_OK)
    
    def perform_update(self, serializer):
        serializer.save()
