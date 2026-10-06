export type ServiceOrderStatus =
  | 'DRAFT'
  | 'DIAGNOSIS'
  | 'AWAITING_APPROVAL'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED_INVOICED'
  | 'CANCELLED';

export interface ServiceOrderEquipment {
  type: string; // Ex: Computador portátil, Viatura, Impressora fiscal, Smartphone
  brand: string; // Ex: HP, Toyota, Epson, Samsung
  model: string; // Ex: ProBook 450 G8, Hilux 2.8, L3150
  serialNumber?: string;
  accessories?: string; // Ex: Carregador original, Bolsa, Chave
  reportedFault: string; // Relato do cliente
  technicalDiagnosis?: string; // Diagnóstico do técnico
}

export interface ServiceOrderItem {
  id: string;
  type: 'PART' | 'LABOR'; // Peça ou Mão-de-Obra
  productId?: string; // Se for peça do stock
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number; // Ex: 14% ou 0%
}

export interface ServiceOrder {
  id: string;
  orderNumber: string; // Ex: OS-2026/001
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerNif?: string;
  equipment: ServiceOrderEquipment;
  status: ServiceOrderStatus;
  assignedTechnician?: string;
  items: ServiceOrderItem[];
  laborSubtotal: number;
  partsSubtotal: number;
  totalAmount: number;
  estimatedDeliveryDate?: string;
  warrantyPeriodDays?: number;
  invoicedDocumentNumber?: string; // Ex: FT LOJA01/2026/12 ou FR LOJA01/2026/45
  createdAt: string;
  updatedAt: string;
}
