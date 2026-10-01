import { FiscalDocumentTypeCode } from './series';
import { TaxType, TaxCode } from './tax';

export type DocumentStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PENDING_AGT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'RECTIFIED';

export interface FiscalDocumentLine {
  id: string;
  lineNumber: number;
  productId: string;
  productCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountRate: number; // in percentage e.g. 5 = 5%
  discountAmount: number;
  taxableBase: number;
  taxConfigurationId: string;
  taxType: TaxType;
  taxCode: TaxCode;
  taxRate: number;
  taxAmount: number;
  exemptionCode?: string;
  exemptionReason?: string;
  withholdingRate?: number;
  withholdingAmount?: number;
  totalLineAmount: number; // (taxableBase + taxAmount - withholdingAmount)
}

export interface FiscalDocumentReference {
  id: string;
  referencedDocumentId: string;
  referencedDocumentNumber: string; // e.g. 'FT A2026/000001'
  referenceType: 'CREDIT_NOTE_FOR' | 'DEBIT_NOTE_FOR' | 'RECEIPT_FOR' | 'RECTIFICATION_OF';
  reason: string;
  amount: number;
}

export interface FiscalDocument {
  id: string;
  companyId: string;
  establishmentId: string;
  seriesId: string;
  documentTypeCode: FiscalDocumentTypeCode;
  documentNumber: string; // e.g. 'FT A2026/000001'
  sequentialNumber: number;
  documentDate: string; // YYYY-MM-DD
  systemEntryDate: string; // ISO 8601
  customerId: string;
  customerTaxId: string;
  customerName: string;
  customerAddress: string;
  customerCountry: string;
  lines: FiscalDocumentLine[];
  references: FiscalDocumentReference[];
  
  // Totals
  grossAmount: number;
  discountAmount: number;
  taxableBase: number;
  taxAmount: number;
  withholdingAmount: number;
  netTotal: number;

  // Cryptographic & Fiscal Integrity
  hash: string;
  previousHash: string;
  hashControl: string; // 4 characters printed on document
  softwareCertificateNumber: string;
  signature?: import('./agt').AGTSignatureMetadata;
  canonicalString?: string;

  // State & Audit
  status: DocumentStatus;
  isLocked: boolean; // Immutable after issuance
  issuedByUserId: string;
  notes?: string;
  amountReceived?: number;
  changeAmount?: number;
  paymentMethodName?: string;
  createdAt: string;
  updatedAt: string;
}
