import { Customer } from '../../types/customer';
import { Product } from '../../types/product';
import { TaxConfiguration } from '../../types/tax';
import { SAFTMasterFiles, SAFTCustomer, SAFTProduct, SAFTTaxEntry } from '../../types/saft';

export class SAFTMasterFilesBuilder {
  public static build(
    customers: Customer[],
    products: Product[],
    taxConfigs: TaxConfiguration[]
  ): SAFTMasterFiles {
    // 1. Clientes
    const saftCustomers: SAFTCustomer[] = customers.map((c) => ({
      customerID: c.id,
      accountID: '31.1.2.1', // Conta corrente de clientes padrão PGC Angolano
      customerTaxID: c.taxId.trim().toUpperCase(),
      companyName: c.name,
      billingAddress: {
        addressDetail: c.billingAddress || 'Angola',
        city: c.city || 'Luanda',
        postalCode: c.postalCode || '0000',
        country: c.country || 'AO',
      },
      selfBillingIndicator: 0,
    }));

    // 2. Produtos e Serviços
    const saftProducts: SAFTProduct[] = products.map((p) => ({
      productType: p.type === 'SERVICE' ? 'S' : 'P',
      productCode: p.code,
      productGroup: 'GERAL',
      productDescription: p.description,
      productNumberCode: p.code,
    }));

    // 3. Tabela de Impostos (TaxTable)
    const saftTaxes: SAFTTaxEntry[] = taxConfigs.map((t) => ({
      taxType: 'IVA',
      taxCountryRegion: 'AO',
      taxCode: t.taxCode, // 'NOR', 'RED', 'ISE'
      description: t.name,
      taxPercentage: t.ratePercentage,
    }));

    return {
      customers: saftCustomers,
      products: saftProducts,
      taxTable: saftTaxes,
    };
  }
}
