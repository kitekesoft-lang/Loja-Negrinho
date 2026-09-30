import { AGTTransmissionQueue } from '../engines/AGTTransmissionQueue';
import { AGTConnector } from '../engines/AGTConnector';
import { SignatureService } from '../security/SignatureService';
import { FiscalDatabase } from '../repository/FiscalDatabase';
import { InvoiceEngine } from '../engines/InvoiceEngine';
import { FiscalDocument } from '../types/document';

export interface Phase2TestResult {
  id: string;
  category: 'SIGNATURE' | 'CONNECTOR' | 'IDEMPOTENCY' | 'QUEUE' | 'CONTINGENCY';
  name: string;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
  executionTimeMs: number;
}

export class Phase2TestSuite {
  public static async runAllTests(): Promise<{
    results: Phase2TestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      durationMs: number;
    };
  }> {
    const startTime = performance.now();
    const results: Phase2TestResult[] = [];
    const db = FiscalDatabase.getInstance();

    const company = db.companies.get('COMP-001') || Array.from(db.companies.values())[0];
    const customer = db.customers.get('CUST-002') || Array.from(db.customers.values())[0];
    const series = db.series.get('SER-FT-2026') || Array.from(db.series.values()).find(s => s.documentTypeCode === 'FT') || Array.from(db.series.values())[0];
    const user = db.users.get('USR-ADMIN') || Array.from(db.users.values())[0];

    if (!series) {
      throw new Error('Nenhuma série de facturação disponível para executar a suíte de testes.');
    }

    const product = db.products.get('PRD-ERP') || Array.from(db.products.values())[0];
    if (!product) {
      throw new Error('Nenhum artigo disponível no catálogo para executar a suíte de testes.');
    }

    // Documento auxiliar para testes
    const doc = InvoiceEngine.issueFiscalDocument(
      {
        company,
        establishmentId: series.establishmentId,
        series,
        documentTypeCode: 'FT',
        customer,
        lines: [{ productId: product.id, quantity: 1, discountPercentage: 0 }],
        issuedByUser: user,
        previousDocumentHash: db.getLastHashForSeries(series.id),
      },
      { products: db.products, taxConfigs: db.taxConfigurations }
    );
    db.documents.set(doc.id, doc);

    // ==========================================
    // 1. TESTES DE ASSINATURA DIGITAL RSA
    // ==========================================
    const t1Start = performance.now();
    const signature = SignatureService.signDocument({
      documentDate: doc.documentDate,
      systemEntryDate: doc.systemEntryDate,
      documentNumber: doc.documentNumber,
      netTotal: doc.netTotal,
      hash: doc.hash,
    });

    const verifyOriginal = SignatureService.verifySignature(
      {
        documentDate: doc.documentDate,
        systemEntryDate: doc.systemEntryDate,
        documentNumber: doc.documentNumber,
        netTotal: doc.netTotal,
        hash: doc.hash,
      },
      signature
    );

    results.push({
      id: 'PH2-TEST-01',
      category: 'SIGNATURE',
      name: 'Geração e Verificação de Assinatura RSA-2048 / SHA-256',
      description: 'Valida se o SignatureService assina o bloco canónico e verifica com sucesso a integridade da chave pública.',
      passed: verifyOriginal.isValid && signature.algorithm === 'RSASSA-PKCS1-v1_5',
      expected: 'isValid: true, Algoritmo: RSASSA-PKCS1-v1_5',
      actual: `isValid: ${verifyOriginal.isValid}, Algoritmo: ${signature.algorithm}`,
      executionTimeMs: Math.round(performance.now() - t1Start),
    });

    const t2Start = performance.now();
    // Simula tentativa de adulteração de valor após assinado
    const verifyTampered = SignatureService.verifySignature(
      {
        documentDate: doc.documentDate,
        systemEntryDate: doc.systemEntryDate,
        documentNumber: doc.documentNumber,
        netTotal: doc.netTotal + 5000, // Adulterado
        hash: doc.hash,
      },
      signature
    );

    results.push({
      id: 'PH2-TEST-02',
      category: 'SIGNATURE',
      name: 'Rejeição de Assinatura Digital Adulterada',
      description: 'Verifica se qualquer divergência nos campos do documento canónico invalida a assinatura digital.',
      passed: !verifyTampered.isValid,
      expected: 'isValid: false (Assinatura RSA Rejeitada)',
      actual: `isValid: ${verifyTampered.isValid} (${verifyTampered.reason || 'Rejeitado'})`,
      executionTimeMs: Math.round(performance.now() - t2Start),
    });

    // ==========================================
    // 2. TESTES DE AGT CONNECTOR (HOMOLOGAÇÃO & PRODUÇÃO)
    // ==========================================
    const t3Start = performance.now();
    const homolConnector = new AGTConnector('HOMOLOGATION', { networkLatencyMs: 10 });
    const prodConnector = new AGTConnector('PRODUCTION', { networkLatencyMs: 10 });

    results.push({
      id: 'PH2-TEST-03',
      category: 'CONNECTOR',
      name: 'Isolamento de Ambientes (Homologação vs Produção)',
      description: 'Garante que os endpoints de Web Services da AGT são rigorosamente segregados por ambiente.',
      passed:
        homolConnector.getCredentials().apiBaseUrl.includes('homologacao') &&
        prodConnector.getCredentials().apiBaseUrl.includes('webservices'),
      expected: 'Endpoints distintos para Homologação e Produção',
      actual: `Homol: ${homolConnector.getCredentials().apiBaseUrl} | Prod: ${prodConnector.getCredentials().apiBaseUrl}`,
      executionTimeMs: Math.round(performance.now() - t3Start),
    });

    const t4Start = performance.now();
    const payload = {
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      documentTypeCode: doc.documentTypeCode,
      seriesCode: doc.seriesId,
      fiscalYear: new Date(doc.documentDate).getFullYear(),
      documentDate: doc.documentDate,
      systemEntryDate: doc.systemEntryDate,
      customerTaxId: doc.customerTaxId,
      customerName: doc.customerName,
      grossTotal: doc.grossAmount,
      taxTotal: doc.taxAmount,
      withholdingTaxTotal: doc.withholdingAmount,
      netTotal: doc.netTotal,
      hash: doc.hash,
      hashControl: doc.hashControl,
      previousHash: doc.previousHash,
      linesCount: doc.lines.length,
      signature,
    };

    let receipt: any = null;
    let transmitSuccess = false;
    try {
      receipt = await homolConnector.transmitDocument(payload, `IDEMP-${Date.now()}-TEST-1`);
      transmitSuccess = receipt.status === 'ACCEPTED' && receipt.receiptNumber.startsWith('REC-AGT-');
    } catch (err: any) {
      transmitSuccess = false;
    }

    results.push({
      id: 'PH2-TEST-04',
      category: 'CONNECTOR',
      name: 'Transmissão Oficial e Emissão de Recibo AGT com Selo Digital',
      description: 'Valida a recepção da factura pelo Web Service AGT, validação de assinatura e devolução de recibo oficial.',
      passed: transmitSuccess,
      expected: 'status: ACCEPTED com recibo REC-AGT-* e digitalSeal',
      actual: `status: ${receipt?.status}, Recibo: ${receipt?.receiptNumber}, Selo: ${receipt?.digitalSeal?.slice(0, 16)}...`,
      executionTimeMs: Math.round(performance.now() - t4Start),
    });

    // ==========================================
    // 3. TESTE DE IDEMPOTÊNCIA E PREVENÇÃO DE DUPLICAÇÃO
    // ==========================================
    const t5Start = performance.now();
    const idempotencyKey = `IDEMP-SAME-KEY-${Date.now()}`;
    const firstReceipt = await homolConnector.transmitDocument(payload, idempotencyKey);
    const secondReceipt = await homolConnector.transmitDocument(payload, idempotencyKey);

    const isIdempotent =
      firstReceipt.receiptNumber === secondReceipt.receiptNumber &&
      firstReceipt.digitalSeal === secondReceipt.digitalSeal &&
      secondReceipt.responseDescription.includes('Idempotência Confirmada');

    results.push({
      id: 'PH2-TEST-05',
      category: 'IDEMPOTENCY',
      name: 'Idempotência Estrita de Transmissão à AGT',
      description: 'Garante que submissões repetidas com a mesma IdempotencyKey devolvem o mesmo recibo sem duplicar na AGT.',
      passed: isIdempotent,
      expected: 'Mesmo recibo e selo digital devolvidos com identificador de idempotência',
      actual: `Primeiro: ${firstReceipt.receiptNumber} | Segundo: ${secondReceipt.receiptNumber}`,
      executionTimeMs: Math.round(performance.now() - t5Start),
    });

    // ==========================================
    // 4. TESTES DE FILA ASSÍNCRONA E RETRY COM BACKOFF
    // ==========================================
    const t6Start = performance.now();
    const testQueue = new AGTTransmissionQueue(new AGTConnector('HOMOLOGATION', { networkLatencyMs: 5 }));
    const queuedItem = testQueue.enqueueDocument(doc);

    results.push({
      id: 'PH2-TEST-06',
      category: 'QUEUE',
      name: 'Enfileiramento Automático com Assinatura RSA Embutida',
      description: 'Verifica se a fila de transmissão gera o item, calcula a assinatura digital e prepara os metadados.',
      passed: queuedItem.status === 'QUEUED' && queuedItem.payload.signature.algorithm === 'RSASSA-PKCS1-v1_5',
      expected: 'Item com status QUEUED e assinatura pronta',
      actual: `Item ${queuedItem.id} status: ${queuedItem.status}`,
      executionTimeMs: Math.round(performance.now() - t6Start),
    });

    const t7Start = performance.now();
    const queueProcessResult = await testQueue.processQueue();
    const processedItem = testQueue.getById(queuedItem.id);

    results.push({
      id: 'PH2-TEST-07',
      category: 'QUEUE',
      name: 'Processamento Exitoso da Fila Assíncrona',
      description: 'Processa o documento enfileirado, regista recibo e transita o estado para ACCEPTED.',
      passed:
        queueProcessResult.succeeded === 1 &&
        processedItem?.status === 'ACCEPTED' &&
        !!processedItem?.response?.receiptNumber,
      expected: 'Item com status ACCEPTED e recibo atribuído',
      actual: `Status: ${processedItem?.status}, Recibo: ${processedItem?.response?.receiptNumber}`,
      executionTimeMs: Math.round(performance.now() - t7Start),
    });

    // ==========================================
    // 5. TESTES DE CONTINGÊNCIA: TIMEOUT, RETRY E BACKOFF EXPONENCIAL
    // ==========================================
    const t8Start = performance.now();
    const failingConnector = new AGTConnector('HOMOLOGATION', {
      networkLatencyMs: 5,
      simulateTimeout: true,
    });
    const contingencyQueue = new AGTTransmissionQueue(failingConnector);
    const failItem = contingencyQueue.enqueueDocument(doc);

    await contingencyQueue.processQueue();
    const itemAfterFail = contingencyQueue.getById(failItem.id);

    const passedContingency =
      itemAfterFail?.status === 'FAILED_CONTINGENCY' &&
      itemAfterFail?.attempts === 1 &&
      itemAfterFail?.backoffDelayMs === 1000 &&
      !!itemAfterFail?.nextRetryAt;

    results.push({
      id: 'PH2-TEST-08',
      category: 'CONTINGENCY',
      name: 'Tolerância a Falhas: Activação de Modo de Contingência & Backoff',
      description: 'Simula queda de rede ou timeout da AGT e valida a transição para FAILED_CONTINGENCY com backoff exponencial.',
      passed: passedContingency,
      expected: 'Status FAILED_CONTINGENCY, tentativas: 1, backoffDelayMs: 1000ms',
      actual: `Status: ${itemAfterFail?.status}, Tentativa: ${itemAfterFail?.attempts}, Backoff: ${itemAfterFail?.backoffDelayMs}ms`,
      executionTimeMs: Math.round(performance.now() - t8Start),
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
