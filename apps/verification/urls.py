from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.verification.views import VerificationViewSet, AdminVerificationViewSet

router = DefaultRouter()
router.register(r'', VerificationViewSet, basename='verification')
router.register(r'admin', AdminVerificationViewSet, basename='admin-verification')

urlpatterns = [
    path('', include(router.urls)),
]
