import { Customer, CustomerType } from '../types/customer';
import { Product } from '../types/product';

export interface SaftHeaderSummary {
  companyName: string;
  taxRegistrationNumber: string;
  softwareCertificateNumber?: string;
  productID?: string;
  productVersion?: string;
  fiscalYear?: string;
  startDate?: string;
  endDate?: string;
  dateCreated?: string;
}

export interface SaftParsedData {
  header: SaftHeaderSummary;
  customers: Array<{
    id: string;
    taxId: string;
    name: string;
    customerType: CustomerType;
    billingAddress: string;
    city: string;
    email?: string;
    phone?: string;
  }>;
  products: Array<{
    id: string;
    code: string;
    name: string;
    barcode?: string;
    price: number;
    costPrice: number;
    taxCode: string;
    taxPercentage: number;
    category: string;
    unit: string;
    stock: number;
  }>;
  invoicesCount: number;
  totalSalesValue: number;
  rawXmlLength: number;
}

export class SaftXmlParser {
  /**
   * Analisa e extrai dados cruciais do ficheiro SAF-T (AO) em XML
   */
  public static parseXmlString(xmlContent: string): SaftParsedData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`Ficheiro SAF-T inválido ou XML corrompido: ${parserError.textContent?.slice(0, 150)}`);
    }

    // 1. Extração do Header
    const getTag = (parent: Element | Document, tag: string) => {
      const el = parent.getElementsByTagName(tag)[0];
      return el ? el.textContent?.trim() || '' : '';
    };

    const headerEl = doc.getElementsByTagName('Header')[0];
    const header: SaftHeaderSummary = {
      companyName: headerEl ? getTag(headerEl, 'CompanyName') : 'Empresa SAF-T Desconhecida',
      taxRegistrationNumber: headerEl ? getTag(headerEl, 'TaxRegistrationNumber') : '999999999',
      softwareCertificateNumber: headerEl ? getTag(headerEl, 'SoftwareCertificateNumber') : '',
      productID: headerEl ? getTag(headerEl, 'ProductID') : '',
      productVersion: headerEl ? getTag(headerEl, 'ProductVersion') : '',
      fiscalYear: headerEl ? getTag(headerEl, 'FiscalYear') : new Date().getFullYear().toString(),
      startDate: headerEl ? getTag(headerEl, 'StartDate') : '',
      endDate: headerEl ? getTag(headerEl, 'EndDate') : '',
      dateCreated: headerEl ? getTag(headerEl, 'DateCreated') : new Date().toISOString(),
    };

    // 2. Extração de Clientes (MasterFiles -> Customer)
    const customerNodes = doc.getElementsByTagName('Customer');
    const customers: SaftParsedData['customers'] = [];

    for (let i = 0; i < customerNodes.length; i++) {
      const node = customerNodes[i];
      const id = getTag(node, 'CustomerID') || `CLI-SAFT-${i + 1}`;
      const taxId = getTag(node, 'CustomerTaxID') || '999999999';
      const name = getTag(node, 'CompanyName') || `Cliente ${i + 1}`;
      
      const billingNode = node.getElementsByTagName('BillingAddress')[0];
      const address = billingNode ? getTag(billingNode, 'AddressDetail') || 'Luanda, Angola' : 'Luanda, Angola';
      const city = billingNode ? getTag(billingNode, 'City') || 'Luanda' : 'Luanda';
      const email = getTag(node, 'Email') || undefined;
      const phone = getTag(node, 'Telephone') || undefined;

      let customerType: CustomerType = 'PARTICULAR';
      if (taxId === '999999999') {
        customerType = 'CONSUMIDOR_FINAL';
      } else if (taxId.length === 10 && taxId.startsWith('5')) {
        customerType = 'EMPRESA_NACIONAL';
      }

      customers.push({
        id,
        taxId,
        name,
        customerType,
        billingAddress: address,
        city,
        email,
        phone,
      });
    }

    // 3. Extração de Produtos (MasterFiles -> Product)
    const productNodes = doc.getElementsByTagName('Product');
    const products: SaftParsedData['products'] = [];

    for (let i = 0; i < productNodes.length; i++) {
      const node = productNodes[i];
      const code = getTag(node, 'ProductCode') || `PRD-SAFT-${i + 1}`;
      const name = getTag(node, 'ProductDescription') || `Artigo ${code}`;
      const barcode = getTag(node, 'ProductNumberCode') || undefined;
      const group = getTag(node, 'ProductGroup') || 'Geral';

      // Preços típicos de importação quando não especificados na árvore básica do SAF-T
      const price = 5000;
      const costPrice = 3000;

      products.push({
        id: `PRD-${code.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        code,
        name,
        barcode,
        price,
        costPrice,
        taxCode: 'NOR',
        taxPercentage: 14,
        category: group,
        unit: 'UN',
        stock: 50,
      });
    }

    // 4. Totais de Faturas (SourceDocuments -> SalesInvoices)
    const invoices = doc.getElementsByTagName('Invoice');
    let totalSales = 0;
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      const docTotals = inv.getElementsByTagName('DocumentTotals')[0];
      if (docTotals) {
        const gross = parseFloat(getTag(docTotals, 'GrossTotal')) || 0;
        totalSales += gross;
      }
    }

    return {
      header,
      customers,
      products,
      invoicesCount: invoices.length,
      totalSalesValue: Math.round(totalSales * 100) / 100,
      rawXmlLength: xmlContent.length,
    };
  }
}
