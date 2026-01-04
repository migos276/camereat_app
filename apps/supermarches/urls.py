from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.supermarches.views import SupermarcheViewSet

router = DefaultRouter()
router.register(r'', SupermarcheViewSet, basename='supermarche')

urlpatterns = [
    path('', include(router.urls)),
]
