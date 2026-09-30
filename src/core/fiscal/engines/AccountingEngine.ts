import { GeneralLedgerAccount, AccountingJournalEntry } from '../types/erp';
import { FiscalDocument } from '../types/document';
import { Payment } from '../types/payment';

export const PGC_ANGOLANO_CHART: GeneralLedgerAccount[] = [
  // Classe 1: Meios Monetários
  { code: '11', name: 'Caixa', class: 1, type: 'DEBIT', balance: 0, description: 'Disponibilidades em notas e moedas' },
  { code: '12', name: 'Depósitos à Ordem', class: 1, type: 'DEBIT', balance: 0, description: 'Contas bancárias à ordem' },
  
  // Classe 2: Terceiros
  { code: '21', name: 'Fornecedores', class: 2, type: 'CREDIT', balance: 0, description: 'Dívidas a fornecedores de bens e serviços' },
  { code: '31', name: 'Clientes', class: 2, type: 'DEBIT', balance: 0, description: 'Contas correntes de clientes' },
  { code: '34', name: 'Estado e Outros Entes Públicos', class: 2, type: 'CREDIT', balance: 0, description: 'IVA a liquidar, retenções de II e impostos a pagar' },
  
  // Classe 3: Existências
  { code: '32', name: 'Mercadorias / Matérias', class: 3, type: 'DEBIT', balance: 0, description: 'Valor contabilístico das existências em armazém' },
  
  // Classe 6: Custos / Gastos
  { code: '61', name: 'Custo das Mercadorias Vendidas (CMVMC)', class: 6, type: 'DEBIT', balance: 0, description: 'Custo directo das vendas realizadas' },
  { code: '62', name: 'Fornecimentos e Serviços de Terceiros', class: 6, type: 'DEBIT', balance: 0, description: 'Subcontratos e despesas correntes' },
  
  // Classe 7: Proveitos / Rendimentos
  { code: '71', name: 'Vendas de Mercadorias', class: 7, type: 'CREDIT', balance: 0, description: 'Rendimento bruto das vendas comerciais' },
  { code: '72', name: 'Prestações de Serviços', class: 7, type: 'CREDIT', balance: 0, description: 'Rendimentos derivados de serviços prestados' },
];

export class AccountingEngine {
  /**
   * Lança partida dobrada automática a partir da emissão de Factura comercial
   */
  public static generateEntriesFromDocument(doc: FiscalDocument): AccountingJournalEntry[] {
    const entries: AccountingJournalEntry[] = [];
    const date = doc.documentDate;
    const ref = doc.documentNumber;

    if (doc.documentTypeCode === 'FT' || doc.documentTypeCode === 'FR') {
      // 1. Débito Clientes (Conta 31) ou Caixa (Conta 11) se FR
      const accountDebit = doc.documentTypeCode === 'FR' ? '11' : '31';
      entries.push({
        id: `LANC-${Date.now().toString(36)}-1`,
        companyId: doc.companyId,
        entryNumber: `L-${doc.documentNumber}-1`,
        date,
        documentReference: ref,
        description: `Registo de Venda - ${doc.customerName} (${ref})`,
        debitAccount: accountDebit,
        creditAccount: '71', // Vendas / Prestação Serviços
        amount: doc.taxableBase,
        status: 'POSTED',
        createdAt: new Date().toISOString(),
      });

      // 2. Registo do IVA Liquidado a pagar ao Estado (Conta 34.5)
      if (doc.taxAmount > 0) {
        entries.push({
          id: `LANC-${Date.now().toString(36)}-2`,
          companyId: doc.companyId,
          entryNumber: `L-${doc.documentNumber}-2`,
          date,
          documentReference: ref,
          description: `IVA Liquidado na Factura ${ref}`,
          debitAccount: accountDebit,
          creditAccount: '34', // Estado - IVA Liquidado
          amount: doc.taxAmount,
          status: 'POSTED',
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Registo da Retenção na Fonte de Imposto Industrial se houver
      if (doc.withholdingAmount > 0) {
        entries.push({
          id: `LANC-${Date.now().toString(36)}-3`,
          companyId: doc.companyId,
          entryNumber: `L-${doc.documentNumber}-3`,
          date,
          documentReference: ref,
          description: `Retenção na Fonte de II 6.5% - Factura ${ref}`,
          debitAccount: '34', // Estado - II Retido a recuperar
          creditAccount: accountDebit, // Abate na dívida do cliente
          amount: doc.withholdingAmount,
          status: 'POSTED',
          createdAt: new Date().toISOString(),
        });
      }
    } else if (doc.documentTypeCode === 'NC') {
      // Rectificação a débito de Vendas e crédito de Clientes
      entries.push({
        id: `LANC-${Date.now().toString(36)}-NC1`,
        companyId: doc.companyId,
        entryNumber: `L-${doc.documentNumber}-1`,
        date,
        documentReference: ref,
        description: `Nota de Crédito/Anulação Parcial de Venda (${ref})`,
        debitAccount: '71',
        creditAccount: '31',
        amount: doc.taxableBase,
        status: 'POSTED',
        createdAt: new Date().toISOString(),
      });

      if (doc.taxAmount > 0) {
        entries.push({
          id: `LANC-${Date.now().toString(36)}-NC2`,
          companyId: doc.companyId,
          entryNumber: `L-${doc.documentNumber}-2`,
          date,
          documentReference: ref,
          description: `Regularização de IVA a favor do sujeito passivo (${ref})`,
          debitAccount: '34',
          creditAccount: '31',
          amount: doc.taxAmount,
          status: 'POSTED',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return entries;
  }

  /**
   * Lança partida dobrada automática a partir da liquidação (Recibo / Pagamento)
   */
  public static generateEntriesFromPayment(payment: Payment): AccountingJournalEntry {
    const isCash = payment.paymentMethod === 'CASH';
    const isMulticaixa = payment.paymentMethod === 'MULTICAIXA';
    const destinationAccount = isCash ? '11' : isMulticaixa ? '12' : '12';

    return {
      id: `LANC-${Date.now().toString(36)}-PMT`,
      companyId: payment.companyId,
      entryNumber: `L-${payment.id}`,
      date: payment.paymentDate,
      documentReference: payment.documentNumber,
      description: `Liquidação de factura ${payment.documentNumber} via ${payment.paymentMethod}`,
      debitAccount: destinationAccount, // Entra no Caixa (11) ou Banco (12)
      creditAccount: '31', // Abate na conta de Clientes (31)
      amount: payment.amount,
      status: 'POSTED',
      createdAt: new Date().toISOString(),
    };
  }
}
