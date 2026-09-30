export interface Company {
  id: string;
  taxId: string; // NIF
  name: string;
  tradeName?: string;
  address: string;
  city: string;
  province: string;
  country: string; // 'AO'
  currency: string; // 'AOA'
  taxRegime: 'GERAL' | 'SIMPLIFICADO' | 'EXCLUSAO';
  conservatoryRegistration?: string;
  capitalSocial?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Establishment {
  id: string;
  companyId: string;
  code: string; // ex: 'SEDE', 'LJ01'
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}
