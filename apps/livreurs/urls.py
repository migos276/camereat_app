from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.livreurs.views import LivreurViewSet

router = DefaultRouter()
router.register(r'', LivreurViewSet, basename='livreur')

urlpatterns = [
    path('', include(router.urls)),
]
