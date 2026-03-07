from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.geolocation.views import GeolocationViewSet, ZoneLivraisonViewSet

router = DefaultRouter()
router.register(r'zones', ZoneLivraisonViewSet, basename='zone')
router.register(r'', GeolocationViewSet, basename='geolocation')

urlpatterns = [
    path('', include(router.urls)),
]
