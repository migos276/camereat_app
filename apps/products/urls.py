from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products.views import ProduitViewSet

router = DefaultRouter()
router.register(r'', ProduitViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]
