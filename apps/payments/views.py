from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)

# CamPay API Configuration
CAMPAY_APP_USERNAME = getattr(settings, 'CAMPAY_APP_USERNAME', 'MqQym06nicpCYvd13-l6dzfZ-h7BNyyuh4btJgH0Il2EElwblAynBeMZ-rQ1c4Fge_WcRYCLm0awL2GYT4CaUQ')
CAMPAY_APP_PASSWORD = getattr(settings, 'CAMPAY_APP_PASSWORD', '3TQaTg7tBhjE8HxVgI6J_U9ihN-1qM_UWbivpje6cBWus64scmti7jpBgAS7Sub7A_LSGDNkZo3-dJFQeG3CWg')
CAMPAY_ENVIRONMENT = getattr(settings, 'CAMPAY_ENVIRONMENT', 'DEV')  # Use 'PROD' for production

CAMPAY_BASE_URL = {
    'DEV': 'https://demo.campay.net/api',
    'PROD': 'https://www.campay.net/api'
}.get(CAMPAY_ENVIRONMENT, 'https://demo.campay.net/api')


def get_campay_token():
    """Get CamPay API token"""
    url = f"{CAMPAY_BASE_URL}/token/"
    data = {
        'username': CAMPAY_APP_USERNAME,
        'password': CAMPAY_APP_PASSWORD
    }
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            return response.json().get('token')
        logger.error(f"CamPay token error: {response.text}")
        return None
    except Exception as e:
        logger.error(f"CamPay token exception: {str(e)}")
        return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    """
    Initiate a CamPay payment collection
    Expected data: {
        "amount": "500",
        "phone": "2376xxxxxxxx",
        "external_reference": "ORDER-123",
        "description": "Payment for order"
    }
    """
    amount = request.data.get('amount')
    phone = request.data.get('phone')
    external_reference = request.data.get('external_reference', '')
    description = request.data.get('description', 'Payment')

    if not amount or not phone:
        return Response(
            {'error': 'Amount and phone are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get token
    token = get_campay_token()
    if not token:
        return Response(
            {'error': 'Failed to authenticate with CamPay'},
            status=status.HTTP_500_BAD_REQUEST
        )

    url = f"{CAMPAY_BASE_URL}/collect/"

    # Format phone number (remove spaces, ensure country code)
    phone = phone.replace(' ', '').replace('-', '')
    if not phone.startswith('237'):
        if phone.startswith('6'):
            phone = '237' + phone
        elif phone.startswith('+237'):
            phone = phone.replace('+237', '237')

    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }

    data = {
        'amount': str(amount),
        'currency': 'XAF',
        'from': phone,
        'description': description,
        'external_reference': external_reference
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        logger.info(f"CamPay collect response: {response.status_code} - {response.text}")

        if response.status_code == 200:
            result = response.json()
            return Response({
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status'),
                'operator': result.get('operator'),
                'message': 'Payment initiated successfully. Please complete the USSD prompt on your phone.'
            })
        else:
            return Response({
                'success': False,
                'error': response.json().get('detail', 'Payment initiation failed'),
                'message': 'Failed to initiate payment'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay payment exception: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment_with_collect(request):
    """
    Initiate a CamPay payment collection using initCollect (non-blocking)
    This method immediately returns a reference to check status later
    """
    amount = request.data.get('amount')
    phone = request.data.get('phone')
    external_reference = request.data.get('external_reference', '')
    description = request.data.get('description', 'Payment')

    if not amount or not phone:
        return Response(
            {'error': 'Amount and phone are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get token
    token = get_campay_token()
    if not token:
        return Response(
            {'error': 'Failed to authenticate with CamPay'},
            status=status.HTTP_500_BAD_REQUEST
        )

    url = f"{CAMPAY_BASE_URL}/initCollect/"

    # Format phone number
    phone = phone.replace(' ', '').replace('-', '')
    if not phone.startswith('237'):
        if phone.startswith('6'):
            phone = '237' + phone
        elif phone.startswith('+237'):
            phone = phone.replace('+237', '237')

    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }

    data = {
        'amount': str(amount),
        'currency': 'XAF',
        'from': phone,
        'description': description,
        'external_reference': external_reference
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        logger.info(f"CamPay initCollect response: {response.status_code} - {response.text}")

        if response.status_code == 200:
            result = response.json()
            return Response({
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status', 'PENDING'),
                'operator': result.get('operator'),
                'ussd_code': result.get('ussd_code'),
                'message': 'Payment initiated. Please complete the USSD prompt and check status.'
            })
        else:
            return Response({
                'success': False,
                'error': response.json().get('detail', 'Payment initiation failed'),
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay initCollect exception: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request):
    """
    Check payment status using the transaction reference
    """
    reference = request.query_params.get('reference')

    if not reference:
        return Response(
            {'error': 'Reference is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get token
    token = get_campay_token()
    if not token:
        return Response(
            {'error': 'Failed to authenticate with CamPay'},
            status=status.HTTP_500_BAD_REQUEST
        )

    url = f"{CAMPAY_BASE_URL}/get_transaction_status/"
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }

    data = {'reference': reference}

    try:
        response = requests.post(url, json=data, headers=headers)
        logger.info(f"CamPay status check: {response.status_code} - {response.text}")

        if response.status_code == 200:
            result = response.json()
            return Response({
                'reference': result.get('reference'),
                'status': result.get('status'),
                'amount': result.get('amount'),
                'currency': result.get('currency'),
                'operator': result.get('operator'),
                'operator_reference': result.get('operator_reference')
            })
        else:
            return Response({
                'error': 'Failed to get payment status',
                'details': response.json()
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay status check exception: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_BAD_REQUEST
        )

