export type ItemType = 'PRODUCT' | 'SERVICE';

export interface ProductCategory {
  id: string;
  companyId: string;
  name: string;
  code: string;
}

export interface UnitOfMeasure {
  id: string;
  code: string; // UN, KG, L, HORAS, DIAS, M2, SERV
  description: string;
}

export interface Product {
  id: string;
  companyId: string;
  code: string; // SKU or internal code
  barcode?: string; // Código de barras EAN-13 para leitor de caixa
  description: string;
  type: ItemType;
  unit: string;
  categoryId?: string;
  standardPrice: number; // in AOA
  taxConfigurationId: string; // references TaxConfiguration
  withholdingTaxApplicable: boolean; // e.g. 6.5% for specific services
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}
