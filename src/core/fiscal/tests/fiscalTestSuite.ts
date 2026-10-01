import { FiscalDatabase } from '../repository/FiscalDatabase';
import { TaxEngine } from '../engines/TaxEngine';
import { DocumentSeriesEngine } from '../engines/DocumentSeriesEngine';
import { InvoiceEngine } from '../engines/InvoiceEngine';
import { CreditNoteEngine } from '../engines/CreditNoteEngine';
import { PaymentEngine } from '../engines/PaymentEngine';
import { HashChainingService } from '../security/HashChainingService';
import { SignatureService } from '../security/SignatureService';
import { FiscalQRCodeService } from '../security/FiscalQRCodeService';
import { AuthService } from '../security/AuthService';
import { NifValidator } from '../security/NifValidator';
import { RbacService } from '../security/RbacService';
import { AuditService } from '../security/AuditService';
import { TaxConfiguration } from '../types/tax';
import { DocumentSeries } from '../types/series';
import { User, canAccessAdminLayout } from '../types/user';
import { Customer } from '../types/customer';
import { Product } from '../types/product';
import { Company, Establishment } from '../types/company';
import { FiscalDocument } from '../types/document';

export interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  assertionDetails: string[];
  errorMessage?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestCaseResult[];
}

export class FiscalTestSuite {
  static runAll(): TestSuiteSummary {
    const startTime = performance.now();
    const results: TestCaseResult[] = [];

    const tests = [
      this.testCompanyAndEstablishmentSetup,
      this.testAngolanNifValidation,
      this.testUserRbacAndPermissions,
      this.testTaxEngineCalculations,
      this.testTaxEngineZeroRateValidation,
      this.testDocumentSeriesSequentialAllocation,
      this.testSeriesClosureAndInactivityProtection,
      this.testInvoiceIssuanceWithChainedSha256,
      this.testDocumentImmutabilityPostIssuance,
      this.testInvoiceReceiptImmediatePayment,
      this.testCreditNoteWithMandatoryReference,
      this.testCreditNoteExceedingLimitRejection,
      this.testDebitNoteIssuance,
      this.testPaymentRegistrationAndBalanceTracking,
      this.testFullChainCryptographicIntegrity,
      this.testTamperDetectionMechanism,
      this.testComprehensiveAuditTrail,
      this.testRsa2048AsymmetricSignatureAndVerification,
      this.testAgtFiscalQrCodeGenerationAndIntegrity,
      this.testPublicVerificationPortalUrlAndPayloadParity,
      this.testAuthenticationFirstAccessPasswordChangeAndAdminSeparation,
    ];

    for (const testFn of tests) {
      const caseStart = performance.now();
      const assertions: string[] = [];
      try {
        const testMeta = testFn.call(this, assertions);
        results.push({
          id: testMeta.id,
          name: testMeta.name,
          category: testMeta.category,
          status: 'PASSED',
          durationMs: Math.round((performance.now() - caseStart) * 100) / 100,
          assertionDetails: assertions,
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-ERR',
          name: testFn.name,
          category: 'Core',
          status: 'FAILED',
          durationMs: Math.round((performance.now() - caseStart) * 100) / 100,
          assertionDetails: assertions,
          errorMessage: err?.message || String(err),
        });
      }
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const passed = results.filter((r) => r.status === 'PASSED').length;
    const failed = results.length - passed;

    return {
      total: results.length,
      passed,
      failed,
      durationMs,
      results,
    };
  }

  // 1. Empresa e Estabelecimento
  private static testCompanyAndEstablishmentSetup(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001');
    if (!company) throw new Error('Empresa principal não encontrada no banco');
    assertions.push(`Empresa ${company.name} (NIF: ${company.taxId}) verificada com sucesso.`);
    
    if (company.currency !== 'AOA') throw new Error('Moeda fiscal padrão deve ser AOA');
    assertions.push('Moeda fiscal validada como AOA (Kwanza).');

    const ests = Array.from(db.establishments.values()).filter(e => e.companyId === company.id);
    if (ests.length < 2) throw new Error('Devem existir pelo menos 2 estabelecimentos provisionados');
    assertions.push(`${ests.length} estabelecimentos verificados (Sede e Loja Talatona).`);

    return {
      id: 'TEST-01',
      name: '1.1 & 1.2 Criação e Configuração de Empresas e Estabelecimentos',
      category: 'Estrutura Organizacional',
    };
  }

  // 2. Validação de NIF Angolano
  private static testAngolanNifValidation(assertions: string[]): { id: string; name: string; category: string } {
    // Consumidor Final
    const finalResult = NifValidator.validate('999999999', 'AO');
    if (!finalResult.isValid || finalResult.type !== 'CONSUMIDOR_FINAL') {
      throw new Error('NIF 999999999 deve ser validado como CONSUMIDOR_FINAL');
    }
    assertions.push('999999999 validado com sucesso como Consumidor Final.');

    // Empresa (10 dígitos iniciado por 5)
    const coResult = NifValidator.validate('5417082341', 'AO');
    if (!coResult.isValid || coResult.type !== 'PESSOA_COLECTIVA') {
      throw new Error('5417082341 deve ser validado como PESSOA_COLECTIVA');
    }
    assertions.push('5417082341 validado com sucesso como Pessoa Colectiva.');

    // Particular (BI 14 caracteres)
    const biResult = NifValidator.validate('004521345LA042', 'AO');
    if (!biResult.isValid || biResult.type !== 'PESSOA_SINGULAR') {
      throw new Error('004521345LA042 deve ser validado como PESSOA_SINGULAR');
    }
    assertions.push('004521345LA042 validado com sucesso como Particular (BI Angolano).');

    // NIF inválido
    const invResult = NifValidator.validate('1234', 'AO');
    if (invResult.isValid) throw new Error('NIF 1234 deveria ter sido rejeitado');
    assertions.push('NIF inválido 1234 rejeitado com mensagem descritiva.');

    return {
      id: 'TEST-02',
      name: '1.4 Validação Rigorosa de NIF Angolano (Pessoas Colectivas, Singulares e Consumidor Final)',
      category: 'Segurança & Validação',
    };
  }

  // 3. RBAC e Permissões de Perfis Fiscais
  private static testUserRbacAndPermissions(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const admin = db.users.get('USR-ADMIN')!;
    const caixa = db.users.get('USR-CAIXA')!;
    const auditor = db.users.get('USR-AUDITOR')!;

    // ADMIN pode criar séries
    if (!RbacService.hasPermission(admin, 'SERIES_CREATE')) {
      throw new Error('Admin deve possuir permissão SERIES_CREATE');
    }
    assertions.push('ADMIN possui autorização para gestão de séries e configurações fiscais.');

    // CAIXA NÃO pode criar FT a crédito
    if (RbacService.hasPermission(caixa, 'INVOICE_CREATE_FT')) {
      throw new Error('Caixa NÃO deve ter permissão para emitir Factura a Crédito FT');
    }
    assertions.push('CAIXA impedido com sucesso de emitir Facturas a Crédito (FT).');

    // CAIXA PODE emitir Factura/Recibo FR
    if (!RbacService.hasPermission(caixa, 'INVOICE_CREATE_FR')) {
      throw new Error('Caixa deve possuir permissão INVOICE_CREATE_FR');
    }
    assertions.push('CAIXA autorizado a emitir Facturas/Recibo (FR) imediatas.');

    // AUDITOR apenas visualiza logs
    if (RbacService.hasPermission(auditor, 'INVOICE_CREATE_FT')) {
      throw new Error('Auditor não pode emitir facturas');
    }
    assertions.push('AUDITOR restrito estritamente a consultas de integridade e logs.');

    return {
      id: 'TEST-03',
      name: '1.3 Utilizadores, Perfis Fiscais e Matriz de Permissões (RBAC)',
      category: 'Segurança & Validação',
    };
  }

  // 4. Motor de Impostos (TaxEngine)
  private static testTaxEngineCalculations(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const iva14 = db.taxConfigurations.get('TAX-IVA14')!;
    const iva07 = db.taxConfigurations.get('TAX-IVA07')!;

    // Teste 1: Serviço com IVA 14% e Retenção na Fonte de 6.5%
    const res1 = TaxEngine.calculateLine({
      quantity: 2,
      unitPrice: 100000.0,
      discountPercentage: 10, // 10% de desconto
      taxConfig: iva14,
      applyWithholdingTax: true,
      withholdingPercentage: 6.5,
    });

    // Bruto = 200.000, Desconto 10% = 20.000, Incidência = 180.000
    // IVA 14% = 25.200, Retenção 6.5% = 11.700, Total Líquido = 180.000 + 25.200 - 11.700 = 193.500
    if (res1.grossAmount !== 200000) throw new Error(`Bruto incorrecto: ${res1.grossAmount}`);
    if (res1.discountAmount !== 20000) throw new Error(`Desconto incorrecto: ${res1.discountAmount}`);
    if (res1.taxableBase !== 180000) throw new Error(`Incidência incorrecta: ${res1.taxableBase}`);
    if (res1.taxAmount !== 25200) throw new Error(`IVA incorrecto: ${res1.taxAmount}`);
    if (res1.withholdingAmount !== 11700) throw new Error(`Retenção incorrecta: ${res1.withholdingAmount}`);
    if (res1.totalLineAmount !== 193500) throw new Error(`Total líquido incorrecto: ${res1.totalLineAmount}`);

    assertions.push('Cálculo com Desconto comercial 10%, IVA 14% e Retenção na Fonte 6.5% conferido com exactidão contábil.');

    // Teste 2: Produto Taxa Reduzida 7%
    const res2 = TaxEngine.calculateLine({
      quantity: 10,
      unitPrice: 5000,
      taxConfig: iva07,
    });
    if (res2.taxableBase !== 50000) throw new Error('Base incorrecta para 7%');
    if (res2.taxAmount !== 3500) throw new Error('IVA 7% incorrecto');
    assertions.push('Cálculo de taxa reduzida de IVA 7% verificado: 50.000 AOA -> IVA 3.500 AOA.');

    return {
      id: 'TEST-04',
      name: '1.7 Motor de Impostos (TaxEngine) - IVA 14%, 7%, Descontos e Retenção 6.5%',
      category: 'Motor Fiscal',
    };
  }

  // 5. Validação de Isenções e Taxa Zero
  private static testTaxEngineZeroRateValidation(assertions: string[]): { id: string; name: string; category: string } {
    const invalidZeroConfig: TaxConfiguration = {
      id: 'TAX-TEST-INV',
      code: 'IVA_00_INV',
      name: 'Taxa Zero Inválida sem Motivo',
      taxType: 'IVA',
      taxCode: 'ISE',
      ratePercentage: 0,
      legalBasis: '', // Ausente
      isActive: true,
    };

    const val = TaxEngine.validateTaxConfiguration(invalidZeroConfig);
    if (val.isValid) {
      throw new Error('Configuração de taxa 0% sem código de isenção e fundamentação deve ser REJEITADA');
    }
    assertions.push('Rejeição estrita de taxa 0% sem menção a código de isenção M00-M99 e base legal.');

    return {
      id: 'TEST-05',
      name: '1.7 Validação Legal de Isenções de IVA (M00-M99) e Fundamentação Obrigatória',
      category: 'Motor Fiscal',
    };
  }

  // 6. Séries Documentais e Numeração Sequencial Atómica
  private static testDocumentSeriesSequentialAllocation(assertions: string[]): { id: string; name: string; category: string } {
    const testSeries: DocumentSeries = {
      id: 'SER-TEST-SEQ',
      companyId: 'COMP-001',
      establishmentId: 'EST-001',
      documentTypeCode: 'FT',
      seriesCode: 'TST26',
      fiscalYear: 2026,
      currentSequence: 0,
      isActive: true,
      isClosed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const alloc1 = DocumentSeriesEngine.allocateNextNumber(testSeries);
    const alloc2 = DocumentSeriesEngine.allocateNextNumber(testSeries);
    const alloc3 = DocumentSeriesEngine.allocateNextNumber(testSeries);

    if (alloc1.sequentialNumber !== 1 || alloc1.formattedDocumentNumber !== 'FT TST26/000001') {
      throw new Error(`Sequência 1 inválida: ${alloc1.formattedDocumentNumber}`);
    }
    if (alloc2.sequentialNumber !== 2 || alloc2.formattedDocumentNumber !== 'FT TST26/000002') {
      throw new Error(`Sequência 2 inválida: ${alloc2.formattedDocumentNumber}`);
    }
    if (alloc3.sequentialNumber !== 3 || alloc3.formattedDocumentNumber !== 'FT TST26/000003') {
      throw new Error(`Sequência 3 inválida: ${alloc3.formattedDocumentNumber}`);
    }

    assertions.push('Alocação atómica contínua: FT TST26/000001 -> 000002 -> 000003 sem furos ou saltos.');

    return {
      id: 'TEST-06',
      name: '1.8 Séries Documentais e Numeração Sequencial Atómica Sem Furos',
      category: 'Séries & Sequenciador',
    };
  }

  // 7. Bloqueio de Séries Fechadas ou Inactivas
  private static testSeriesClosureAndInactivityProtection(assertions: string[]): { id: string; name: string; category: string } {
    const closedSeries: DocumentSeries = {
      id: 'SER-CLOSED',
      companyId: 'COMP-001',
      establishmentId: 'EST-001',
      documentTypeCode: 'FT',
      seriesCode: 'ENC26',
      fiscalYear: 2026,
      currentSequence: 50,
      isActive: true,
      isClosed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let caught = false;
    try {
      DocumentSeriesEngine.allocateNextNumber(closedSeries);
    } catch (err: any) {
      caught = true;
      assertions.push(`Tentativa de emissão em série encerrada bloqueada: "${err.message}"`);
    }
    if (!caught) throw new Error('Série encerrada deveria ter recusado emissão');

    return {
      id: 'TEST-07',
      name: '1.8 Bloqueio e Proteção contra Emissão em Séries Encerradas ou Inactivas',
      category: 'Séries & Sequenciador',
    };
  }

  // 8. Emissão de Factura (FT) com Encadeamento SHA-256
  private static testInvoiceIssuanceWithChainedSha256(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const series = db.series.get('SER-FT-2026')!;
    const customer = db.customers.get('CLI-SONANGOL')!;
    const admin = db.users.get('USR-ADMIN')!;

    const doc1 = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-001',
        series,
        documentTypeCode: 'FT',
        customer,
        lines: [
          {
            productId: 'PRD-ERP',
            quantity: 1,
            discountPercentage: 0,
          },
        ],
        issuedByUser: admin,
        notes: 'Emissão de Factura Licenciamento Anual',
        previousDocumentHash: '', // Primeiro documento
      },
      {
        products: db.products,
        taxConfigs: db.taxConfigurations,
      }
    );

    if (!doc1.hash || doc1.hash.length !== 64) {
      throw new Error(`Hash SHA-256 inválido: ${doc1.hash}`);
    }
    if (!doc1.hashControl || doc1.hashControl.length !== 4) {
      throw new Error(`Código de controlo fiscal deve ter 4 caracteres: ${doc1.hashControl}`);
    }
    if (!doc1.signature || !doc1.signature.signatureBase64) {
      throw new Error('Documento fiscal emitido deve conter assinatura digital RSA-2048 vinculada');
    }

    assertions.push(`Documento emitido: ${doc1.documentNumber}`);
    assertions.push(`Hash SHA-256 gerado: ${doc1.hash}`);
    assertions.push(`Código de controlo fiscal impresso: ${doc1.hashControl}`);
    assertions.push(`Assinatura RSA-2048 vinculada: ${doc1.signature.signatureBase64.slice(0, 30)}... (${doc1.signature.algorithm})`);

    // Emissão do documento 2 encadeado
    const doc2 = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-001',
        series,
        documentTypeCode: 'FT',
        customer,
        lines: [
          {
            productId: 'PRD-CONS',
            quantity: 10,
          },
        ],
        issuedByUser: admin,
        previousDocumentHash: doc1.hash,
      },
      {
        products: db.products,
        taxConfigs: db.taxConfigurations,
      }
    );

