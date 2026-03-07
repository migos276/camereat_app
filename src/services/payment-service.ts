import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"

const api = axiosService.getInstance()

export interface PaymentStatusResponse {
  reference: string
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  amount?: string
  currency?: string
  operator?: string
  operator_reference?: string
  external_reference?: string
}

export interface BalanceResponse {
  total_balance: string
  mtn_balance: string
  orange_balance: string
  currency: string
}

export interface WithdrawPayload = {
  amount: number | string
  phone: string
  external_reference?: string
  description?: string
}

export interface PhoneValidationResponse {
  valid: boolean
  phone: string
  operator: string | null
  message: string
}

export const paymentService = {
  /**
   * Initiate a payment collection (blocking - waits for completion)
   */
  async initiatePayment(amount: number | string, phone: string, externalReference?: string, description?: string) {
    const response = await api.post(ENDPOINTS.PAYMENTS_INITIATE, {
      amount: String(amount),
      phone,
      external_reference: externalReference,
      description: description || 'Payment'
    })
    return response.data
  },

  /**
   * Initiate a payment collection (non-blocking - returns reference immediately)
   */
  async initiateCollect(amount: number | string, phone: string, externalReference?: string, description?: string) {
    const response = await api.post(ENDPOINTS.PAYMENTS_INITIATE_COLLECT, {
      amount: String(amount),
      phone,
      external_reference: externalReference,
      description: description || 'Payment'
    })
    return response.data
  },

  /**
   * Withdraw funds to a phone number
   */
  async withdraw(payload: WithdrawPayload) {
    const response = await api.post(ENDPOINTS.PAYMENTS_WITHDRAW, {
      amount: String(payload.amount),
      phone: payload.phone,
      external_reference: payload.external_reference,
      description: payload.description || 'Withdrawal'
    })
    return response.data
  },

  /**
   * Check payment status using reference
   */
  async checkStatus(reference: string): Promise<PaymentStatusResponse> {
    const response = await api.get<PaymentStatusResponse>(ENDPOINTS.PAYMENTS_STATUS, {
      params: { reference }
    })
    return response.data
  },

  /**
   * Get account balance
   */
  async getBalance(): Promise<BalanceResponse> {
    const response = await api.get<BalanceResponse>(ENDPOINTS.PAYMENTS_BALANCE)
    return response.data
  },

  /**
   * Validate phone number for mobile money
   */
  async validatePhone(phone: string): Promise<PhoneValidationResponse> {
    const response = await api.post<PhoneValidationResponse>(ENDPOINTS.PAYMENTS_VALIDATE_PHONE, {
      phone
    })
    return response.data
  }
}

