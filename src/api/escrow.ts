import { apiFetch } from './client'

export interface EscrowTransaction {
  id: string
  listing_id: string
  amount: string
  buyer_fee: string
  total_due: string
  status: string
  transfer_code: string | null
  mpesa_checkout_request_id: string | null
  mpesa_receipt_number: string | null
  expires_at: string | null
  created_at: string
  message: string | null
}

export async function initiatePurchase(listingId: string): Promise<EscrowTransaction> {
  return apiFetch('/api/escrow/purchase', {
    method: 'POST',
    body: JSON.stringify({ listing_id: listingId }),
  })
}

export async function confirmEscrowPayment(transactionId: string): Promise<EscrowTransaction> {
  return apiFetch(`/api/escrow/${transactionId}/confirm-payment`, { method: 'POST' })
}

export async function verifyEscrowTransfer(
  transactionId: string,
  code: string,
): Promise<EscrowTransaction> {
  return apiFetch(`/api/escrow/${transactionId}/verify-transfer`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export async function fetchMyEscrowTransactions(): Promise<{ items: EscrowTransaction[] }> {
  return apiFetch('/api/escrow/mine')
}
