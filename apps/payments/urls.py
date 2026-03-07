from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Payment initiation (blocking - waits for completion)
    path('initiate/', views.initiate_payment, name='initiate_payment'),
    
    # Payment initiation (non-blocking - returns reference immediately)
    path('initiate-collect/', views.initiate_payment_with_collect, name='initiate_payment_with_collect'),
    
    # Withdraw/disburse funds
    path('withdraw/', views.withdraw, name='withdraw'),
    
    # Check transaction status
    path('status/', views.check_payment_status, name='check_payment_status'),
    
    # Get account balance
    path('balance/', views.get_balance, name='get_balance'),
    
    # Webhook for payment notifications
    path('webhook/', views.webhook, name='webhook'),
    
    # Validate phone number
    path('validate-phone/', views.validate_phone, name='validate_phone'),
]

