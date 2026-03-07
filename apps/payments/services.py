"""
CamPay Payment Service using the official campay SDK
Supports MTN and Orange Mobile Money payments (Cameroon)

IMPORTANT: This module handles REAL MONEY transactions.
Ensure CAMPAY_ENVIRONMENT is set to 'PROD' for production use.
"""
from campay.sdk import Client as CamPayClient
from django.conf import settings
import logging
import re

logger = logging.getLogger(__name__)

# Cameroon phone prefixes
MTN_PREFIXES = ['650', '651', '652', '653', '654', '670', '671', '672', '673', '674', '675', '676', '677', '678', '679']
ORANGE_PREFIXES = ['655', '656', '657', '658', '659', '690', '691', '692', '693', '694', '695', '696', '697', '698', '699','680', '681', '682', '683', '684', '685', '686', '687', '688', '689']

# Minimum transaction amounts (XAF)
MIN_COLLECT_AMOUNT = 100
MIN_WITHDRAW_AMOUNT = 100


class PaymentServiceError(Exception):
    """Custom exception for payment service errors"""
    pass


class InvalidPhoneNumberError(PaymentServiceError):
    """Invalid phone number format"""
    pass


class InvalidAmountError(PaymentServiceError):
    """Invalid amount (below minimum or invalid format)"""
    pass


