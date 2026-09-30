import { FiscalDatabase } from '../repository/FiscalDatabase';
import { SAFTHeaderBuilder } from './builders/SAFTHeaderBuilder';
import { SAFTMasterFilesBuilder } from './builders/SAFTMasterFilesBuilder';
import { SAFTSalesInvoicesBuilder } from './builders/SAFTSalesInvoicesBuilder';
import { SAFTPaymentsBuilder } from './builders/SAFTPaymentsBuilder';
import { SAFTXMLGenerator } from './SAFTXMLGenerator';
import { SAFTValidator } from './SAFTValidator';
import { SAFTAuditFile, SAFTValidationResult } from '../types/saft';

export interface SAFTExportOptions {
  companyId: string;
  fiscalYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  headerComment?: string;
}

export interface SAFTExportOutput {
  auditFile: SAFTAuditFile;
  xml: string;
  fileName: string;
  fileSizeBytes: number;
  validation: SAFTValidationResult;
  generatedAt: string;
}

export class SAFTService {
  public static generateSAFTOffice(options: SAFTExportOptions): SAFTExportOutput {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get(options.companyId);

    if (!company) {
      throw new Error(`Empresa com ID '${options.companyId}' não encontrada.`);
    }

    // Filtra documentos do período
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    end.setHours(23, 59, 59, 999);

    const periodDocuments = Array.from(db.documents.values()).filter((doc) => {
      if (doc.companyId !== options.companyId) return false;
      const docDate = new Date(doc.documentDate);
      return docDate >= start && docDate <= end;
    });

    // Filtra pagamentos do período
    const periodPayments = Array.from(db.payments.values()).filter((pmt) => {
      if (pmt.companyId !== options.companyId) return false;
      const pmtDate = new Date(pmt.paymentDate);
      return pmtDate >= start && pmtDate <= end;
    });

    // 1. Constroi Cabeçalho
    const header = SAFTHeaderBuilder.build({
      company,
      fiscalYear: options.fiscalYear,
      startDate: options.startDate,
      endDate: options.endDate,
      headerComment: options.headerComment,
    });

    // 2. Constroi Ficheiros Mestres (MasterFiles)
    const customers = Array.from(db.customers.values()).filter(
      (c) => c.companyId === options.companyId
    );
    const products = Array.from(db.products.values()).filter(
      (p) => p.companyId === options.companyId
    );
    const taxConfigs = Array.from(db.taxConfigurations.values());

    const masterFiles = SAFTMasterFilesBuilder.build(customers, products, taxConfigs);

    // 3. Constroi SalesInvoices
    const salesInvoices = SAFTSalesInvoicesBuilder.build(periodDocuments);

    // 4. Constroi Payments
    const payments = SAFTPaymentsBuilder.build(periodPayments, db.documents);

    // 5. AuditFile Completo
    const auditFile: SAFTAuditFile = {
      header,
      masterFiles,
      sourceDocuments: {
        salesInvoices,
        payments,
      },
    };

    // 6. Auditoria de Validação Semântica e Estrutural
    const validation = SAFTValidator.validate(auditFile);

    // 7. Serialização XML Conforme Portaria 292/18 AGT
    const xml = SAFTXMLGenerator.generateXML(auditFile);
    const encoder = new TextEncoder();
    const fileSizeBytes = encoder.encode(xml).length;

    // Nome Canónico do Ficheiro SAF-T de Angola: SAFT_NIF_ANO_MES.xml
    const startMonth = (start.getMonth() + 1).toString().padStart(2, '0');
    const fileName = `SAFT_${company.taxId}_${options.fiscalYear}_M${startMonth}.xml`;

    return {
      auditFile,
      xml,
      fileName,
      fileSizeBytes,
      validation,
      generatedAt: new Date().toISOString(),
    };
  }
}
