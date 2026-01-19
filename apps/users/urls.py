from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    PasswordChangeView, VerifyEmailView, VerificationStatusView,
    ProfilePhotoUploadView, AddressViewSet
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('upload-photo/', ProfilePhotoUploadView.as_view(), name='upload-photo'),
    path('password/', PasswordChangeView.as_view(), name='password-change'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('statut-verification/', VerificationStatusView.as_view(), name='verification-status'),
    path('', include(router.urls)),
]
