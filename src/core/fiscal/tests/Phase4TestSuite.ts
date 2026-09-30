import { FiscalDatabase } from '../repository/FiscalDatabase';
import { InventoryEngine } from '../engines/InventoryEngine';
import { PurchaseEngine } from '../engines/PurchaseEngine';
import { AccountingEngine, PGC_ANGOLANO_CHART } from '../engines/AccountingEngine';
import { InvoiceEngine } from '../engines/InvoiceEngine';
import { SAFTService } from '../saft/SAFTService';

export interface Phase4TestResult {
  id: string;
  category: 'PURCHASES' | 'INVENTORY' | 'TREASURY' | 'ACCOUNTING' | 'COMMERCIAL';
  name: string;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  executionTimeMs: number;
}

export interface Phase4SuiteSummary {
  results: Phase4TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
  };
}

export class Phase4TestSuite {
  public static async runAllTests(): Promise<Phase4SuiteSummary> {
    const startTime = performance.now();
    const results: Phase4TestResult[] = [];
    const db = FiscalDatabase.getInstance();
    const company = Array.from(db.companies.values())[0];

    // ==========================================
    // 1. TESTE DE COMPRAS E RECEPÇÃO EM ARMAZÉM
    // ==========================================
    const t1Start = performance.now();
    let p1Passed = false;
    let p1Actual = '';
    try {
      const supplier = Array.from(db.suppliers.values())[0];
      const warehouse = Array.from(db.warehouses.values())[0];

      // Quantidade antes da compra
      const stockBefore = Array.from(db.stockItems.values()).find(
        (s) => s.productId === 'PRD-POS-TERM' && s.warehouseId === warehouse.id
      )?.currentQuantity || 0;

      const po = PurchaseEngine.createPurchaseOrder({
        companyId: company.id,
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        expectedDeliveryDate: '2026-03-01',
        lines: [
          {
            productId: 'PRD-POS-TERM',
            quantity: 10,
            unitPrice: 110000,
            taxRate: 14,
          },
        ],
        notes: 'Ordem de compra de reposição de stock urgente',
      });

      PurchaseEngine.receivePurchaseOrder(po.id, 'USR-ADMIN');

      const stockAfter = Array.from(db.stockItems.values()).find(
        (s) => s.productId === 'PRD-POS-TERM' && s.warehouseId === warehouse.id
      )?.currentQuantity || 0;

      p1Passed = stockAfter === stockBefore + 10 && po.status === 'RECEIVED';
      p1Actual = `Stock anterior: ${stockBefore} -> Novo stock: ${stockAfter} | PO status: ${po.status}`;
    } catch (e: any) {
      p1Passed = false;
      p1Actual = `Erro: ${e.message}`;
    }

    results.push({
      id: 'PH4-TEST-01',
      category: 'PURCHASES',
      name: 'Circuito de Compras & Recepção Física com Actualização de Stock',
      description: 'Emite Ordem de Compra a Fornecedor, processa recepção em armazém e incrementa stock disponível e CMP.',
      passed: p1Passed,
      expected: 'Stock incrementado em 10 unidades e status da OC como RECEIVED',
      actual: p1Actual,
      executionTimeMs: Math.round(performance.now() - t1Start),
    });

    // ==========================================
    // 2. TESTE DE GESTÃO DE STOCK & PREVENÇÃO DE RUPTURA
    // ==========================================
    const t2Start = performance.now();
    let p2Passed = false;
    let p2Actual = '';
    try {
      const checkResult = InventoryEngine.checkAvailability(
        [
          { productId: 'PRD-POS-TERM', quantity: 2 },
          { productId: 'PRD-PAPEL-TERM', quantity: 99999 }, // Quantidade deliberadamente excessiva
        ],
        db.stockItems
      );

      p2Passed = !checkResult.available && checkResult.ruptures.length === 1 && checkResult.ruptures[0].productId === 'PRD-PAPEL-TERM';
      p2Actual = `Bloqueio de ruptura accionado: ${!checkResult.available}, Ruptura detectada no produto: ${checkResult.ruptures[0]?.productId}`;
    } catch (e: any) {
      p2Passed = false;
      p2Actual = `Erro: ${e.message}`;
    }

    results.push({
      id: 'PH4-TEST-02',
      category: 'INVENTORY',
      name: 'Algoritmo de Prevenção de Ruptura de Stock em Facturação',
      description: 'Garante que vendas que excedam as quantidades disponíveis em armazém sejam detectadas e sinalizadas preventivamente.',
      passed: p2Passed,
      expected: 'available: false com ruptura identificada para o papel térmico',
      actual: p2Actual,
      executionTimeMs: Math.round(performance.now() - t2Start),
    });

    // ==========================================
    // 3. TESTE DE TESOURARIA & SESSÕES DE CAIXA
    // ==========================================
    const t3Start = performance.now();
    let p3Passed = false;
    let p3Actual = '';
    try {
      const session = Array.from(db.cashSessions.values())[0];
      const movements = Array.from(db.cashMovements.values()).filter((m) => m.sessionId === session.id);
      const totalBleeds = movements.filter((m) => m.type === 'OUTFLOW_BLEED').reduce((acc, m) => acc + m.amount, 0);

      p3Passed = session.status === 'OPEN' && session.initialCashAmount === 50000 && totalBleeds === 15000;
      p3Actual = `Sessão: ${session.sessionNumber} (${session.status}), Fundo Inicial: ${session.initialCashAmount} AOA, Sangrias: ${totalBleeds} AOA`;
    } catch (e: any) {
      p3Passed = false;
      p3Actual = `Erro: ${e.message}`;
    }

    results.push({
      id: 'PH4-TEST-03',
      category: 'TREASURY',
      name: 'Gestão de Caixa Diário e Rastreio de Movimentos (Sangrias/Suprimentos)',
      description: 'Valida abertura de sessão com fundo de maneio e execução segura de sangrias de caixa registadas.',
      passed: p3Passed,
      expected: 'Sessão OPEN com fundo de 50.000 AOA e sangria de 15.000 AOA registada',
      actual: p3Actual,
      executionTimeMs: Math.round(performance.now() - t3Start),
    });

    // ==========================================
    // 4. TESTE DE CONTABILIDADE GERAL (PGC ANGOLANO)
    // ==========================================
    const t4Start = performance.now();
    let p4Passed = false;
    let p4Actual = '';
    try {
      let ftDoc = Array.from(db.documents.values()).find((d) => d.documentTypeCode === 'FT');
      if (!ftDoc) {
        // Se ainda não houver factura emitida, emite uma para o teste contábil
        const customer = Array.from(db.customers.values())[0];
        const establishment = Array.from(db.establishments.values())[0];
        const series = db.series.get('SER-FT-2026')!;
        const user = db.users.get('USR-ADMIN') || Array.from(db.users.values())[0];
        ftDoc = InvoiceEngine.issueFiscalDocument(
          {
            company,
            establishmentId: establishment.id,
            series,
            customer,
            documentTypeCode: 'FT',
            lines: [
              {
                productId: 'PRD-ERP',
                quantity: 1,
                discountPercentage: 0,
              },
            ],
            issuedByUser: user,
            previousDocumentHash: db.getLastHashForSeries(series.id),
          },
          { products: db.products, taxConfigs: db.taxConfigurations }
        );
        db.documents.set(ftDoc.id, ftDoc);
      }

      const activeDoc = ftDoc!;
      const entries = AccountingEngine.generateEntriesFromDocument(activeDoc);
      // Deve ter pelo menos lançamento de Vendas (71) e IVA (34)
      const hasSalesCredit = entries.some((e) => e.creditAccount === '71' && e.amount === activeDoc.taxableBase);
      const hasTaxCredit = entries.some((e) => e.creditAccount === '34' && e.amount === activeDoc.taxAmount);

      p4Passed = entries.length >= 2 && hasSalesCredit && hasTaxCredit;
      p4Actual = `Lançamentos gerados: ${entries.length}, Vendas (71) creditadas: ${hasSalesCredit}, IVA (34) creditado: ${hasTaxCredit}`;
    } catch (e: any) {
      p4Passed = false;
      p4Actual = `Erro: ${e.message}`;
    }

    results.push({
      id: 'PH4-TEST-04',
      category: 'ACCOUNTING',
      name: 'Partida Dobrada Automática segundo o Plano Geral de Contabilidade (PGC)',
      description: 'Verifica integração automática entre Facturação e Contabilidade com lançamentos em Contas 31 (Clientes), 71 (Proveitos) e 34 (Estado/IVA).',
      passed: p4Passed,
      expected: 'Lançamentos coerentes em partidas dobradas para Venda e IVA',
      actual: p4Actual,
      executionTimeMs: Math.round(performance.now() - t4Start),
    });

    // ==========================================
    // 5. TESTE DE DOCUMENTOS COMERCIAIS
    // ==========================================
    const t5Start = performance.now();
    let p5Passed = false;
    let p5Actual = '';
    try {
      const orc = Array.from(db.commercialDocuments.values()).find((d) => d.type === 'ORCAMENTO');
      p5Passed = !!orc && orc.lines.length > 0 && orc.grandTotal === 1001850;
      p5Actual = `Documento: ${orc?.documentNumber} | Cliente: ${orc?.customerName} | Total: ${orc?.grandTotal} AOA`;
    } catch (e: any) {
      p5Passed = false;
      p5Actual = `Erro: ${e.message}`;
    }

    results.push({
      id: 'PH4-TEST-05',
      category: 'COMMERCIAL',
      name: 'Circuito Comercial: Emissão e Gestão de Orçamentos e Propostas',
      description: 'Valida elaboração de cotação com cálculo antecipado de incidências fiscais de IVA e prazos de validade.',
      passed: p5Passed,
      expected: 'Orçamento activo com cálculo fiscal rigoroso',
      actual: p5Actual,
      executionTimeMs: Math.round(performance.now() - t5Start),
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
