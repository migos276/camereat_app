from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('initiate/', views.initiate_payment, name='initiate_payment'),
    path('initiate-collect/', views.initiate_payment_with_collect, name='initiate_payment_with_collect'),
    path('status/', views.check_payment_status, name='check_payment_status'),
    path('balance/', views.get_balance, name='get_balance'),
]

