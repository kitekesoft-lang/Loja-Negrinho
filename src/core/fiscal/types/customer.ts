export type CustomerType =
  | 'EMPRESA_NACIONAL'
  | 'PARTICULAR'
  | 'ESTRANGEIRO'
  | 'CONSUMIDOR_FINAL';

export interface Customer {
  id: string;
  companyId: string;
  taxId: string; // NIF (ex: 5412345678 or 999999999 for Consumidor Final)
  name: string;
  customerType: CustomerType;
  country: string; // 'AO' or ISO code
  billingAddress: string;
  city: string;
  province?: string;
  postalCode?: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  taxId: string;
  name: string;
  country: string;
  address: string;
  city: string;
  province?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  productsSupplied?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}
