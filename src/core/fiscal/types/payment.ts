export type PaymentMethod =
  | 'CASH'
  | 'MULTICAIXA'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'OTHER';

export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  CASH: 'Numerário / Dinheiro',
  MULTICAIXA: 'Multicaixa / TPA',
  BANK_TRANSFER: 'Transferência Bancária',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  OTHER: 'Outro',
};

export interface Payment {
  id: string;
  companyId: string;
  documentId: string;
  documentNumber: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // ISO date
  transactionReference?: string; // e.g. comprovativo TPA, talão de transferência
  status: 'CONFIRMED' | 'VOIDED';
  notes?: string;
  recordedByUserId: string;
  createdAt: string;
}