class PaymentService:
    """Payment service using CamPay SDK"""
    
    def __init__(self):
        """Initialize the CamPay client with credentials from settings"""
        app_username = getattr(settings, 'CAMPAY_APP_USERNAME', '')
        app_password = getattr(settings, 'CAMPAY_APP_PASSWORD', '')
        environment = getattr(settings, 'CAMPAY_ENVIRONMENT', 'PROD')
        
        # Log environment status (without credentials)
        if environment == 'PROD':
            logger.info("CamPay: Running in PRODUCTION mode - REAL MONEY transactions")
        else:
            logger.warning("CamPay: Running in DEV/SANDBOX mode - TEST transactions only")
        
        # Check if credentials are properly configured
        if not app_username or not app_password:
            logger.error("CamPay: Missing credentials! Please set CAMPAY_APP_USERNAME and CAMPAY_APP_PASSWORD")
            raise PaymentServiceError("CamPay credentials not configured. Please set environment variables.")
        
        self.client = CamPayClient({
            "app_username": app_username,
            "app_password": app_password,
            "environment": environment  # Use "DEV" or "PROD"
        })
        
        self.min_collect_amount = getattr(settings, 'CAMPAY_MIN_COLLECT_AMOUNT', MIN_COLLECT_AMOUNT)
        self.min_withdraw_amount = getattr(settings, 'CAMPAY_MIN_WITHDRAW_AMOUNT', MIN_WITHDRAW_AMOUNT)
    
    @staticmethod
    def get_operator(phone: str) -> str:
        """
        Detect operator from phone number prefix
        
        Args:
            phone: Phone number with country code (e.g., 2376xxxxxxxx)
            
        Returns:
            str: 'MTN', 'ORANGE', or None if unknown
        """
        phone = phone.replace(' ', '').replace('-', '').replace('+237', '237')
        
        # Get the 3-digit prefix after 237
        if phone.startswith('237') and len(phone) >= 6:
            prefix = phone[3:6]
            
            if prefix in MTN_PREFIXES:
                return 'MTN'
            elif prefix in ORANGE_PREFIXES:
                return 'ORANGE'
        
        return None
    
    @staticmethod
    def validate_phone(phone: str) -> tuple[bool, str, str]:
        """
        Validate Cameroon phone number
        
        Args:
            phone: Phone number string
            
        Returns:
            tuple: (is_valid, cleaned_phone, operator)
        """
        # Remove spaces, dashes, and +237 prefix
        phone = phone.replace(' ', '').replace('-', '').replace('+237', '237')
        
        # Add country code if needed
        if phone.startswith('6') and len(phone) == 9:
            phone = '237' + phone
        
        # Validate format - Accept all valid Cameroon mobile prefixes:
        # MTN: 650-679 (prefixes 65x, 66x, 67x, 68x with 0, and 670-679)
        # Orange: 680-699 (prefixes 68x, 69x)
        # Also accept old format 6XXXXXXXX (9 digits after 237)
        if not re.match(r'^237([6][5-9]\d|[7][0-9]\d|[6][7][0-9]|69\d)\d{6}$', phone):
            # Fallback: accept simple format 2376XXXXXXXX or 2377XXXXXXXX
            if not re.match(r'^237[6-9]\d{7}$', phone):
                return False, phone, None
        
        # Detect operator
        operator = PaymentService.get_operator(phone)
        
        return True, phone, operator
    
    @staticmethod
    def validate_amount(amount, min_amount: int = MIN_COLLECT_AMOUNT) -> tuple[bool, str]:
        """
        Validate transaction amount
        
        Args:
            amount: Amount to validate (string, int, or float)
            min_amount: Minimum allowed amount in XAF
            
        Returns:
            tuple: (is_valid, error_message)
        """
        try:
            # Convert to integer
            amount_int = int(float(amount))
            
            if amount_int < min_amount:
                return False, f"Le montant minimum est de {min_amount} XAF"
            
            if amount_int > 1000000:  # 1 million XAF max
                return False, "Le montant maximum est de 1,000,000 XAF"
            
            return True, ""
        except (ValueError, TypeError):
            return False, "Montant invalide"
    
    def _format_phone(self, phone: str) -> str:
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
            
        return phone
    
    def collect(self, amount, phone: str, description: str = "Payment", external_reference: str = "",
                validate: bool = True):
        """
        Collect payment - initiates and waits for transaction to complete
        
        Args:
            amount: Amount to collect (string or int)
            phone: Phone number with country code (e.g., 2376xxxxxxxx)
            description: Payment description
            external_reference: External reference from your system
            validate: Whether to validate phone and amount
            
        Returns:
            dict: Contains success, reference, status, operator, etc.
        """
        try:
            # Validate phone
            if validate:
                is_valid, phone, operator = self.validate_phone(phone)
                if not is_valid:
                    logger.error(f"Invalid phone number: {phone}")
                    return {
                        'success': False,
                        'error': 'Numéro de téléphone invalide. Utilisez un numéro MTN ou Orange Cameroun.'
                    }
                
                # Validate amount
                is_valid, error_msg = self.validate_amount(amount, self.min_collect_amount)
                if not is_valid:
                    logger.error(f"Invalid amount: {amount} - {error_msg}")
                    return {
                        'success': False,
                        'error': error_msg
                    }
            else:
                phone = self._format_phone(phone)
                operator = self.get_operator(phone)
            
            result = self.client.collect({
                "amount": str(int(float(amount))),
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
                'operator': result.get('operator') or operator,
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
    
    def init_collect(self, amount, phone: str, description: str = "Payment", external_reference: str = ""):
        """
        Initiate collect - initiates transaction and immediately returns reference
        
        Use this to check status later with get_transaction_status
        
        Args:
            amount: Amount to collect
            phone: Phone number with country code
            description: Payment description
            external_reference: External reference from your system
            
        Returns:
            dict: Contains success, reference, ussd_code, operator, status (PENDING)
        """
        try:
            # Validate phone
            is_valid, phone, operator = self.validate_phone(phone)
            if not is_valid:
                logger.error(f"Invalid phone number: {phone}")
                return {
                    'success': False,
                    'error': 'Numéro de téléphone invalide. Utilisez un numéro MTN ou Orange Cameroun.'
                }
            
            # Validate amount
            is_valid, error_msg = self.validate_amount(amount, self.min_collect_amount)
            if not is_valid:
                logger.error(f"Invalid amount: {amount} - {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }
            
            result = self.client.initCollect({
                "amount": str(int(float(amount))),
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
                'operator': result.get('operator') or operator,
                'ussd_code': result.get('ussd_code'),
                'amount': str(int(float(amount)))
            }
        except Exception as e:
            logger.error(f"CamPay initCollect error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_transaction_status(self, reference: str):
        """
        Check transaction status using the reference
        
        Args:
            reference: Transaction reference from initCollect or collect
            
        Returns:
            dict: Contains success, reference, status (PENDING/SUCCESSFUL/FAILED), operator, etc.
        """
        try:
            result = self.client.get_transaction_status({
                "reference": reference
            })
            
            logger.info(f"CamPay status check result for {reference}: {result}")
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
    
    def get_payment_link(self, amount, phone: str = "", description: str = "", external_reference: str = "",
                        first_name: str = "", last_name: str = "", email: str = "", 
                        redirect_url: str = "", failure_redirect_url: str = "", 
                        payment_options: str = "MOMO"):
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
            dict: Contains success, status, link, reference
        """
        try:
            # Validate amount
            is_valid, error_msg = self.validate_amount(amount, self.min_collect_amount)
            if not is_valid:
                logger.error(f"Invalid amount: {amount} - {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }
            
            # Format phone if provided
            if phone:
                phone = self._format_phone(phone)
                # Validate phone
                is_valid, phone, _ = self.validate_phone(phone)
                if not is_valid:
                    return {
                        'success': False,
                        'error': 'Numéro de téléphone invalide'
                    }
            
            result = self.client.get_payment_link({
                "amount": str(int(float(amount))),
                "currency": "XAF",
                "description": description,
                "external_reference": external_reference,
                "from": phone if phone else None,
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
    
    def withdraw(self, amount, phone: str, description: str = "Disbursement", external_reference: str = ""):
        """
        Withdraw funds to a phone number (disburse)
        
        Args:
            amount: Amount to withdraw
            phone: Phone number to receive funds
            description: Description
            external_reference: External reference
            
        Returns:
            dict: Contains success, reference, status, operator, etc.
        """
        try:
            # Validate phone
            is_valid, phone, operator = self.validate_phone(phone)
            if not is_valid:
                logger.error(f"Invalid phone number for withdraw: {phone}")
                return {
                    'success': False,
                    'error': 'Numéro de téléphone invalide pour le retrait.'
                }
            
            # Validate amount
            is_valid, error_msg = self.validate_amount(amount, self.min_withdraw_amount)
            if not is_valid:
                logger.error(f"Invalid withdraw amount: {amount} - {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }
            
            result = self.client.disburse({
                "amount": str(int(float(amount))),
                "currency": "XAF",
                "to": phone,
                "description": description,
                "external_reference": external_reference
            })
            
            logger.info(f"CamPay withdraw result: {result}")
            return {
                'success': True,
                'reference': result.get('reference'),
                'status': result.get('status'),
                'operator': result.get('operator') or operator,
                'amount': result.get('amount'),
                'currency': result.get('currency'),
                'operator_reference': result.get('operator_reference'),
                'code': result.get('code')
            }
        except Exception as e:
            logger.error(f"CamPay withdraw error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def disburse(self, amount, phone: str, description: str = "Disbursement", external_reference: str = ""):
        """
        Alias for withdraw - for backward compatibility
        """
        return self.withdraw(amount, phone, description, external_reference)
    
    def get_balance(self):
        """
        Get application balance
        
        Returns:
            dict: Contains success, total_balance, mtn_balance, orange_balance, currency
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


# Singleton instance
payment_service = PaymentService()

