"""
CamPay Payment Service using the official campay SDK
Supports MTN and Orange Mobile Money payments
"""
from campay.sdk import Client as CamPayClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class PaymentService:
    """Payment service using CamPay SDK"""
    
    def __init__(self):
        """Initialize the CamPay client with credentials from settings"""
        self.client = CamPayClient({
            "app_username": getattr(settings, 'CAMPAY_APP_USERNAME', ''),
            "app_password": getattr(settings, 'CAMPAY_APP_PASSWORD', ''),
            "environment": getattr(settings, 'CAMPAY_ENVIRONMENT', 'DEV')  # Use "DEV" or "PROD"
        })
    
    def collect(self, amount, phone, description="Payment", external_reference=""):
        """
        OPTION 1: Collect payment - initiates and waits for transaction to complete
        
        Args:
            amount: Amount to collect (string or int)
            phone: Phone number with country code (e.g., 2376xxxxxxxx)
            description: Payment description
            external_reference: External reference from your system
            
        Returns:
            dict: Contains reference, status, operator, etc.
        """
        try:
            # Format phone number
            phone = self._format_phone(phone)
            
            result = self.client.collect({
                "amount": str(amount),
                "currency": "XAF",
                "from": phone,
                "description": description,
                "external_reference": external_reference
            })
            
            logger.info(f"CamPay collect result: {result}")
            return {
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status'),
                'operator': result.get('operator'),
                'amount': result.get('amount'),
                'currency': result.get('currency'),
                'operator_reference': result.get('operator_reference'),
                'code': result.get('code')
            }
        except Exception as e:
            logger.error(f"CamPay collect error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def init_collect(self, amount, phone, description="Payment", external_reference=""):
        """
        OPTION 2: Initiate collect - initiates transaction and immediately returns reference
        
        Use this to check status later with get_transaction_status
        
        Args:
            amount: Amount to collect
            phone: Phone number with country code
            description: Payment description
            external_reference: External reference from your system
            
        Returns:
            dict: Contains reference, ussd_code, operator, status (PENDING)
        """
        try:
            # Format phone number
            phone = self._format_phone(phone)
            
            result = self.client.initCollect({
                "amount": str(amount),
                "currency": "XAF",
                "from": phone,
                "description": description,
                "external_reference": external_reference
            })
            
            logger.info(f"CamPay initCollect result: {result}")
            return {
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status', 'PENDING'),
                'operator': result.get('operator'),
                'ussd_code': result.get('ussd_code')
            }
        except Exception as e:
            logger.error(f"CamPay initCollect error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_transaction_status(self, reference):
        """
        Check transaction status using the reference
        
        Args:
            reference: Transaction reference from initCollect or collect
            
        Returns:
            dict: Contains reference, status (PENDING/SUCCESSFUL/FAILED), operator, etc.
        """
        try:
            result = self.client.get_transaction_status({
                "reference": reference
            })
            
            logger.info(f"CamPay status check result: {result}")
            return {
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status'),
                'operator': result.get('operator'),
                'amount': result.get('amount'),
                'currency': result.get('currency'),
                'operator_reference': result.get('operator_reference'),
                'code': result.get('code'),
                'external_reference': result.get('external_reference')
            }
        except Exception as e:
            logger.error(f"CamPay status check error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_payment_link(self, amount, phone, description="", external_reference="",
                        first_name="", last_name="", email="", 
                        redirect_url="", failure_redirect_url="", payment_options="MOMO"):
        """
        Create a payment link for the customer
        
        Args:
            amount: Amount to collect
            phone: Phone number (optional)
            description: Payment description
            external_reference: External reference
            first_name: Customer first name
            last_name: Customer last name
            email: Customer email
            redirect_url: URL to redirect after successful payment
            failure_redirect_url: URL to redirect after failed payment
            payment_options: Payment options (MOMO, CARD, MOMO,CARD)
            
        Returns:
            dict: Contains status, link, reference
        """
        try:
            # Format phone if provided
            if phone:
                phone = self._format_phone(phone)
            
            result = self.client.get_payment_link({
                "amount": str(amount),
                "currency": "XAF",
                "description": description,
                "external_reference": external_reference,
                "from": phone,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "redirect_url": redirect_url,
                "failure_redirect_url": failure_redirect_url,
                "payment_options": payment_options
            })
            
            logger.info(f"CamPay payment link result: {result}")
            return {
                'success': True,
                'status': result.get('status'),
                'link': result.get('link'),
                'reference': result.get('reference')
            }
        except Exception as e:
            logger.error(f"CamPay payment link error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def disburse(self, amount, phone, description="Disbursement", external_reference=""):
        """
        Disburse funds to a phone number
        
        Args:
            amount: Amount to disburse
            phone: Phone number to receive funds
            description: Description
            external_reference: External reference
            
        Returns:
            dict: Contains reference, status, operator, etc.
        """
        try:
            phone = self._format_phone(phone)
            
            result = self.client.disburse({
                "amount": str(amount),
                "currency": "XAF",
                "to": phone,
                "description": description,
                "external_reference": external_reference
            })
            
            logger.info(f"CamPay disburse result: {result}")
            return {
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status'),
                'operator': result.get('operator'),
                'amount': result.get('amount'),
                'currency': result.get('currency'),
                'operator_reference': result.get('operator_reference'),
                'code': result.get('code')
            }
        except Exception as e:
            logger.error(f"CamPay disburse error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_balance(self):
        """
        Get application balance
        
        Returns:
            dict: Contains total_balance, mtn_balance, orange_balance, currency
        """
        try:
            result = self.client.get_balance()
            
            logger.info(f"CamPay balance result: {result}")
            return {
                'success': True,
                'total_balance': result.get('total_balance'),
                'mtn_balance': result.get('mtn_balance'),
                'orange_balance': result.get('orange_balance'),
                'currency': result.get('currency')
            }
        except Exception as e:
            logger.error(f"CamPay balance error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _format_phone(self, phone):
        """
        Format phone number to ensure it has country code
        
        Args:
            phone: Phone number string
            
        Returns:
            str: Formatted phone number with country code
        """
        if not phone:
            return phone
            
        # Remove spaces and dashes
        phone = phone.replace(' ', '').replace('-', '').replace('+237', '237')
        
        # Add country code if needed
        if phone.startswith('6') and len(phone) == 9:
            phone = '237' + phone
        elif not phone.startswith('237'):
            # Already has country code or invalid
            pass
            
        return phone


# Singleton instance
payment_service = PaymentService()

