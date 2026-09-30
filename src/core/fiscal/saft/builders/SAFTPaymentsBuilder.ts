import { Payment, PaymentMethod } from '../../types/payment';
import { FiscalDocument } from '../../types/document';
import { SAFTPayments, SAFTPaymentItem } from '../../types/saft';

export class SAFTPaymentsBuilder {
  public static build(
    payments: Payment[],
    documentsMap: Map<string, FiscalDocument>
  ): SAFTPayments {
    let totalCredit = 0;

    const paymentItems: SAFTPaymentItem[] = payments.map((p) => {
      const isVoided = p.status === 'VOIDED';
      const doc = documentsMap.get(p.documentId);

      // Conversão do meio de pagamento para código SAF-T oficial
      const mechanismMap: Record<PaymentMethod, 'CC' | 'CD' | 'CH' | 'CS' | 'DE' | 'LC' | 'MB' | 'NU' | 'OU' | 'PR' | 'TB'> = {
        CASH: 'NU', // Numerário
        MULTICAIXA: 'MB', // Multicaixa / TPA
        BANK_TRANSFER: 'TB', // Transferência Bancária
        CREDIT_CARD: 'CC', // Cartão de Crédito
        DEBIT_CARD: 'CD', // Cartão de Débito
        OTHER: 'OU',
      };

      const paymentMechanism = mechanismMap[p.paymentMethod] || 'OU';

      if (!isVoided) {
        totalCredit += p.amount;
      }

      const payDate = new Date(p.paymentDate);
      const period = payDate.getMonth() + 1;

      return {
        paymentRefNo: `RC ${p.documentNumber || p.id}`,
        period,
        transactionDate: p.paymentDate.split('T')[0],
        paymentType: 'RC',
        description: p.notes || `Recebimento Ref: ${p.transactionReference || p.id}`,
        documentStatus: {
          paymentStatus: isVoided ? 'A' : 'N',
          paymentStatusDate: p.createdAt,
          sourceID: p.recordedByUserId,
          sourcePayment: 'P',
        },
        paymentMethod: {
          paymentMechanism,
          paymentAmount: p.amount,
          paymentDate: p.paymentDate.split('T')[0],
        },
        sourceID: p.recordedByUserId,
        systemEntryDate: p.createdAt,
        customerID: p.customerId,
        line: [
          {
            lineNumber: 1,
            sourceDocumentID: {
              originatingON: doc?.documentNumber || p.documentNumber,
              invoiceDate: doc?.documentDate || p.paymentDate.split('T')[0],
              description: `Liquidado via ${p.paymentMethod}`,
            },
            creditAmount: p.amount,
          },
        ],
        documentTotals: {
          taxPayable: 0,
          netTotal: p.amount,
          grossTotal: p.amount,
        },
      };
    });

    return {
      numberOfEntries: paymentItems.length,
      totalDebit: 0,
      totalCredit: Number(totalCredit.toFixed(2)),
      payment: paymentItems,
    };
  }
}
