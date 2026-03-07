from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import logging

from apps.payments.services import payment_service

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    """
    Initiate a CamPay payment collection (blocking - waits for completion)
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

    try:
        # Use the SDK to collect payment (blocks until complete)
        result = payment_service.collect(
            amount=amount,
            phone=phone,
            description=description,
            external_reference=external_reference
        )

        if result.get('success'):
            payment_status = result.get('status')
            
            if payment_status == 'SUCCESSFUL':
                return Response({
                    'success': True,
                    'reference': result.get('reference'),
                    'status': payment_status,
                    'operator': result.get('operator'),
                    'message': 'Payment completed successfully!'
                })
            elif payment_status == 'FAILED':
                return Response({
                    'success': False,
                    'error': 'Payment failed. Please try again or use another payment method.',
                    'status': payment_status
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # PENDING status - return immediately for polling
                return Response({
                    'success': True,
                    'reference': result.get('reference'),
                    'status': payment_status,
                    'operator': result.get('operator'),
                    'message': 'Payment initiated. Please complete the USSD prompt on your phone.'
                })
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Payment initiation failed'),
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay payment exception: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment_with_collect(request):
    """
    Initiate a CamPay payment collection using initCollect (non-blocking)
    This method immediately returns a reference to check status later
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

    try:
        # Use the SDK to initiate collect (non-blocking - returns reference immediately)
        result = payment_service.init_collect(
            amount=amount,
            phone=phone,
            description=description,
            external_reference=external_reference
        )

        if result.get('success'):
            return Response({
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status', 'PENDING'),
                'operator': result.get('operator'),
                'ussd_code': result.get('ussd_code'),
                'message': 'Payment initiated. Please complete the USSD prompt on your phone.'
            })
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Payment initiation failed'),
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay initCollect exception: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request):
    """
    Check payment status using the transaction reference
    Query params: ?reference=xxx
    """
    reference = request.query_params.get('reference')

    if not reference:
        return Response(
            {'error': 'Reference is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Use the SDK to check transaction status
        result = payment_service.get_transaction_status(reference)

        if result.get('success'):
            return Response({
                'reference': result.get('reference'),
                'status': result.get('status'),
                'amount': result.get('amount'),
                'currency': result.get('currency'),
                'operator': result.get('operator'),
                'operator_reference': result.get('operator_reference'),
                'external_reference': result.get('external_reference')
            })
        else:
            return Response({
                'error': result.get('error', 'Failed to get payment status'),
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay status check exception: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    """
    Get application balance
    """
    try:
        result = payment_service.get_balance()

        if result.get('success'):
            return Response({
                'total_balance': result.get('total_balance'),
                'mtn_balance': result.get('mtn_balance'),
                'orange_balance': result.get('orange_balance'),
                'currency': result.get('currency')
            })
        else:
            return Response({
                'error': result.get('error', 'Failed to get balance'),
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay balance exception: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