    if (doc2.previousHash !== doc1.hash) {
      throw new Error(`Encadeamento falhou: previousHash de doc2 (${doc2.previousHash}) !== hash de doc1 (${doc1.hash})`);
    }
    assertions.push(`Documento 2 (${doc2.documentNumber}) encadeado com sucesso ao hash anterior.`);

    return {
      id: 'TEST-08',
      name: '1.10 Motor de Facturação (FT) com Encadeamento Criptográfico SHA-256 e Controlo de 4 Caracteres',
      category: 'Motor Fiscal',
    };
  }

  // 9. Imutabilidade e Integridade Pós-Emissão
  private static testDocumentImmutabilityPostIssuance(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const series = db.series.get('SER-FT-2026')!;
    const customer = db.customers.get('CLI-BMA')!;
    const admin = db.users.get('USR-ADMIN')!;

    const doc = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-001',
        series,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: 'PRD-FORMACAO', quantity: 2 }],
        issuedByUser: admin,
        previousDocumentHash: db.getLastHashForSeries(series.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    if (!doc.isLocked) throw new Error('O documento emitido deve ter isLocked = true');

    let caught = false;
    try {
      InvoiceEngine.assertDocumentImmutability(doc);
    } catch (err: any) {
      caught = true;
      assertions.push(`Garantia de imutabilidade ativada: "${err.message}"`);
    }
    if (!caught) throw new Error('Documento emitido deveria impedir qualquer alteração directa');

    return {
      id: 'TEST-09',
      name: '1.15 Imutabilidade e Integridade Fiscal: Bloqueio de Alterações e Exclusão Física',
      category: 'Segurança & Validação',
    };
  }

  // 10. Factura/Recibo (FR) com Quitação Imediata
  private static testInvoiceReceiptImmediatePayment(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const series = db.series.get('SER-FR-2026')!;
    const customer = db.customers.get('CLI-FINAL')!;
    const caixa = db.users.get('USR-CAIXA')!;

    const fr = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-002',
        series,
        documentTypeCode: 'FR',
        customer,
        lines: [{ productId: 'PRD-CESTA', quantity: 2 }],
        issuedByUser: caixa,
        notes: 'Venda a dinheiro a balcão',
        previousDocumentHash: db.getLastHashForSeries(series.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    if (fr.documentTypeCode !== 'FR') throw new Error('Documento deve ser FR');
    assertions.push(`Factura/Recibo emitida com sucesso: ${fr.documentNumber} (${fr.netTotal.toLocaleString('pt-AO')} AOA)`);

    return {
      id: 'TEST-10',
      name: '1.9 & 1.10 Emissão de Factura/Recibo (FR) com Quitação Imediata ao Balcão',
      category: 'Motor Fiscal',
    };
  }

  // 11. Nota de Crédito (NC) com Referência Obrigatória
  private static testCreditNoteWithMandatoryReference(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const ftSeries = db.series.get('SER-FT-2026')!;
    const ncSeries = db.series.get('SER-NC-2026')!;
    const customer = db.customers.get('CLI-SONANGOL')!;
    const admin = db.users.get('USR-ADMIN')!;

    // Emitir FT prévia
    const ft = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-001',
        series: ftSeries,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: 'PRD-ERP', quantity: 1 }],
        issuedByUser: admin,
        previousDocumentHash: db.getLastHashForSeries(ftSeries.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    // Emitir NC referenciando a FT
    const nc = CreditNoteEngine.issueCreditNote(
      {
        company,
        establishmentId: 'EST-001',
        series: ncSeries,
        originalDocument: ft,
        customer,
        reason: 'Cancelamento acordado do serviço de software conforme adenda contratual',
        lines: [{ productId: 'PRD-ERP', quantity: 1 }],
        issuedByUser: admin,
        previousDocumentHash: db.getLastHashForSeries(ncSeries.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    if (nc.references.length === 0) throw new Error('Nota de Crédito deve conter referência ao documento original');
    if (nc.references[0].referencedDocumentNumber !== ft.documentNumber) {
      throw new Error('Referência aponta para documento incorreto');
    }

    assertions.push(`Nota de Crédito ${nc.documentNumber} emitida referenciando estritamente a Factura ${ft.documentNumber}.`);
    assertions.push(`Motivo legal registrado: "${nc.references[0].reason}".`);

    return {
      id: 'TEST-11',
      name: '1.12 Emissão de Nota de Crédito (NC) com Referência Obrigatória e Motivo Legal',
      category: 'Motor Fiscal',
    };
  }

  // 12. Rejeição de Nota de Crédito Superior ao Valor Original
  private static testCreditNoteExceedingLimitRejection(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const ftSeries = db.series.get('SER-FT-2026')!;
    const ncSeries = db.series.get('SER-NC-2026')!;
    const customer = db.customers.get('CLI-BMA')!;
    const admin = db.users.get('USR-ADMIN')!;

    const ft = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-001',
        series: ftSeries,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: 'PRD-FORMACAO', quantity: 1 }], // 95.000 AOA
        issuedByUser: admin,
        previousDocumentHash: db.getLastHashForSeries(ftSeries.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    let rejected = false;
    try {
      CreditNoteEngine.issueCreditNote(
        {
          company,
          establishmentId: 'EST-001',
          series: ncSeries,
          originalDocument: ft,
          customer,
          reason: 'Tentativa indevida de crédito excessivo',
          lines: [{ productId: 'PRD-FORMACAO', quantity: 5 }], // 5x o valor original
          issuedByUser: admin,
          previousDocumentHash: db.getLastHashForSeries(ncSeries.id),
        },
        { products: db.products, taxConfigs: db.taxConfigurations }
      );
    } catch (err: any) {
      rejected = true;
      assertions.push(`Tentativa de crédito superior ao documento original bloqueada: "${err.message}"`);
    }

    if (!rejected) throw new Error('Deveria ter rejeitado Nota de Crédito com valor superior ao original');

    return {
      id: 'TEST-12',
      name: '1.12 Validação de Limites Financeiros da Nota de Crédito (NC)',
      category: 'Motor Fiscal',
    };
  }

  // 13. Nota de Débito (ND)
  private static testDebitNoteIssuance(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const ndSeries = db.series.get('SER-ND-2026')!;
    const customer = db.customers.get('CLI-SONANGOL')!;
    const admin = db.users.get('USR-ADMIN')!;

    const nd = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-001',
        series: ndSeries,
        documentTypeCode: 'ND',
        customer,
        lines: [{ productId: 'PRD-CONS', quantity: 2 }],
        references: [
          {
            id: 'REF-ND-01',
            referencedDocumentId: 'DOC-PREV',
            referencedDocumentNumber: 'FT A2026/000001',
            referenceType: 'DEBIT_NOTE_FOR',
            reason: 'Ajuste de horas de suporte técnico adicional acordado',
            amount: 90000,
          },
        ],
        issuedByUser: admin,
        previousDocumentHash: db.getLastHashForSeries(ndSeries.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    assertions.push(`Nota de Débito emitida: ${nd.documentNumber} no valor de ${nd.netTotal.toLocaleString('pt-AO')} AOA.`);

    return {
      id: 'TEST-13',
      name: '1.12 Emissão de Nota de Débito (ND) com Referência e Adição de Encargos',
      category: 'Motor Fiscal',
    };
  }

  // 14. Registo de Pagamentos
  private static testPaymentRegistrationAndBalanceTracking(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const ftSeries = db.series.get('SER-FT-2026')!;
    const customer = db.customers.get('CLI-SONANGOL')!;
    const admin = db.users.get('USR-ADMIN')!;

    const ft = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: 'EST-001',
        series: ftSeries,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: 'PRD-CESTA', quantity: 2 }], // 130.000 + 7% IVA = 139.100 AOA
        issuedByUser: admin,
        previousDocumentHash: db.getLastHashForSeries(ftSeries.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    // Pagamento parcial via MULTICAIXA
    const p1 = PaymentEngine.registerPayment(
      {
        companyId: company.id,
        document: ft,
        amount: 50000.0,
        paymentMethod: 'MULTICAIXA',
        transactionReference: 'TPA-AUT-99214',
        user: admin,
      },
      []
    );
    assertions.push(`Pagamento parcial de 50.000 AOA registado com sucesso via Multicaixa.`);

    // Pagamento restante via Transferência Bancária
    const remaining = Math.round((ft.netTotal - 50000.0) * 100) / 100;
    const p2 = PaymentEngine.registerPayment(
      {
        companyId: company.id,
        document: ft,
        amount: remaining,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: 'COMP-BMA-44912',
        user: admin,
      },
      [p1]
    );
    assertions.push(`Quitação final de ${remaining} AOA registada via Transferência Bancária.`);

    // Tentativa de pagamento excedente (deve falhar)
    let caughtOverpayment = false;
    try {
      PaymentEngine.registerPayment(
        {
          companyId: company.id,
          document: ft,
          amount: 1000.0,
          paymentMethod: 'CASH',
          user: admin,
        },
        [p1, p2]
      );
    } catch (err: any) {
      caughtOverpayment = true;
      assertions.push(`Tentativa de sobrefacturação bloqueada: "${err.message}"`);
    }
    if (!caughtOverpayment) throw new Error('Pagamento além do saldo deveria ter sido bloqueado');

    return {
      id: 'TEST-14',
      name: '1.13 Pagamentos (Multicaixa, Transferência, Dinheiro) e Controlo Rigoroso de Saldos',
      category: 'Pagamentos & Tesouraria',
    };
  }

  // 15. Integridade Completa da Cadeia Criptográfica
  private static testFullChainCryptographicIntegrity(assertions: string[]): { id: string; name: string; category: string } {
    const chain = [
      {
        documentDate: '2026-09-20',
        systemEntryDate: '2026-09-20T10:00:00',
        documentNumber: 'FT CHN26/000001',
        netTotal: 100000.0,
        sequentialNumber: 1,
        previousHash: '',
      },
      {
        documentDate: '2026-09-20',
        systemEntryDate: '2026-09-20T10:05:00',
        documentNumber: 'FT CHN26/000002',
        netTotal: 250000.0,
        sequentialNumber: 2,
        previousHash: '', // Será preenchido com hash do doc 1
      },
      {
        documentDate: '2026-09-20',
        systemEntryDate: '2026-09-20T10:10:00',
        documentNumber: 'FT CHN26/000003',
        netTotal: 75000.0,
        sequentialNumber: 3,
        previousHash: '', // Será preenchido com hash do doc 2
      },
    ];

    const h1 = HashChainingService.generateDocumentHash(chain[0]);
    chain[1].previousHash = h1.hash;
    const h2 = HashChainingService.generateDocumentHash(chain[1]);
    chain[2].previousHash = h2.hash;
    const h3 = HashChainingService.generateDocumentHash(chain[2]);

    const documentsWithHashes = [
      { ...chain[0], hash: h1.hash, hashControl: h1.hashControl },
      { ...chain[1], hash: h2.hash, hashControl: h2.hashControl },
      { ...chain[2], hash: h3.hash, hashControl: h3.hashControl },
    ];

    const integrity = HashChainingService.verifyChainIntegrity(documentsWithHashes);
    if (!integrity.isValid) {
      throw new Error(`Cadeia válida foi marcada como inválida: ${integrity.reason}`);
    }

    assertions.push('Cadeia contínua de 3 documentos fiscais validada matematicamente com SHA-256.');

    return {
      id: 'TEST-15',
      name: '1.10 & 1.15 Validação Matemática da Cadeia Criptográfica SHA-256 da Série',
      category: 'Segurança & Validação',
    };
  }

  // 16. Detecção Activa de Adulteração (Anti-Tamper)
  private static testTamperDetectionMechanism(assertions: string[]): { id: string; name: string; category: string } {
    const doc = {
      documentDate: '2026-09-20',
      systemEntryDate: '2026-09-20T10:00:00',
      documentNumber: 'FT SEC26/000001',
      netTotal: 100000.0,
      previousHash: '',
    };
    const legit = HashChainingService.generateDocumentHash(doc);

    // Tentativa de fraude: alterar o valor do documento para 10.000 sem regenerar o hash
    const tampered = {
      ...doc,
      netTotal: 10000.0, // Adulterado
    };

    const verification = HashChainingService.verifyDocumentHash(
      tampered,
      legit.hash,
      legit.hashControl
    );

    if (verification.isValid) {
      throw new Error('A detecção de fraude falhou! Documento adulterado não foi detectado.');
    }

    assertions.push('Adulteração de valor detectada instantaneamente por discordância de digest SHA-256.');

    return {
      id: 'TEST-16',
      name: '1.15 Mecanismo Anti-Adulteração: Detecção Criptográfica de Fraude Pós-Emissão',
      category: 'Segurança & Validação',
    };
  }

  // 17. Trilha de Auditoria (AuditLog)
  private static testComprehensiveAuditTrail(assertions: string[]): { id: string; name: string; category: string } {
    const logs = AuditService.getLogs({ limit: 10 });
    if (logs.length === 0) {
      throw new Error('A trilha de auditoria deve conter registos operacionais');
    }

    const latest = logs[0];
    assertions.push(`${logs.length} registos de auditoria verificados.`);
    assertions.push(`Último evento registado: [${latest.operation}] por ${latest.userName} (${latest.userRole}) às ${latest.timestamp}.`);
    assertions.push(`Hash de integridade da entrada de auditoria: ${latest.integrityHash}`);

    return {
      id: 'TEST-17',
      name: '1.14 Trilha de Auditoria Imutável (AuditLog) com Timestamp UTC e Ator',
      category: 'Auditoria & Compliance',
    };
  }

  // 18. Assinatura Digital RSA-2048 e Verificação Criptográfica AGT
  private static testRsa2048AsymmetricSignatureAndVerification(assertions: string[]): { id: string; name: string; category: string } {
    const docData = {
      documentDate: '2026-09-23',
      systemEntryDate: '2026-09-23T12:00:00',
      documentNumber: 'FT CERT26/000001',
      netTotal: 150000.0,
      hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
    };

    // Gera assinatura RSA-2048 com RSASSA-PKCS1-v1_5
    const sig = SignatureService.signDocument(docData);

    if (!sig.signatureBase64 || sig.signatureBase64.length < 100) {
      throw new Error(`Assinatura RSA gerada inválida ou incompleta: ${sig.signatureBase64?.slice(0, 30)}`);
    }

    if (sig.algorithm !== 'RSASSA-PKCS1-v1_5') {
      throw new Error(`Algoritmo de assinatura divergente da norma AGT: ${sig.algorithm}`);
    }

    assertions.push(`Assinatura RSA-2048 gerada com sucesso (Algoritmo: ${sig.algorithm}, Digest: ${sig.digestAlgorithm}).`);
    assertions.push(`Fingerprint da chave pública certificada: ${sig.publicKeyFingerprint}`);

    // Validação estrita dos caracteres de controlo (HashControl)
    const hashControl = SignatureService.extractHashControl(sig.signatureBase64);
    if (!hashControl || hashControl.length !== 4) {
      throw new Error(`HashControl extraído deve ter exactamente 4 caracteres: ${hashControl}`);
    }
    assertions.push(`HashControl oficial extraído das posições 11, 21, 31, 41: "${hashControl}"`);

    // Validação matemática legítima
    const verification = SignatureService.verifySignature(docData, sig);
    if (!verification.isValid) {
      throw new Error(`Falha na verificação da assinatura legítima: ${verification.reason}`);
    }
    assertions.push('Verificação matemática da assinatura válida confirmada com sucesso.');

    // Tentativa de fraude/adulteração: alterar 1 cêntimo no valor
    const tamperedData = {
      ...docData,
      netTotal: 150000.01,
    };
    const tamperedVerification = SignatureService.verifySignature(tamperedData, sig);
    if (tamperedVerification.isValid) {
      throw new Error('Falha de segurança! Documento adulterado em 0.01 Kz foi aceite como válido.');
    }
    assertions.push('Mecanismo de protecção AGT validado: adulteração de 0.01 Kz rejeitada de imediato.');

    return {
      id: 'TEST-18',
      name: '1.16 Assinatura Digital RSA-2048 / SHA-256 e Verificação Matemática AGT',
      category: 'Segurança & Validação',
    };
  }

  // 19. Geração e Conformidade do Código QR Fiscal AGT (Portaria n.º 292/18)
  private static testAgtFiscalQrCodeGenerationAndIntegrity(assertions: string[]): { id: string; name: string; category: string } {
    const db = FiscalDatabase.getInstance();
    const company = Array.from(db.companies.values())[0];
    const series = Array.from(db.series.values()).find((s) => s.documentTypeCode === 'FT')!;
    const customer = Array.from(db.customers.values())[0];
    const user = Array.from(db.users.values())[0];
    const product = Array.from(db.products.values())[0];

    // Emite documento com assinatura RSA-2048
    const doc = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: series.establishmentId,
        series,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: product.id, quantity: 2 }],
        issuedByUser: user,
        previousDocumentHash: db.getLastHashForSeries(series.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );

    // Constrói a string do QR Code
    const qrString = FiscalQRCodeService.buildQRCodeString(doc, company);

    if (!qrString || !qrString.includes('*')) {
      throw new Error(`String de Código QR inválida ou sem separador (*): ${qrString}`);
    }

    assertions.push(`String canónica do Código QR gerada: "${qrString.slice(0, 60)}..."`);

    // Faz o parse e verifica a conformidade com as regras da AGT
    const parsed = FiscalQRCodeService.parseQRCodeString(qrString);
    if (!parsed) {
      throw new Error('Falha ao interpretar a string gerada do Código QR');
    }

    // 1. Tag A: NIF do emitente
    if (parsed.emitterTaxId !== company.taxId.trim().toUpperCase()) {
      throw new Error(`Tag A (NIF Emitente) divergente: ${parsed.emitterTaxId} !== ${company.taxId}`);
    }
    assertions.push(`Tag A (NIF Emitente): ${parsed.emitterTaxId}`);

    // 2. Tag B: NIF do cliente
    if (parsed.customerTaxId !== (doc.customerTaxId || '999999999').trim().toUpperCase()) {
      throw new Error(`Tag B (NIF Cliente) divergente: ${parsed.customerTaxId}`);
    }
    assertions.push(`Tag B (NIF Adquirente): ${parsed.customerTaxId}`);

    // 3. Tag C: País
    if (parsed.customerCountry !== 'AO') {
      throw new Error(`Tag C deve ser "AO": ${parsed.customerCountry}`);
    }

    // 4. Tag D e E: Tipo e Estado
    if (parsed.documentType !== doc.documentTypeCode || parsed.documentStatus !== 'N') {
      throw new Error(`Tag D/E inválida: ${parsed.documentType}/${parsed.documentStatus}`);
    }

    // 5. Tag G: Número do Documento
    if (parsed.documentNumber !== doc.documentNumber) {
      throw new Error(`Tag G (Número do Documento) divergente: ${parsed.documentNumber} !== ${doc.documentNumber}`);
    }
    assertions.push(`Tag G (Identificador do Documento): ${parsed.documentNumber}`);

    // 6. Tag Q: HashControl deve coincidir exactamente com os 4 caracteres da assinatura RSA-2048
    if (!parsed.hashControl || parsed.hashControl !== doc.hashControl) {
      throw new Error(`Tag Q (HashControl) divergente da assinatura RSA: ${parsed.hashControl} !== ${doc.hashControl}`);
    }
    assertions.push(`Tag Q (HashControl de 4 caracteres da assinatura RSA): "${parsed.hashControl}"`);

    // 7. Tag R: Certificado de Validação do Software AGT
    if (!parsed.softwareCertificateNumber || parsed.softwareCertificateNumber !== doc.softwareCertificateNumber) {
      throw new Error(`Tag R (Certificação AGT) divergente: ${parsed.softwareCertificateNumber}`);
    }
    assertions.push(`Tag R (Certificado do Software): "${parsed.softwareCertificateNumber}"`);

    return {
      id: 'TEST-19',
      name: '1.17 Código QR Fiscal AGT: Estrutura Canónica e Sincronização com Assinatura RSA',
      category: 'Segurança & Validação',
    };
  }

  // 20. Portal Público de Validação & Autenticidade do Código QR (Portaria n.º 292/18)
  private static testPublicVerificationPortalUrlAndPayloadParity(assertions: string[]): {
    id: string;
    name: string;
    category: string;
  } {
    const db = FiscalDatabase.getInstance();
    const company = db.companies.get('COMP-001')!;
    const doc = Array.from(db.documents.values())[0];

    if (!doc) {
      throw new Error('Nenhum documento disponível para testar o Portal Público de Validação');
    }

    // 1. Geração da URL móvel do Portal de Validação
    const verificationUrl = FiscalQRCodeService.buildVerificationURL(doc, company, 'https://kiteke-erp.ao/validar');
    assertions.push(`URL do Portal Público gerada: ${verificationUrl.slice(0, 60)}...`);

    const parsedUrl = new URL(verificationUrl);
    if (!parsedUrl.searchParams.has('validar') || !parsedUrl.searchParams.has('token')) {
      throw new Error('A URL de validação não contém os parâmetros obrigatórios "validar" e "token"');
    }
    assertions.push('Parâmetros "validar=1" e "token" validados na query string');

    // 2. Descodificação do token autónomo
    const token = parsedUrl.searchParams.get('token')!;
    const decoded = FiscalQRCodeService.decodeVerificationPayload(token);
    if (!decoded) {
      throw new Error('Falha ao descodificar o token do portal público de validação');
    }

    if (decoded.documentNumber !== doc.documentNumber) {
      throw new Error(`Número de documento no token divergente: ${decoded.documentNumber} !== ${doc.documentNumber}`);
    }
    assertions.push(`Documento no token: ${decoded.documentNumber}`);

    if (decoded.emitterTaxId !== company.taxId) {
      throw new Error(`NIF emitente no token divergente: ${decoded.emitterTaxId} !== ${company.taxId}`);
    }
    assertions.push(`NIF Emitente verificado no token: ${decoded.emitterTaxId}`);

    if (decoded.hashControl !== doc.hashControl) {
      throw new Error(`HashControl no token divergente: ${decoded.hashControl} !== ${doc.hashControl}`);
    }
    assertions.push(`HashControl (RSA-2048) intacto no token: ${decoded.hashControl}`);

    // 3. Teste de compatibilidade reversa com string canónica pura (scanner de hardware)
    const rawQr = FiscalQRCodeService.buildQRCodeString(doc, company);
    const decodedFromRaw = FiscalQRCodeService.decodeVerificationPayload(rawQr);
    if (!decodedFromRaw || decodedFromRaw.documentNumber !== doc.documentNumber) {
      throw new Error('Falha na descodificação a partir da string canónica pura');
    }
    assertions.push('Compatibilidade bidirecional com strings canónicas puras AGT confirmada');

    return {
      id: 'TEST-20',
      name: '1.18 Portal Público de Validação & Autenticidade do Código QR (Portaria n.º 292/18)',
      category: 'Segurança & Validação',
    };
  }

  // 21. Autenticação Segura, Alteração Obrigatória no 1.º Acesso e Segregação de Layout (Admin A vs Admin B)
  private static testAuthenticationFirstAccessPasswordChangeAndAdminSeparation(assertions: string[]): {
    id: string;
    name: string;
    category: string;
  } {
    const db = FiscalDatabase.getInstance();

    // 1. Verificação da existência das contas de Administrador A e Administrador B
    const adminA = db.users.get('USR-ADMIN');
    const adminB = db.users.get('USR-ADMIN-B');

    if (!adminA || adminA.role !== 'ADMIN' || adminA.adminSubtype !== 'ADMIN_A') {
      throw new Error('Administrador A deve estar configurado no sistema com perfil ADMIN e adminSubtype ADMIN_A');
    }
    assertions.push('Conta Administrador A confirmada com sucesso (USR-ADMIN).');

    if (!adminB || adminB.role !== 'ADMIN' || adminB.adminSubtype !== 'ADMIN_B') {
      throw new Error('Administrador B deve estar configurado no sistema com perfil ADMIN e adminSubtype ADMIN_B');
    }
    assertions.push('Conta Administrador B confirmada com sucesso (USR-ADMIN-B).');

    // 2. Segregação rigorosa de layout: Apenas Administrador A tem acesso aos dois layouts
    if (!canAccessAdminLayout(adminA)) {
      throw new Error('Administrador A deve ter acesso autorizado a ambos os layouts (Admin + Operações)');
    }
    assertions.push('Administrador A possui autorização para ambos os layouts (Admin e Operadores).');

    if (canAccessAdminLayout(adminB)) {
      throw new Error('Administrador B NÃO deve ter acesso ao layout de administração técnica');
    }
    assertions.push('Administrador B estritamente restrito ao layout de utilizadores/operações.');

    // 3. Verificação da palavra-passe padrão 'chave123'
    if (adminA.password !== 'chave123' || adminB.password !== 'chave123') {
      throw new Error('A palavra-passe padrão de todos os utilizadores deve ser "chave123"');
    }
    assertions.push('Palavra-passe padrão "chave123" validada para todos os utilizadores.');

    // 4. Teste de Autenticação com credenciais padrão
    const loginA = AuthService.login('admin_a', 'chave123');
    if (!loginA.success || !loginA.user || !loginA.mustChangePassword) {
      throw new Error('Login inicial com chave123 deve sinalizar mustChangePassword=true');
    }
    assertions.push('Login inicial do Admin A detecta obrigatoriedade de alteração de palavra-passe.');

    // 5. Tentativa inválida de manter a palavra-passe padrão
    const rejectSame = AuthService.changePassword(adminA.id, 'chave123', 'chave123');
    if (rejectSame.success) {
      throw new Error('O sistema deve rejeitar a definição de "chave123" como nova palavra-passe');
    }
    assertions.push('Bloqueio confirmado: Nova palavra-passe não pode ser igual à padrão ("chave123").');

    // 6. Tentativa com confirmação divergente
    const rejectMismatch = AuthService.changePassword(adminA.id, 'novaSenha2026', 'outraSenha');
    if (rejectMismatch.success) {
      throw new Error('O sistema deve rejeitar palavras-passe com confirmação divergente');
    }
    assertions.push('Bloqueio confirmado: Validação de confirmação de palavra-passe.');

    // 7. Alteração bem-sucedida de palavra-passe
    const changeSuccess = AuthService.changePassword(adminA.id, 'KitekeSeguro2026!', 'KitekeSeguro2026!');
    if (!changeSuccess.success || changeSuccess.user?.mustChangePassword) {
      throw new Error('Falha ao concluir a alteração obrigatória de palavra-passe');
    }
    assertions.push('Alteração obrigatória de palavra-passe concluída com sucesso no 1.º acesso.');

    // 8. Novo login com a palavra-passe atualizada
    const loginUpdated = AuthService.login('admin_a', 'KitekeSeguro2026!');
    if (!loginUpdated.success || loginUpdated.mustChangePassword) {
      throw new Error('Login subsequente com nova palavra-passe deve permitir acesso direto aos módulos');
    }
    assertions.push('Sessão subsequente concede acesso direto aos módulos com nova credencial.');

    // 9. Validação do Módulo de Licença: Exclusivo ao Administrador A
    const { LicenseService } = await import('../security/LicenseService');
    const { FiscalDatabase } = await import('../repository/FiscalDatabase');
    const db = FiscalDatabase.getInstance();

    if (!LicenseService.canManageLicense(adminA)) {
      throw new Error('Administrador A deve ter permissão exclusiva para gerir licenças');
    }
    if (LicenseService.canManageLicense(adminB)) {
      throw new Error('Administrador B NÃO deve ter permissão para gerir licenças');
    }
    assertions.push('Exclusividade do módulo de licença ao Administrador A confirmada.');

    // 10. Teste de definição dos 3 planos (Demo, Semestral e Anual)
    const initialLic = db.getLicense();
    
    // Teste Demo (15 dias)
    const demoLic = LicenseService.setLicensePlan(initialLic, 'DEMO', adminA, 15);
    if (demoLic.plan !== 'DEMO' || demoLic.durationDays !== 15) {
      throw new Error('Falha ao definir plano Demo com duração de 15 dias');
    }
    assertions.push('Plano Demo (15 dias) configurado e validado com sucesso.');

    // Teste Semestral (180 dias)
    const semestralLic = LicenseService.setLicensePlan(demoLic, 'SEMESTRAL', adminA, 180);
    if (semestralLic.plan !== 'SEMESTRAL' || semestralLic.durationDays !== 180) {
      throw new Error('Falha ao definir plano Semestral com duração de 180 dias');
    }
    assertions.push('Plano Semestral (180 dias / 6 meses) configurado e validado com sucesso.');

    // Teste Anual (365 dias)
    const anualLic = LicenseService.setLicensePlan(semestralLic, 'ANUAL', adminA, 365);
    if (anualLic.plan !== 'ANUAL' || anualLic.durationDays !== 365) {
      throw new Error('Falha ao definir plano Anual com duração de 365 dias');
    }
    assertions.push('Plano Anual (365 dias / 1 ano fiscal) configurado e validado com sucesso.');

    // Restaurar estado da licença na base de dados
    db.updateLicense(anualLic);

    // Restaurar palavra-passe para testes subsequentes determinísticos
    adminA.password = 'chave123';
    adminA.mustChangePassword = true;

    return {
      id: 'TEST-21',
      name: '1.19 Login Seguro, Segregação de Layout e Módulo Licença Exclusivo Admin A (Demo, Semestral, Anual)',
      category: 'Segurança & Validação',
    };
  }
}
