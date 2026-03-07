from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from apps.restaurants.views import RestaurantViewSet, RegisterRestaurantProfileView

router = DefaultRouter()
router.register(r'', RestaurantViewSet, basename='restaurant')

urlpatterns = [
    # Explicit URL patterns must come BEFORE router include to avoid 405 errors
    # The router catches all patterns including register-profile/ and returns 405
    re_path(r'^register-profile/$', RegisterRestaurantProfileView.as_view(), name='restaurant-register-profile'),
    path('', include(router.urls)),
]
