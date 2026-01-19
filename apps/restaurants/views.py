import logging
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.db.models import Q
from apps.restaurants.models import Restaurant, CategorieRestaurant
from apps.restaurants.serializers import (
    RestaurantListSerializer, RestaurantDetailSerializer, 
    RestaurantUpdateSerializer
)
from apps.users.permissions import IsRestaurantOwner, IsApproved

logger = logging.getLogger(__name__)

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.filter(is_active=True, user__is_approved=True)
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RestaurantDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return RestaurantUpdateSerializer
        return RestaurantListSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search restaurants by name or description"""
        query = request.query_params.get('q', '').strip()
        logger.info(f"[RESTAURANTS] search endpoint called with query: '{query}'")

        if not query:
            logger.warning("[RESTAURANTS] Empty search query provided")
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()
        restaurants = queryset.filter(
            Q(commercial_name__icontains=query) |
            Q(description__icontains=query) |
            Q(cuisine_type__icontains=query)
        )

        result_count = restaurants.count()
        logger.info(f"[RESTAURANTS] Found {result_count} restaurants matching query '{query}'")

        serializer = RestaurantListSerializer(restaurants, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get nearby restaurants with distance"""
        logger.info(f"[RESTAURANTS] nearby endpoint called with params: {request.query_params}")
        
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius_km = request.query_params.get('radius', 5)
        
        logger.info(f"[RESTAURANTS] Parsed params - lat: {lat}, lon: {lon}, radius: {radius_km}")
        
        if not lat or not lon:
            logger.warning(f"[RESTAURANTS] Missing coordinates - lat: {lat}, lon: {lon}")
            return Response({'error': 'Latitude and longitude required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            lat_float = float(lat)
            lon_float = float(lon)
            radius_float = float(radius_km)
            
            logger.info(f"[RESTAURANTS] Converting to float - lat: {lat_float}, lon: {lon_float}, radius: {radius_float}")
            
            # Validate coordinate ranges
            if not (-90 <= lat_float <= 90):
                logger.warning(f"[RESTAURANTS] Invalid latitude: {lat_float}")
                return Response({'error': 'Invalid latitude value. Must be between -90 and 90.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not (-180 <= lon_float <= 180):
                logger.warning(f"[RESTAURANTS] Invalid longitude: {lon_float}")
                return Response({'error': 'Invalid longitude value. Must be between -180 and 180.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create point with SRID 4326 (WGS84 - standard GPS coordinates)
            user_location = Point(lon_float, lat_float, srid=4326)
            
            # Log queryset info
            queryset = self.get_queryset()
            total_restaurants = queryset.count()
            logger.info(f"[RESTAURANTS] Total active/approved restaurants: {total_restaurants}")
            
            # Check how many have valid positions
            restaurants_with_position = queryset.exclude(position__isnull=True).count()
            logger.info(f"[RESTAURANTS] Restaurants with valid position: {restaurants_with_position}")
            
            restaurants = queryset.annotate(
                distance=Distance('position', user_location)
            ).filter(distance__lte=D(km=radius_float)).order_by('distance')
            
            result_count = restaurants.count()
            logger.info(f"[RESTAURANTS] Restaurants found within {radius_float}km: {result_count}")
            
            if result_count == 0:
                logger.info(f"[RESTAURANTS] No restaurants found in radius, returning empty list")
                return Response([])
            
            request.user_location = (lat_float, lon_float)
            serializer = RestaurantListSerializer(
                restaurants, many=True, context={'request': request}
            )
            logger.info(f"[RESTAURANTS] Successfully serialized {result_count} restaurants")
            return Response(serializer.data)
        except ValueError as e:
            logger.error(f"[RESTAURANTS] ValueError in nearby endpoint: {e}")
            return Response(
                {'error': f'Invalid coordinate format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"[RESTAURANTS] Unexpected error in nearby endpoint: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def menu(self, request, pk=None):
        """Get restaurant menu - returns ALL products for clients to see full menu"""
        restaurant = self.get_object()
        from apps.products.models import Produit
        # Show ALL products (including unavailable) so clients can see the full menu
        products = Produit.objects.filter(restaurant=restaurant)
        from apps.products.serializers import ProduitSerializer
        serializer = ProduitSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsRestaurantOwner])
    def my_restaurant(self, request):
        """Get current user's restaurant"""
        try:
            # Check if user has a restaurant profile
            if not hasattr(request.user, 'restaurant'):
                logger.warning(f"[RESTAURANTS] User {request.user.id} does not have a restaurant profile")
                return Response({
                    'error': 'Restaurant profile not found',
                    'message': 'Your restaurant profile has not been created yet. Please complete your profile setup.',
                    'needs_setup': True
                }, status=status.HTTP_404_NOT_FOUND)
            
            restaurant = request.user.restaurant
            serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
            return Response(serializer.data)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put', 'patch'], permission_classes=[IsAuthenticated, IsRestaurantOwner, IsApproved])
    def update_profile(self, request):
        """Update restaurant profile - supports multipart/form-data for file uploads"""
        try:
            # Check if user has a restaurant profile, if not create one
            if not hasattr(request.user, 'restaurant'):
                logger.info(f"[RESTAURANTS] Auto-creating restaurant profile for user {request.user.id}")
                from apps.restaurants.models import Restaurant
                
                commercial_name = request.user.first_name or request.user.get_full_name() or f"Restaurant de {request.user.email.split('@')[0]}"
                legal_name = f"{commercial_name} SARL"
                
                restaurant = Restaurant.objects.create(
                    user=request.user,
                    commercial_name=commercial_name,
                    legal_name=legal_name,
                    description="À compléter - Profil créé automatiquement",
                    full_address="À compléter",
                    cuisine_type='AUTRE',
                    price_level='€€',
                )
                logger.info(f"[RESTAURANTS] Created restaurant profile: {restaurant.id} for user {request.user.id}")
            
            restaurant = request.user.restaurant
            
            # Check if this is a multipart request (file upload)
            content_type = request.content_type
            if content_type and 'multipart' in content_type:
                # Handle multipart form data with files
                serializer = RestaurantUpdateSerializer(
                    restaurant, data=request.data, partial=True, context={'request': request}
                )
            else:
                # Regular JSON request
                serializer = RestaurantUpdateSerializer(
                    restaurant, data=request.data, partial=True
                )
            
            if serializer.is_valid():
                # Save the main data first
                saved_restaurant = serializer.save()
                
                # Handle latitude/longitude updates and position auto-calculation
                latitude = request.data.get('latitude') or serializer.validated_data.get('latitude')
                longitude = request.data.get('longitude') or serializer.validated_data.get('longitude')
                
                if latitude and longitude:
                    try:
                        lat_float = float(latitude)
                        lon_float = float(longitude)
                        
                        # Validate coordinate ranges
                        if -90 <= lat_float <= 90 and -180 <= lon_float <= 180:
                            # Update latitude/longitude fields
                            restaurant.latitude = lat_float
                            restaurant.longitude = lon_float
                            
                            # Update position field (PointField requires (lon, lat) order in GeoDjango)
                            from django.contrib.gis.geos import Point
                            restaurant.position = Point(lon_float, lat_float, srid=4326)
                            restaurant.save()
                            logger.info(f"[RESTAURANTS] Updated position for restaurant {restaurant.id}: ({lat_float}, {lon_float})")
                    except (ValueError, TypeError) as e:
                        logger.warning(f"[RESTAURANTS] Invalid coordinates provided: lat={latitude}, lon={longitude}, error={e}")
                
                # Return full updated restaurant data
                from apps.restaurants.serializers import RestaurantDetailSerializer
                detail_serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
                return Response(detail_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsRestaurantOwner, IsApproved])
    def upload_logo(self, request):
        """Upload restaurant logo image"""
        try:
            if not hasattr(request.user, 'restaurant'):
                return Response({'error': 'Restaurant profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
            restaurant = request.user.restaurant
            
            if 'logo' not in request.FILES:
                return Response({'error': 'No logo file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            restaurant.logo = request.FILES['logo']
            restaurant.save()
            
            from apps.restaurants.serializers import RestaurantDetailSerializer
            serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.exception(f"[RESTAURANTS] Error uploading logo: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsRestaurantOwner, IsApproved])
    def upload_cover_image(self, request):
        """Upload restaurant cover image"""
        try:
            if not hasattr(request.user, 'restaurant'):
                return Response({'error': 'Restaurant profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
            restaurant = request.user.restaurant
            
            if 'cover_image' not in request.FILES:
                return Response({'error': 'No cover_image file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            restaurant.cover_image = request.FILES['cover_image']
            restaurant.save()
            
            from apps.restaurants.serializers import RestaurantDetailSerializer
            serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.exception(f"[RESTAURANTS] Error uploading cover image: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsRestaurantOwner])
    def dashboard_stats(self, request):
        """Get restaurant dashboard statistics"""
        try:
            # Check if user has a restaurant profile, if not create one
            if not hasattr(request.user, 'restaurant'):
                logger.info(f"[RESTAURANTS] Auto-creating restaurant profile for user {request.user.id}")
                from apps.restaurants.models import Restaurant
                
                commercial_name = request.user.first_name or request.user.get_full_name() or f"Restaurant de {request.user.email.split('@')[0]}"
                legal_name = f"{commercial_name} SARL"
                
                restaurant = Restaurant.objects.create(
                    user=request.user,
                    commercial_name=commercial_name,
                    legal_name=legal_name,
                    description="À compléter - Profil créé automatiquement",
                    full_address="À compléter",
                    cuisine_type='AUTRE',
                    price_level='€€',
                )
                logger.info(f"[RESTAURANTS] Created restaurant profile: {restaurant.id} for user {request.user.id}")
            
            restaurant = request.user.restaurant
            from django.utils import timezone
            from django.db.models import Count, Sum, Avg
            from datetime import timedelta
            from apps.orders.models import Commande
            
            today = timezone.now().date()
            today_start = timezone.make_aware(
                timezone.datetime.combine(today, timezone.datetime.min.time())
            )
            
            # Today's orders count
            today_orders_count = Commande.objects.filter(
                restaurant=restaurant,
                date_created__gte=today_start
            ).count()
            
            # Pending orders (not delivered or cancelled)
            pending_orders_count = Commande.objects.filter(
                restaurant=restaurant
            ).exclude(
                status__in=['LIVREE', 'ANNULEE', 'REFUSEE']
            ).count()
            
            # Today's revenue (completed orders)
            today_revenue = Commande.objects.filter(
                restaurant=restaurant,
                date_created__gte=today_start,
                status='LIVREE'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Average preparation time from completed orders in last 7 days
            last_week = today_start - timedelta(days=7)
            avg_prep_time = Commande.objects.filter(
                restaurant=restaurant,
                date_created__gte=last_week,
                date_accepted__isnull=False,
                date_preparation__isnull=False
            ).annotate(
                prep_time=Avg(
                    expression=timezone.datetime.fromisoformat(
                        str(date_preparation) - str(date_accepted)
                    ) if False else 0
                )
            ).aggregate(avg=Avg('estimated_duration_minutes'))['avg'] or restaurant.avg_preparation_time
            
            return Response({
                'today_orders': today_orders_count,
                'pending_orders': pending_orders_count,
                'revenue': float(today_revenue),
                'avg_preparation_time': int(avg_prep_time),
                'restaurant_name': restaurant.commercial_name,
            })
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"[RESTAURANTS] Error getting dashboard stats: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsRestaurantOwner])
    def recent_orders(self, request):
        """Get recent orders for the restaurant"""
        try:
            # Check if user has a restaurant profile, if not create one
            if not hasattr(request.user, 'restaurant'):
                logger.info(f"[RESTAURANTS] Auto-creating restaurant profile for user {request.user.id}")
                from apps.restaurants.models import Restaurant

                commercial_name = request.user.first_name or request.user.get_full_name() or f"Restaurant de {request.user.email.split('@')[0]}"
                legal_name = f"{commercial_name} SARL"

                restaurant = Restaurant.objects.create(
                    user=request.user,
                    commercial_name=commercial_name,
                    legal_name=legal_name,
                    description="À compléter - Profil créé automatiquement",
                    full_address="À compléter",
                    cuisine_type='AUTRE',
                    price_level='€€',
                )
                logger.info(f"[RESTAURANTS] Created restaurant profile: {restaurant.id} for user {request.user.id}")

            restaurant = request.user.restaurant
            from django.utils import timezone
            from apps.orders.models import Commande
            from apps.orders.serializers import CommandeDetailSerializer

            # Get last 10 orders
            orders = Commande.objects.filter(
                restaurant=restaurant
            ).order_by('-date_created')[:10]

            serializer = CommandeDetailSerializer(orders, many=True)
            return Response(serializer.data)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"[RESTAURANTS] Error getting recent orders: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsRestaurantOwner])
    def orders(self, request):
        """Get all orders for the restaurant"""
        try:
            restaurant = request.user.restaurant
            from apps.orders.models import Commande
            from apps.orders.serializers import CommandeDetailSerializer
            orders = Commande.objects.filter(restaurant=restaurant).order_by('-date_created')
            serializer = CommandeDetailSerializer(orders, many=True)
            return Response(serializer.data)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"[RESTAURANTS] Error getting orders: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterRestaurantProfileView(APIView):
    """Register restaurant profile after user account creation"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check if user is already a restaurant
        if not hasattr(request.user, 'restaurant'):
            # Create restaurant profile
            restaurant = Restaurant.objects.create(
                user=request.user,
                commercial_name=request.data.get('commercial_name', f"Restaurant de {request.user.first_name or request.user.email.split('@')[0]}"),
                legal_name=request.data.get('legal_name', f"{request.data.get('commercial_name', 'Restaurant')} SARL"),
                description=request.data.get('description', ''),
                rccm_number=request.data.get('rccm_number', ''),
                tax_number=request.data.get('tax_number', ''),
                restaurant_license=request.data.get('restaurant_license', ''),
                cuisine_type=request.data.get('cuisine_type', 'AUTRE'),
                full_address=request.data.get('full_address', ''),
                delivery_radius_km=request.data.get('delivery_radius_km', 5),
                avg_preparation_time=request.data.get('avg_preparation_time', 30),
                opening_hours=request.data.get('opening_hours', {}),
                price_level=request.data.get('price_level', '€€'),
                base_delivery_fee=request.data.get('base_delivery_fee', 0),
                min_order_amount=request.data.get('min_order_amount', 0),
                bank_account=request.data.get('bank_account', {}),
            )
            
            # Set position from lat/lng
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            if latitude and longitude:
                from django.contrib.gis.geos import Point
                restaurant.position = Point(float(longitude), float(latitude))
                restaurant.latitude = latitude
                restaurant.longitude = longitude
                restaurant.save()
            
            logger.info(f"[RESTAURANTS] Created restaurant profile for user {request.user.id}")
            
            serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Restaurant profile already exists, update it
            restaurant = request.user.restaurant
            serializer = RestaurantUpdateSerializer(restaurant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                # Refresh to get full data
                from apps.restaurants.serializers import RestaurantDetailSerializer
                detail_serializer = RestaurantDetailSerializer(restaurant, context={'request': request})
                return Response(detail_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
