export type TaxType = 'IVA' | 'IS' | 'RET_FONTE';
export type TaxCode = 'NOR' | 'RED' | 'ISE' | 'OUT';

export interface TaxConfiguration {
  id: string;
  code: string; // e.g. 'IVA_14', 'IVA_07', 'IVA_05', 'IVA_00_M00', 'RET_65'
  name: string;
  taxType: TaxType;
  taxCode: TaxCode;
  ratePercentage: number; // e.g. 14.00, 7.00, 5.00, 0.00, 6.50
  exemptionCode?: string; // e.g. 'M00', 'M02', 'M04', etc.
  exemptionReason?: string;
  legalBasis: string;
  isActive: boolean;
}

export interface TaxCalculationResult {
  taxableBase: number;
  taxRate: number;
  taxAmount: number;
  taxType: TaxType;
  taxCode: TaxCode;
  exemptionCode?: string;
  exemptionReason?: string;
  withholdingRate?: number;
  withholdingAmount?: number;
}
