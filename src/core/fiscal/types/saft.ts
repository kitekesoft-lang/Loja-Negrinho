export type SAFTVersion = '0.1.01' | '1.01_01';

export type SAFTDocumentType =
  | 'FT' // Factura
  | 'FR' // Factura-Recibo
  | 'ND' // Nota de Débito
  | 'NC' // Nota de Crédito
  | 'RC'; // Recibo

export interface SAFTHeader {
  auditFileVersion: string; // '0.1.01'
  companyID: string; // NIF
  taxRegistrationNumber: string; // NIF
  taxAccountingBasis: string; // 'F' (Facturação)
  companyName: string;
  businessName?: string;
  companyAddress: {
    addressDetail: string;
    city: string;
    province: string;
    postalCode: string;
    country: string; // 'AO'
  };
  fiscalYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  currencyCode: string; // 'AOA'
  dateCreated: string; // YYYY-MM-DD
  taxEntity: string; // 'Global'
  productCompanyTaxID: string;
  softwareValidationNumber: string;
  productID: string;
  productVersion: string;
  headerComment?: string;
  telephone?: string;
  fax?: string;
  email?: string;
  website?: string;
}

export interface SAFTMasterFiles {
  customers: SAFTCustomer[];
  products: SAFTProduct[];
  taxTable: SAFTTaxEntry[];
}

export interface SAFTCustomer {
  customerID: string;
  accountID: string; // Plano de contas e.g. '31.1.2.1'
  customerTaxID: string;
  companyName: string;
  billingAddress: {
    addressDetail: string;
    city: string;
    postalCode: string;
    country: string;
  };
  selfBillingIndicator: number; // 0 ou 1
}

export interface SAFTProduct {
  productType: 'P' | 'S'; // P = Produto, S = Serviço
  productCode: string;
  productGroup: string;
  productDescription: string;
  productNumberCode: string;
}

export interface SAFTTaxEntry {
  taxType: string; // 'IVA'
  taxCountryRegion: string; // 'AO'
  taxCode: string; // 'NOR', 'RED', 'INT', 'ISE'
  description: string;
  taxPercentage?: number;
  taxAmount?: number;
}

export interface SAFTSalesInvoices {
  numberOfEntries: number;
  totalPartnerDiscount?: number;
  totalDebit: number;
  totalCredit: number;
  invoice: SAFTInvoice[];
}

export interface SAFTInvoice {
  invoiceNo: string; // e.g. 'FT A2026/1'
  atcud?: string;
  documentStatus: {
    invoiceStatus: 'N' | 'A' | 'R' | 'F'; // N = Normal, A = Anulado, R = Recuperação/Auto, F = Facturado
    invoiceStatusDate: string; // ISO 8601
    sourceID: string;
    sourceBilling: 'P'; // P = Produzido pela aplicação
  };
  hash: string;
  hashControl: string;
  period: number; // 1-12
  invoiceDate: string; // YYYY-MM-DD
  invoiceType: SAFTDocumentType;
  specialRegimes: {
    selfBillingIndicator: number;
    cashVATSchemeIndicator: number;
    thirdPartiesBillingIndicator: number;
  };
  sourceID: string;
  systemEntryDate: string; // ISO 8601
  customerID: string;
  lines: SAFTInvoiceLine[];
  documentTotals: {
    taxPayable: number;
    netTotal: number;
    grossTotal: number;
    currency?: {
      currencyCode: string;
      currencyAmount: number;
      exchangeRate: number;
    };
    settlement?: {
      settlementDiscount?: number;
      settlementAmount?: number;
      settlementDate?: string;
    };
  };
  withholdingTax?: {
    withholdingTaxType: string;
    withholdingTaxDescription: string;
    withholdingTaxAmount: number;
  };
}

export interface SAFTInvoiceLine {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  taxPointDate: string;
  description: string;
  debitAmount?: number;
  creditAmount?: number;
  tax: {
    taxType: string;
    taxCountryRegion: string;
    taxCode: string;
    taxPercentage?: number;
  };
  taxExemptionReason?: string;
  taxExemptionCode?: string;
  settlementAmount?: number;
}

export interface SAFTPayments {
  numberOfEntries: number;
  totalDebit: number;
  totalCredit: number;
  payment: SAFTPaymentItem[];
}

export interface SAFTPaymentItem {
  paymentRefNo: string;
  period: number;
  transactionDate: string;
  paymentType: 'RG' | 'RC'; // RG = Recibo Global, RC = Recibo
  description: string;
  systemID?: string;
  documentStatus: {
    paymentStatus: 'N' | 'A';
    paymentStatusDate: string;
    sourceID: string;
    sourcePayment: 'P';
  };
  paymentMethod: {
    paymentMechanism: 'CC' | 'CD' | 'CH' | 'CS' | 'DE' | 'LC' | 'MB' | 'NU' | 'OU' | 'PR' | 'TB';
    paymentAmount: number;
    paymentDate: string;
  };
  sourceID: string;
  systemEntryDate: string;
  customerID: string;
  line: Array<{
    lineNumber: number;
    sourceDocumentID: {
      originatingON: string;
      invoiceDate: string;
      description: string;
    };
    creditAmount: number;
  }>;
  documentTotals: {
    taxPayable: number;
    netTotal: number;
    grossTotal: number;
  };
}

export interface SAFTAuditFile {
  header: SAFTHeader;
  masterFiles: SAFTMasterFiles;
  sourceDocuments: {
    salesInvoices?: SAFTSalesInvoices;
    payments?: SAFTPayments;
  };
}

export interface SAFTValidationIssue {
  severity: 'ERROR' | 'WARNING';
  code: string;
  section: 'HEADER' | 'CUSTOMERS' | 'PRODUCTS' | 'TAX_TABLE' | 'SALES_INVOICES' | 'PAYMENTS' | 'STRUCTURE';
  field?: string;
  message: string;
  technicalDetails?: string;
  documentReference?: string;
}

export interface SAFTValidationResult {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  issues: SAFTValidationIssue[];
  metrics: {
    customerCount: number;
    productCount: number;
    invoiceCount: number;
    paymentCount: number;
    totalSalesDebit: number;
    totalSalesCredit: number;
    totalTaxPayable: number;
    totalGrossSales: number;
  };
}
