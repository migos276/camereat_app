"""
Campay Payment API Views
Handles payment collection, withdrawal, status checking, and webhooks
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import logging

from apps.payments.services import payment_service, PaymentService
from apps.orders.models import Commande
from django.views.decorators.csrf import csrf_exempt

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

    # Validate phone number
    is_valid, cleaned_phone, operator = PaymentService.validate_phone(phone)
    if not is_valid:
        return Response(
            {'error': 'Numéro de téléphone invalide. Utilisez un numéro MTN ou Orange Cameroun (ex: 6XXXXXXXX).'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate amount
    is_valid, error_msg = PaymentService.validate_amount(amount)
    if not is_valid:
        return Response(
            {'error': error_msg},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Use the SDK to collect payment (blocks until complete)
        result = payment_service.collect(
            amount=amount,
            phone=cleaned_phone,
            description=description,
            external_reference=external_reference,
            validate=False  # Already validated above
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

    # Validate phone number
    is_valid, cleaned_phone, operator = PaymentService.validate_phone(phone)
    if not is_valid:
        return Response(
            {'error': 'Numéro de téléphone invalide. Utilisez un numéro MTN ou Orange Cameroun (ex: 6XXXXXXXX).'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate amount
    is_valid, error_msg = PaymentService.validate_amount(amount)
    if not is_valid:
        return Response(
            {'error': error_msg},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Use the SDK to initiate collect (non-blocking - returns reference immediately)
        result = payment_service.init_collect(
            amount=amount,
            phone=cleaned_phone,
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
                'amount': result.get('amount'),
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw(request):
    """
    Withdraw funds to a phone number (disburse)
    Expected data: {
        "amount": "500",
        "phone": "2376xxxxxxxx",
        "external_reference": "REFUND-123",
        "description": "Refund for order"
    }
    """
    amount = request.data.get('amount')
    phone = request.data.get('phone')
    external_reference = request.data.get('external_reference', '')
    description = request.data.get('description', 'Withdrawal')

    if not amount or not phone:
        return Response(
            {'error': 'Amount and phone are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate phone number
    is_valid, cleaned_phone, operator = PaymentService.validate_phone(phone)
    if not is_valid:
        return Response(
            {'error': 'Numéro de téléphone invalide pour le retrait.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate amount
    is_valid, error_msg = PaymentService.validate_amount(amount, min_amount=100)
    if not is_valid:
        return Response(
            {'error': error_msg},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Check balance first
        balance_result = payment_service.get_balance()
        if balance_result.get('success'):
            total_balance = float(balance_result.get('total_balance', 0))
            if total_balance < float(amount):
                return Response(
                    {'error': 'Solde insuffisant pour effectuer ce retrait.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Process withdrawal
        result = payment_service.withdraw(
            amount=amount,
            phone=cleaned_phone,
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
                    'message': 'Withdrawal completed successfully!'
                })
            elif payment_status == 'FAILED':
                return Response({
                    'success': False,
                    'error': result.get('error', 'Withdrawal failed.'),
                    'status': payment_status
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # PENDING status
                return Response({
                    'success': True,
                    'reference': result.get('reference'),
                    'status': payment_status,
                    'operator': result.get('operator'),
                    'message': 'Withdrawal initiated. Processing...'
                })
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Withdrawal failed'),
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"CamPay withdraw exception: {str(e)}")
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


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def webhook(request):
    """
    Webhook endpoint to receive real-time payment notifications from Campay
    This endpoint is called by Campay when payment status changes
    
    Expected data from Campay:
    {
        "reference": "CMP-xxx",
        "status": "SUCCESSFUL|FAILED|PENDING",
        "operator": "MTN|ORANGE",
        "amount": "100",
        "operator_reference": "OP-ref"
    }
    """
    try:
        # Get payment data from webhook
        reference = request.data.get('reference')
        payment_status = request.data.get('status')
        operator = request.data.get('operator')
        amount = request.data.get('amount')
        operator_reference = request.data.get('operator_reference')
        
        logger.info(f"Campay webhook received: reference={reference}, status={payment_status}")
        
        if not reference:
            return Response(
                {'error': 'Reference is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to find the order by campay_reference
        try:
            commande = Commande.objects.get(campay_reference=reference)
            
            # Update payment status
            if payment_status == 'SUCCESSFUL':
                commande.payment_status = 'PAYE'
                logger.info(f"Order {commande.numero} payment marked as PAYE via webhook")
            elif payment_status == 'FAILED':
                logger.warning(f"Order {commande.numero} payment FAILED via webhook")
            
            # Update operator if not set
            if operator and not commande.operator:
                commande.operator = operator
            
            commande.save()
            
            return Response({'status': 'ok'})
            
        except Commande.DoesNotExist:
            logger.warning(f"Order not found for campay_reference: {reference}")
            # Return ok anyway to acknowledge receipt
            return Response({'status': 'order_not_found'})
            
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_phone(request):
    """
    Validate a phone number for mobile money payment
    Expected data: {
        "phone": "2376xxxxxxxx"
    }
    Returns: {
        "valid": true/false,
        "phone": "2376xxxxxxxx",
        "operator": "MTN"|"ORANGE"|null,
        "message": "..."
    }
    """
    phone = request.data.get('phone')
    
    if not phone:
        return Response(
            {'error': 'Phone number is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    is_valid, cleaned_phone, operator = PaymentService.validate_phone(phone)
    
    return Response({
        'valid': is_valid,
        'phone': cleaned_phone,
        'operator': operator,
        'message': 'Numéro valide' if is_valid else 'Numéro invalide pour Mobile Money Cameroun'
    })

