export interface Warehouse {
  id: string;
  companyId: string;
  establishmentId: string;
  code: string;
  name: string;
  location: string;
  isMain: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type StockMovementType = 'ENTRY_PURCHASE' | 'EXIT_SALE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RETURN_IN' | 'RETURN_OUT';

export interface StockItem {
  id: string;
  warehouseId: string;
  productId: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCostPrice: number; // Custo Médio Ponderado (CMP) em AOA
  totalValuation: number; // currentQuantity * averageCostPrice
  minimumStock: number;
  maximumStock: number;
  lastMovementDate: string;
}

export interface StockMovement {
  id: string;
  warehouseId: string;
  productId: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  documentReference?: string; // e.g. FT A2026/000001 or VFC A2026/000001
  notes: string;
  date: string;
  userId: string;
}

export type PurchaseOrderStatus = 'DRAFT' | 'APPROVED' | 'RECEIVED' | 'INVOICED' | 'CANCELLED';

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  orderNumber: string; // e.g. OC-2026/001
  supplierId: string;
  supplierName: string;
  supplierTaxId: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  lines: PurchaseOrderLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CommercialDocType = 'ORCAMENTO' | 'ENCOMENDA' | 'GUIA_TRANSPORTE' | 'GUIA_REMESSA';

export interface CommercialDocumentLine {
  id: string;
  productId: string;
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  total: number;
}

export interface CommercialDocument {
  id: string;
  companyId: string;
  type: CommercialDocType;
  documentNumber: string; // e.g. ORC-2026/001, GT-2026/001
  customerId: string;
  customerName: string;
  customerTaxId: string;
  date: string;
  validUntil?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_INVOICE' | 'IN_TRANSIT' | 'DELIVERED';
  lines: CommercialDocumentLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  vehiclePlate?: string; // Para guias de transporte
  driverName?: string;
  originAddress?: string;
  destinationAddress?: string;
  createdAt: string;
}

export type CashSessionStatus = 'OPEN' | 'CLOSED';

export interface CashSession {
  id: string;
  companyId: string;
  establishmentId: string;
  sessionNumber: string; // e.g. CX-2026-001
  openedByUserId: string;
  openedByUserName: string;
  openedAt: string;
  initialCashAmount: number; // Fundo de caixa
  closingCashAmountExpected?: number;
  closingCashAmountReal?: number;
  difference?: number;
  closedByUserId?: string;
  closedAt?: string;
  status: CashSessionStatus;
  totalCashSales: number;
  totalMulticaixaSales: number;
  totalTransferSales: number;
  totalOutflows: number; // Sangrias
  totalInflows: number; // Suprimentos
}

export interface CashMovement {
  id: string;
  sessionId: string;
  companyId: string;
  type: 'INFLOW_SALE' | 'INFLOW_SUPPLY' | 'OUTFLOW_BLEED' | 'OUTFLOW_EXPENSE';
  paymentMethod: 'CASH' | 'MULTICAIXA' | 'TRANSFER';
  amount: number;
  description: string;
  documentReference?: string;
  date: string;
  userId: string;
}

export interface BankAccount {
  id: string;
  companyId: string;
  bankName: string; // BAI, BFA, BIC, BMA, etc.
  accountNumber: string;
  iban: string;
  swift: string;
  currency: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GeneralLedgerAccount {
  code: string; // Código PGC Angolano ex: 11, 21, 31, 41, 61, 71
  name: string;
  class: number; // 1 a 8
  type: 'DEBIT' | 'CREDIT';
  balance: number;
  description: string;
}

export interface AccountingJournalEntry {
  id: string;
  companyId: string;
  entryNumber: string;
  date: string;
  documentReference: string; // Factura, Pagamento, Compra
  description: string;
  debitAccount: string; // Conta PGC Débito
  creditAccount: string; // Conta PGC Crédito
  amount: number;
  status: 'POSTED' | 'DRAFT';
  createdAt: string;
}
