import { TaxConfiguration, TaxCalculationResult } from '../types/tax';

export interface TaxEngineCalculationInput {
  unitPrice: number;
  quantity: number;
  discountPercentage?: number; // e.g. 10 for 10%
  taxConfig: TaxConfiguration;
  applyWithholdingTax?: boolean;
  withholdingPercentage?: number; // default 6.5%
}

export interface CalculatedLineOutput {
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountPercentage: number;
  discountAmount: number;
  taxableBase: number;
  taxRate: number;
  taxAmount: number;
  taxType: string;
  taxCode: string;
  exemptionCode?: string;
  exemptionReason?: string;
  withholdingRate?: number;
  withholdingAmount?: number;
  totalLineAmount: number;
}

export class TaxEngine {
  /**
   * Arredonda valores monetários para 2 casas decimais segundo a norma contabilística (Half Up)
   */
  static roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Realiza o cálculo fiscal completo de uma linha de documento
   */
  static calculateLine(input: TaxEngineCalculationInput): CalculatedLineOutput {
    const qty = Math.max(0, input.quantity);
    const price = Math.max(0, input.unitPrice);
    const grossAmount = this.roundCurrency(qty * price);

    // Desconto comercial
    const discPct = Math.min(100, Math.max(0, input.discountPercentage || 0));
    const discountAmount = this.roundCurrency(grossAmount * (discPct / 100));

    // Base de incidência (Incidência = Bruto - Desconto)
    const taxableBase = this.roundCurrency(grossAmount - discountAmount);

    // Imposto (IVA ou similar)
    const taxRate = input.taxConfig.ratePercentage;
    let taxAmount = 0;
    if (taxRate > 0) {
      taxAmount = this.roundCurrency(taxableBase * (taxRate / 100));
    }

    // Retenção na Fonte (se aplicável, tipicamente 6.5% sobre a base tributável dos serviços)
    let withholdingRate = 0;
    let withholdingAmount = 0;
    if (input.applyWithholdingTax) {
      withholdingRate = input.withholdingPercentage ?? 6.5;
      withholdingAmount = this.roundCurrency(taxableBase * (withholdingRate / 100));
    }

    // Total Líquido da linha = Base Tributável + IVA - Retenção
    const totalLineAmount = this.roundCurrency(taxableBase + taxAmount - withholdingAmount);

    return {
      quantity: qty,
      unitPrice: price,
      grossAmount,
      discountPercentage: discPct,
      discountAmount,
      taxableBase,
      taxRate,
      taxAmount,
      taxType: input.taxConfig.taxType,
      taxCode: input.taxConfig.taxCode,
      exemptionCode: input.taxConfig.exemptionCode,
      exemptionReason: input.taxConfig.exemptionReason,
      withholdingRate: input.applyWithholdingTax ? withholdingRate : undefined,
      withholdingAmount: input.applyWithholdingTax ? withholdingAmount : undefined,
      totalLineAmount,
    };
  }

  /**
   * Valida se a configuração de imposto é legalmente válida
   */
  static validateTaxConfiguration(config: TaxConfiguration): { isValid: boolean; error?: string } {
    if (config.ratePercentage < 0 || config.ratePercentage > 100) {
      return { isValid: false, error: 'A taxa de imposto deve situar-se entre 0% e 100%.' };
    }

    if (config.ratePercentage === 0) {
      if (!config.exemptionCode) {
        return {
          isValid: false,
          error: 'Operações com taxa 0% de IVA requerem obrigatoriamente código de isenção (M00 a M99) e respectiva fundamentação legal.',
        };
      }
      if (!config.legalBasis || config.legalBasis.trim().length === 0) {
        return {
          isValid: false,
          error: 'Operações com isenção requerem fundamentação legal explícita nos termos do Código do IVA.',
        };
      }
    }

    return { isValid: true };
  }
}
