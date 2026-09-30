import { FiscalDocument, FiscalDocumentReference } from '../types/document';
import { Customer } from '../types/customer';
import { Product } from '../types/product';
import { TaxConfiguration } from '../types/tax';
import { DocumentSeries } from '../types/series';
import { User } from '../types/user';
import { Company } from '../types/company';
import { InvoiceEngine, CreateDocumentLineInput } from './InvoiceEngine';

export interface CreateCreditNoteInput {
  company: Company;
  establishmentId: string;
  series: DocumentSeries; // Séries do tipo 'NC'
  originalDocument: FiscalDocument;
  customer: Customer;
  reason: string;
  lines: CreateDocumentLineInput[];
  issuedByUser: User;
  notes?: string;
  previousDocumentHash?: string;
}

export class CreditNoteEngine {
  /**
   * Emite uma Nota de Crédito vinculada estritamente ao documento fiscal original
   */
  static issueCreditNote(
    input: CreateCreditNoteInput,
    catalog: {
      products: Map<string, Product>;
      taxConfigs: Map<string, TaxConfiguration>;
    }
  ): FiscalDocument {
    // 1. Validação de coerência do documento original
    if (!['FT', 'FR'].includes(input.originalDocument.documentTypeCode)) {
      throw new Error(
        `Apenas Facturas (FT) ou Facturas/Recibo (FR) podem ser objecto de Nota de Crédito. Documento fornecido: ${input.originalDocument.documentTypeCode}.`
      );
    }

    if (input.originalDocument.status !== 'ISSUED' && input.originalDocument.status !== 'RECTIFIED') {
      throw new Error(
        `O documento original ${input.originalDocument.documentNumber} não se encontra emitido com sucesso (Estado actual: ${input.originalDocument.status}).`
      );
    }

    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error('É obrigatório indicar o motivo legal/comercial para a emissão da Nota de Crédito.');
    }

    // 2. Validação do cliente
    if (input.originalDocument.customerTaxId !== input.customer.taxId) {
      throw new Error(
        `O NIF do cliente da Nota de Crédito (${input.customer.taxId}) deve coincidir estritamente com o documento original (${input.originalDocument.customerTaxId}).`
      );
    }

    // 3. Montar referência obrigatória
    const reference: FiscalDocumentReference = {
      id: `REF-NC-${Date.now().toString(36)}`,
      referencedDocumentId: input.originalDocument.id,
      referencedDocumentNumber: input.originalDocument.documentNumber,
      referenceType: 'CREDIT_NOTE_FOR',
      reason: input.reason.trim(),
      amount: input.originalDocument.netTotal,
    };

    // 4. Emitir através do motor fiscal
    const creditNote = InvoiceEngine.issueFiscalDocument(
      {
        company: input.company,
        establishmentId: input.establishmentId,
        series: input.series,
        documentTypeCode: 'NC',
        customer: input.customer,
        lines: input.lines,
        references: [reference],
        issuedByUser: input.issuedByUser,
        notes: `Rectificação da ${input.originalDocument.documentNumber}. Motivo: ${input.reason}. ${input.notes || ''}`,
        previousDocumentHash: input.previousDocumentHash,
      },
      catalog
    );

    // 5. Validar que o valor total da nota de crédito não excede o original
    if (creditNote.netTotal > input.originalDocument.netTotal) {
      throw new Error(
        `O valor total da Nota de Crédito (${creditNote.netTotal}) não pode exceder o valor total do documento original (${input.originalDocument.netTotal}).`
      );
    }

    return creditNote;
  }
}
