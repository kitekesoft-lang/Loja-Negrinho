import { SAFTService } from '../saft/SAFTService';
import { SAFTXMLGenerator } from '../saft/SAFTXMLGenerator';
import { SAFTValidator } from '../saft/SAFTValidator';
import { FiscalDatabase } from '../repository/FiscalDatabase';
import { InvoiceEngine } from '../engines/InvoiceEngine';
import { CreditNoteEngine } from '../engines/CreditNoteEngine';
import { PaymentEngine } from '../engines/PaymentEngine';
import { SAFTAuditFile } from '../types/saft';

export interface Phase3TestResult {
  id: string;
  category: 'EXTRACTION' | 'VALIDATION' | 'XML_STRUCTURE' | 'RECTIFICATION' | 'REPRODUCIBILITY';
  name: string;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  executionTimeMs: number;
}

export interface Phase3TestSuiteSummary {
  results: Phase3TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
  };
}

export class Phase3TestSuite {
  public static async runAllTests(): Promise<Phase3TestSuiteSummary> {
    const startTime = performance.now();
    const results: Phase3TestResult[] = [];
    const db = FiscalDatabase.getInstance();

    const company = db.companies.get('COMP-001') || Array.from(db.companies.values())[0];
    const customer = db.customers.get('CUST-002') || Array.from(db.customers.values())[0];
    const product = db.products.get('PRD-ERP') || Array.from(db.products.values())[0];
    const productExempt = db.products.get('PRD-FORMACAO') || Array.from(db.products.values()).find(p => p.taxConfigurationId === 'TAX-IVAM02') || product;
    const series = db.series.get('SER-FT-2026') || Array.from(db.series.values()).find(s => s.documentTypeCode === 'FT')!;
    const user = db.users.get('USR-ADMIN') || Array.from(db.users.values())[0];

    // Garante emissão de um documento com IVA normal e um com Isenção para teste exaustivo de SAF-T
    const docNormal = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: series.establishmentId,
        series,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: product.id, quantity: 2, discountPercentage: 5 }],
        issuedByUser: user,
        previousDocumentHash: db.getLastHashForSeries(series.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );
    db.documents.set(docNormal.id, docNormal);

    // Emite documento com isenção
    const docExempt = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: series.establishmentId,
        series,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: productExempt.id, quantity: 1, discountPercentage: 0 }],
        issuedByUser: user,
        previousDocumentHash: db.getLastHashForSeries(series.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );
    db.documents.set(docExempt.id, docExempt);

    // Emite Nota de Crédito rectificativa para validar tratamento de crédito/débito
    const ncSeries = db.series.get('SER-NC-2026') || Array.from(db.series.values()).find(s => s.documentTypeCode === 'NC');
    if (ncSeries) {
      const ncDoc = CreditNoteEngine.issueCreditNote(
        {
          company,
          establishmentId: ncSeries.establishmentId,
          series: ncSeries,
          originalDocument: docNormal,
          customer,
          reason: 'Devolução parcial autorizada de teste SAF-T',
          lines: [{ productId: product.id, quantity: 1, discountPercentage: 0 }],
          issuedByUser: user,
          previousDocumentHash: db.getLastHashForSeries(ncSeries.id),
        },
        { products: db.products, taxConfigs: db.taxConfigurations }
      );
      db.documents.set(ncDoc.id, ncDoc);
    }

    // Regista um pagamento oficial para teste da secção Payments
    const existingPayments = Array.from(db.payments.values()).filter(p => p.documentId === docNormal.id);
    const pmt = PaymentEngine.registerPayment(
      {
        companyId: company.id,
        document: docNormal,
        amount: Math.round(docNormal.netTotal * 0.5), // Pagamento de 50%
        paymentMethod: 'MULTICAIXA',
        transactionReference: 'TPA-AUT-99412',
        user,
      },
      existingPayments
    );
    db.payments.set(pmt.id, pmt);

    // ==========================================
    // 1. TESTE DE CONSTRUÇÃO DO HEADER E MASTERFILES
    // ==========================================
    const t1Start = performance.now();
    const saftOutput = SAFTService.generateSAFTOffice({
      companyId: company.id,
      fiscalYear: 2026,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const header = saftOutput.auditFile.header;
    const isHeaderValid =
      header.auditFileVersion === '0.1.01' &&
      header.taxAccountingBasis === 'F' &&
      header.companyID === company.taxId &&
      header.currencyCode === 'AOA' &&
      header.fiscalYear === 2026;

    results.push({
      id: 'PH3-TEST-01',
      category: 'EXTRACTION',
      name: 'Construção Canónica do Header SAF-T(AO)',
      description: 'Valida se o cabeçalho cumpre todos os requisitos mandatórios da AGT (TaxAccountingBasis="F", Currency="AOA", NIF e Ano Fiscal).',
      passed: isHeaderValid,
      expected: 'auditFileVersion: 0.1.01, taxAccountingBasis: F, currency: AOA',
      actual: `Version: ${header.auditFileVersion}, Basis: ${header.taxAccountingBasis}, NIF: ${header.companyID}`,
      executionTimeMs: Math.round(performance.now() - t1Start),
    });

    // ==========================================
    // 2. TESTE DE INTEGRIDADE REFERENCIAL MASTERFILES (CLIENTES, ARTIGOS, TAXAS)
    // ==========================================
    const t2Start = performance.now();
    const mf = saftOutput.auditFile.masterFiles;
    const hasCustomers = mf.customers.length > 0 && mf.customers.every((c) => !!c.customerTaxID);
    const hasProducts = mf.products.length > 0 && mf.products.every((p) => ['P', 'S'].includes(p.productType));
    const hasTaxes = mf.taxTable.length > 0 && mf.taxTable.some((t) => t.taxCode === 'NOR');

    results.push({
      id: 'PH3-TEST-02',
      category: 'EXTRACTION',
      name: 'Extracção de MasterFiles com Integridade Referencial',
      description: 'Garante catálogo consistente de clientes com NIF, artigos com classificação Produto (P) ou Serviço (S) e tabela de IVA.',
      passed: hasCustomers && hasProducts && hasTaxes,
      expected: 'Clientes com NIF, Produtos P/S e TaxTable contendo taxa normal NOR',
      actual: `Clientes: ${mf.customers.length}, Produtos: ${mf.products.length}, Taxas: ${mf.taxTable.length}`,
      executionTimeMs: Math.round(performance.now() - t2Start),
    });

    // ==========================================
    // 3. TESTE DE GERAÇÃO E VALIDAÇÃO XML CONFORME SCHEMA
    // ==========================================
    const t3Start = performance.now();
    const xml = saftOutput.xml;
    const hasAuditFileTag = xml.includes('<AuditFile') && xml.includes('xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01"');
    const hasSalesInvoicesTag = xml.includes('<SalesInvoices>') && xml.includes('</SalesInvoices>');
    const hasHeaderTag = xml.includes('<Header>') && xml.includes('</Header>');
    const hasMasterFilesTag = xml.includes('<MasterFiles>') && xml.includes('</MasterFiles>');

    results.push({
      id: 'PH3-TEST-03',
      category: 'XML_STRUCTURE',
      name: 'Serialização XML em Conformidade com Namespace Oficial AGT',
      description: 'Valida se o ficheiro XML contém o namespace oficial da AGT e todos os nós de topo (Header, MasterFiles, SourceDocuments).',
      passed: hasAuditFileTag && hasSalesInvoicesTag && hasHeaderTag && hasMasterFilesTag,
      expected: 'XML bem-formado com namespace urn:OECD:StandardAuditFile-Tax:AO_1.01_01',
      actual: `AuditFile tag: ${hasAuditFileTag}, SalesInvoices: ${hasSalesInvoicesTag}, Tamanho: ${saftOutput.fileSizeBytes} bytes`,
      executionTimeMs: Math.round(performance.now() - t3Start),
    });

    // ==========================================
    // 4. TESTE DE AUDITORIA SEMÂNTICA (SAFTValidator)
    // ==========================================
    const t4Start = performance.now();
    const valResult = SAFTValidator.validate(saftOutput.auditFile);

    results.push({
      id: 'PH3-TEST-04',
      category: 'VALIDATION',
      name: 'Motor de Validação Semântica & XSD Virtual',
      description: 'Executa o SAFTValidator sobre a estrutura de dados, verificando ausência de erros estruturais e coerência de totais.',
      passed: valResult.isValid && valResult.totalErrors === 0,
      expected: 'isValid: true, totalErrors: 0',
      actual: `isValid: ${valResult.isValid}, Erros: ${valResult.totalErrors}, Avisos: ${valResult.totalWarnings}`,
      executionTimeMs: Math.round(performance.now() - t4Start),
    });

    // ==========================================
    // 5. TESTE DE DETECÇÃO DE INCONGRUÊNCIA PROPOSITAL
    // ==========================================
    const t5Start = performance.now();
    // Clona o ficheiro e adultera o valor do total
    const corruptedAuditFile: SAFTAuditFile = JSON.parse(JSON.stringify(saftOutput.auditFile));
    if (corruptedAuditFile.sourceDocuments.salesInvoices?.invoice?.[0]) {
      corruptedAuditFile.sourceDocuments.salesInvoices.invoice[0].documentTotals.grossTotal += 99999;
    }

    const corruptedValidation = SAFTValidator.validate(corruptedAuditFile);
    const caughtDiscrepancy =
      !corruptedValidation.isValid &&
      corruptedValidation.issues.some((i) => i.code === 'SAFT_ERR_013' || i.code === 'SAFT_ERR_015');

    results.push({
      id: 'PH3-TEST-05',
      category: 'VALIDATION',
      name: 'Detecção de Inconsistência Aritmética nos Totais Fiscais',
      description: 'Valida se o validador rejeita com código de erro específico qualquer manipulação de GrossTotal que divirja da soma de Linhas e IVA.',
      passed: caughtDiscrepancy,
      expected: 'isValid: false com código SAFT_ERR_013 ou SAFT_ERR_015 detectado',
      actual: `isValid: ${corruptedValidation.isValid}, Erros detectados: ${corruptedValidation.totalErrors}`,
      executionTimeMs: Math.round(performance.now() - t5Start),
    });

    // ==========================================
    // 6. TESTE DE REPRODUCIBILIDADE E AUDITABILIDADE
    // ==========================================
    const t6Start = performance.now();
    const secondOutput = SAFTService.generateSAFTOffice({
      companyId: company.id,
      fiscalYear: 2026,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const isReproducible =
      saftOutput.xml === secondOutput.xml &&
      saftOutput.validation.metrics.totalGrossSales === secondOutput.validation.metrics.totalGrossSales;

    results.push({
      id: 'PH3-TEST-06',
      category: 'REPRODUCIBILITY',
      name: 'Geração Reproduzível e Determinística do SAF-T',
      description: 'Confirma que duas gerações consecutivas do mesmo período produzem ficheiros XML idênticos byte a byte.',
      passed: isReproducible,
      expected: 'XMLs idênticos com o mesmo hash e totais contábeis',
      actual: `Match: ${isReproducible} | Totais: ${saftOutput.validation.metrics.totalGrossSales} AOA`,
      executionTimeMs: Math.round(performance.now() - t6Start),
    });

    const totalDuration = Math.round(performance.now() - startTime);

    return {
      results,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        durationMs: totalDuration,
      },
    };
  }
}
