from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.views import CommandeViewSet, AvisViewSet

router = DefaultRouter()
router.register(r'commandes', CommandeViewSet, basename='order')
router.register(r'avis', AvisViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]
