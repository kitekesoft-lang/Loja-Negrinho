import { Company } from '../../types/company';
import { SAFTHeader } from '../../types/saft';

export interface HeaderBuilderParams {
  company: Company;
  fiscalYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  headerComment?: string;
}

export class SAFTHeaderBuilder {
  public static build(params: HeaderBuilderParams): SAFTHeader {
    const { company, fiscalYear, startDate, endDate, headerComment } = params;

    // Normalização estrita de NIF Angolano (remove espaços ou formatações desnecessárias)
    const cleanTaxId = company.taxId.trim().toUpperCase();

    return {
      auditFileVersion: '0.1.01',
      companyID: cleanTaxId,
      taxRegistrationNumber: cleanTaxId,
      taxAccountingBasis: 'F', // F = Facturação
      companyName: company.tradeName || company.name,
      businessName: company.tradeName,
      companyAddress: {
        addressDetail: company.address || 'Luanda, Angola',
        city: company.city || 'Luanda',
        province: company.province || 'Luanda',
        postalCode: '0000',
        country: 'AO',
      },
      fiscalYear,
      startDate,
      endDate,
      currencyCode: 'AOA',
      dateCreated: new Date().toISOString().split('T')[0],
      taxEntity: 'Global',
      productCompanyTaxID: '5417088921', // NIF da Empresa Produtora do Software (KitekeSoft)
      softwareValidationNumber: '999/AGT/2026',
      productID: 'Kiteke Fiscal ERP Cloud',
      productVersion: '1.0.0',
      headerComment: headerComment || 'Extracção oficial SAF-T (AO) Facturação - Portaria n.º 292/18 AGT',
      telephone: company.phone || '+244 923 000 000',
      email: company.email || 'fiscal@empresa.ao',
      website: 'https://empresa.ao',
    };
  }
}
