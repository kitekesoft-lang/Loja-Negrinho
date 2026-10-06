export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'RESERVED';

export type FloorZone = 'SALAO_PRINCIPAL' | 'ESPLANADA' | 'SALA_VIP' | 'BALCAO';

export interface RestaurantOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string; // ex: "Sem gelo", "Bem passado"
  status: 'PENDING' | 'SENT_TO_KITCHEN' | 'SERVED';
  addedAt: string;
}

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  zone: FloorZone;
  capacity: number;
  status: TableStatus;
  waiterName?: string;
  customerName?: string;
  customerNif?: string;
  items: RestaurantOrderItem[];
  openedAt?: string;
  subtotal: number;
}
