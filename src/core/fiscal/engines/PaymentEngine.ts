import { Payment, PaymentMethod } from '../types/payment';
import { FiscalDocument } from '../types/document';
import { User } from '../types/user';
import { RbacService } from '../security/RbacService';
import { AuditService } from '../security/AuditService';

export interface RegisterPaymentInput {
  companyId: string;
  document: FiscalDocument;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  transactionReference?: string;
  notes?: string;
  user: User;
}

export class PaymentEngine {
  /**
   * Regista um pagamento com validação de limites e trilha de auditoria
   */
  static registerPayment(
    input: RegisterPaymentInput,
    existingPaymentsForDocument: Payment[]
  ): Payment {
    // 1. Validação de Permissão (RBAC)
    const authCheck = RbacService.checkPermission(input.user, 'PAYMENT_REGISTER');
    if (!authCheck.isAuthorized) {
      AuditService.logEvent({
        companyId: input.companyId,
        user: input.user,
        entityType: 'PAYMENT',
        entityId: 'NEW',
        operation: 'PERMISSION_DENIED',
        description: `Tentativa de registo de pagamento sem permissão: ${authCheck.reason}`,
      });
      throw new Error(authCheck.reason);
    }

    // 2. Validação de Valor
    if (input.amount <= 0) {
      throw new Error('O montante do pagamento deve ser superior a zero.');
    }

    const totalPaidSoFar = existingPaymentsForDocument
      .filter((p) => p.status === 'CONFIRMED')
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = Math.round((input.document.netTotal - totalPaidSoFar) * 100) / 100;

    if (input.amount > remainingBalance + 0.01) {
      throw new Error(
        `O montante do pagamento (${input.amount.toFixed(2)}) excede o saldo pendente do documento (${remainingBalance.toFixed(2)}).`
      );
    }

    const payment: Payment = {
      id: `PAY-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      companyId: input.companyId,
      documentId: input.document.id,
      documentNumber: input.document.documentNumber,
      customerId: input.document.customerId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentDate: input.paymentDate || new Date().toISOString(),
      transactionReference: input.transactionReference,
      status: 'CONFIRMED',
      notes: input.notes,
      recordedByUserId: input.user.id,
      createdAt: new Date().toISOString(),
    };

    // 3. Auditoria
    AuditService.logEvent({
      companyId: input.companyId,
      user: input.user,
      entityType: 'PAYMENT',
      entityId: payment.id,
      operation: 'PAY',
      description: `Pagamento de ${payment.amount.toFixed(2)} AOA registado para o documento ${payment.documentNumber} via ${payment.paymentMethod}`,
      newState: payment,
    });

    return payment;
  }
}
