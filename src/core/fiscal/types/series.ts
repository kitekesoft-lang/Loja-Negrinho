export type FiscalDocumentTypeCode =
  | 'FT' // Factura
  | 'FR' // Factura/Recibo
  | 'RC' // Recibo
  | 'NC' // Nota de Crédito
  | 'ND' // Nota de Débito
  | 'FP' // Factura Pró-forma
  | 'GA'; // Factura Global / Adiantamento

export interface DocumentTypeDefinition {
  code: FiscalDocumentTypeCode;
  name: string;
  description: string;
  isFiscalDocument: boolean;
  requiresCustomer: boolean;
  allowsPaymentDirectly: boolean; // true for FR
  requiresOriginalReference: boolean; // true for NC, ND, RC
  affectsStock: boolean;
}

export const FISCAL_DOCUMENT_TYPES: Record<FiscalDocumentTypeCode, DocumentTypeDefinition> = {
  FT: {
    code: 'FT',
    name: 'Factura',
    description: 'Documento que titula a transmissão de bens ou prestação de serviços a crédito ou com quitação posterior.',
    isFiscalDocument: true,
    requiresCustomer: true,
    allowsPaymentDirectly: false,
    requiresOriginalReference: false,
    affectsStock: true,
  },
  FR: {
    code: 'FR',
    name: 'Factura/Recibo',
    description: 'Documento que titula a transmissão de bens ou prestação de serviços com quitação imediata.',
    isFiscalDocument: true,
    requiresCustomer: true,
    allowsPaymentDirectly: true,
    requiresOriginalReference: false,
    affectsStock: true,
  },
  RC: {
    code: 'RC',
    name: 'Recibo',
    description: 'Documento emitido para comprovar a quitação total ou parcial de uma factura prévia.',
    isFiscalDocument: true,
    requiresCustomer: true,
    allowsPaymentDirectly: true,
    requiresOriginalReference: true,
    affectsStock: false,
  },
  NC: {
    code: 'NC',
    name: 'Nota de Crédito',
    description: 'Documento de rectificação que anula ou reduz o valor a pagar de uma factura prévia.',
    isFiscalDocument: true,
    requiresCustomer: true,
    allowsPaymentDirectly: false,
    requiresOriginalReference: true,
    affectsStock: true,
  },
  ND: {
    code: 'ND',
    name: 'Nota de Débito',
    description: 'Documento de rectificação que adiciona montante a cobrar referente a uma factura prévia.',
    isFiscalDocument: true,
    requiresCustomer: true,
    allowsPaymentDirectly: false,
    requiresOriginalReference: true,
    affectsStock: false,
  },
  FP: {
    code: 'FP',
    name: 'Factura Pró-forma',
    description: 'Documento orçamental preliminar sem relevância fiscal imediata.',
    isFiscalDocument: false,
    requiresCustomer: true,
    allowsPaymentDirectly: false,
    requiresOriginalReference: false,
    affectsStock: false,
  },
  GA: {
    code: 'GA',
    name: 'Factura Global / Adiantamento',
    description: 'Documento emitido para titulação de adiantamentos monetários.',
    isFiscalDocument: true,
    requiresCustomer: true,
    allowsPaymentDirectly: true,
    requiresOriginalReference: false,
    affectsStock: false,
  },
};

export interface DocumentSeries {
  id: string;
  companyId: string;
  establishmentId: string;
  documentTypeCode: FiscalDocumentTypeCode;
  seriesCode: string; // e.g. 'A2026', 'LOJA1', 'B2026'
  fiscalYear: number; // e.g. 2026
  currentSequence: number; // starts at 0
  isActive: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}
