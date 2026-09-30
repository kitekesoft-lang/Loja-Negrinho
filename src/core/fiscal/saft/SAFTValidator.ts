import { SAFTAuditFile, SAFTValidationResult, SAFTValidationIssue } from '../types/saft';

export class SAFTValidator {
  public static validate(auditFile: SAFTAuditFile): SAFTValidationResult {
    const issues: SAFTValidationIssue[] = [];

    // ==========================================
    // 1. VALIDAÇÃO DO HEADER
    // ==========================================
    const h = auditFile.header;
    if (!h.auditFileVersion || (h.auditFileVersion !== '0.1.01' && h.auditFileVersion !== '1.01_01')) {
      issues.push({
        severity: 'ERROR',
        code: 'SAFT_ERR_001',
        section: 'HEADER',
        field: 'AuditFileVersion',
        message: 'Versão do ficheiro SAF-T inválida. Deve ser 0.1.01 ou 1.01_01 para Angola.',
      });
    }

    if (!h.taxRegistrationNumber || h.taxRegistrationNumber.trim().length < 8) {
      issues.push({
        severity: 'ERROR',
        code: 'SAFT_ERR_002',
        section: 'HEADER',
        field: 'TaxRegistrationNumber',
        message: 'NIF da empresa no cabeçalho é obrigatório e deve ter formato válido.',
      });
    }

    if (h.taxAccountingBasis !== 'F') {
      issues.push({
        severity: 'ERROR',
        code: 'SAFT_ERR_003',
        section: 'HEADER',
        field: 'TaxAccountingBasis',
        message: 'Para SAF-T de facturação o campo TaxAccountingBasis deve ser estritamente "F".',
      });
    }

    if (!h.companyAddress?.country || h.companyAddress.country !== 'AO') {
      issues.push({
        severity: 'WARNING',
        code: 'SAFT_WARN_001',
        section: 'HEADER',
        field: 'Country',
        message: 'O país da empresa declarante deve ser "AO" (Angola).',
      });
    }

    if (new Date(h.startDate) > new Date(h.endDate)) {
      issues.push({
        severity: 'ERROR',
        code: 'SAFT_ERR_004',
        section: 'HEADER',
        field: 'StartDate/EndDate',
        message: 'A data inicial do período fiscal não pode ser posterior à data final.',
      });
    }

    if (h.currencyCode !== 'AOA') {
      issues.push({
        severity: 'ERROR',
        code: 'SAFT_ERR_016',
        section: 'HEADER',
        field: 'CurrencyCode',
        message: 'A moeda do ficheiro de auditoria deve ser obrigatoriamente "AOA" (Kwanza angolano).',
      });
    }

    // ==========================================
    // 2. VALIDAÇÃO DOS MASTERFILES
    // ==========================================
    const mf = auditFile.masterFiles;
    const customerIdSet = new Set<string>();
    for (const c of mf.customers) {
      customerIdSet.add(c.customerID);
      if (!c.customerTaxID) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_005',
          section: 'CUSTOMERS',
          field: 'CustomerTaxID',
          message: `Cliente ${c.companyName} (${c.customerID}) não tem NIF preenchido.`,
        });
      }
    }

    const productCodeSet = new Set<string>();
    for (const p of mf.products) {
      productCodeSet.add(p.productCode);
      if (!['P', 'S'].includes(p.productType)) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_006',
          section: 'PRODUCTS',
          field: 'ProductType',
          message: `Produto ${p.productCode} tem ProductType inválido (${p.productType}). Deve ser 'P' ou 'S'.`,
        });
      }
    }

    const taxCodeSet = new Set<string>();
    for (const t of mf.taxTable) {
      taxCodeSet.add(t.taxCode);
      if (t.taxCountryRegion !== 'AO') {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_007',
          section: 'TAX_TABLE',
          field: 'TaxCountryRegion',
          message: `Código de imposto ${t.taxCode} deve referenciar a região fiscal 'AO'.`,
        });
      }
    }

    // ==========================================
    // 3. VALIDAÇÃO DE SALES INVOICES & INTEGRIDADE DE CÁLCULO
    // ==========================================
    let totalSalesDebit = 0;
    let totalSalesCredit = 0;
    let totalTaxPayable = 0;
    let totalGrossSales = 0;
    let invoiceCount = 0;

    const invoices = auditFile.sourceDocuments.salesInvoices?.invoice || [];
    invoiceCount = invoices.length;

    for (const inv of invoices) {
      // Verificação de Integridade Referencial do Cliente
      if (!customerIdSet.has(inv.customerID)) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_008',
          section: 'SALES_INVOICES',
          field: 'CustomerID',
          documentReference: inv.invoiceNo,
          message: `Factura ${inv.invoiceNo} referencia cliente '${inv.customerID}' não existente no catálogo de clientes MasterFiles.`,
        });
      }

      // Verificação da Sintaxe Oficial de Numeração do Documento (Portaria n.º 292/18)
      const invoiceNoRegex = /^([A-Z]{2})\s+([A-Za-z0-9_\-]+)\/(\d+)$/;
      if (!invoiceNoRegex.test(inv.invoiceNo)) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_017',
          section: 'SALES_INVOICES',
          field: 'InvoiceNo',
          documentReference: inv.invoiceNo,
          message: `Estrutura de numeração de factura inválida: "${inv.invoiceNo}". Deve seguir a norma "Tipo Série/Número" (ex: FT A2026/000001).`,
        });
      }

      // Validação do Período Contabilístico (Mês 1 a 12)
      if (inv.period < 1 || inv.period > 12) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_018',
          section: 'SALES_INVOICES',
          field: 'Period',
          documentReference: inv.invoiceNo,
          message: `Período contabilístico inválido (${inv.period}) na factura ${inv.invoiceNo}. Deve ser entre 1 e 12.`,
        });
      }

      // Validação do Tipo de Documento Fiscal Autorizado
      if (!['FT', 'FR', 'NC', 'ND', 'RC'].includes(inv.invoiceType)) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_019',
          section: 'SALES_INVOICES',
          field: 'InvoiceType',
          documentReference: inv.invoiceNo,
          message: `Tipo de documento não reconhecido: "${inv.invoiceType}". Tipos válidos: FT, FR, NC, ND, RC.`,
        });
      }

      // Verificação da Assinatura/Hash
      if (!inv.hash || inv.hash.length < 10) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_009',
          section: 'SALES_INVOICES',
          field: 'Hash',
          documentReference: inv.invoiceNo,
          message: `Factura ${inv.invoiceNo} não possui hash de assinatura digital válido.`,
        });
      }

      if (!inv.hashControl || inv.hashControl.length !== 4) {
        issues.push({
          severity: 'WARNING',
          code: 'SAFT_WARN_002',
          section: 'SALES_INVOICES',
          field: 'HashControl',
          documentReference: inv.invoiceNo,
          message: `HashControl da factura ${inv.invoiceNo} deve conter exactamente 4 caracteres.`,
        });
      }

      // Verificação das Linhas da Factura
      let sumLinesNet = 0;
      let sumLinesTax = 0;

      for (const line of inv.lines) {
        if (!productCodeSet.has(line.productCode)) {
          issues.push({
            severity: 'ERROR',
            code: 'SAFT_ERR_010',
            section: 'SALES_INVOICES',
            field: 'ProductCode',
            documentReference: inv.invoiceNo,
            message: `Linha ${line.lineNumber} da factura ${inv.invoiceNo} referencia produto '${line.productCode}' não cadastrado em MasterFiles.`,
          });
        }

        if (!taxCodeSet.has(line.tax.taxCode)) {
          issues.push({
            severity: 'ERROR',
            code: 'SAFT_ERR_011',
            section: 'SALES_INVOICES',
            field: 'TaxCode',
            documentReference: inv.invoiceNo,
            message: `Linha ${line.lineNumber} da factura ${inv.invoiceNo} usa código de taxa '${line.tax.taxCode}' não registado na TaxTable.`,
          });
        }

        // Se Isento de IVA (taxPercentage === 0 ou TaxCode === 'ISE'), ExemptionReason e ExemptionCode são obrigatórios
        if (line.tax.taxPercentage === 0 || line.tax.taxCode === 'ISE') {
          if (!line.taxExemptionCode || !line.taxExemptionReason) {
            issues.push({
              severity: 'ERROR',
              code: 'SAFT_ERR_012',
              section: 'SALES_INVOICES',
              field: 'TaxExemptionReason',
              documentReference: inv.invoiceNo,
              message: `Linha ${line.lineNumber} da factura ${inv.invoiceNo} está isenta de IVA mas não especifica TaxExemptionCode ou TaxExemptionReason legal.`,
            });
          }
        }

        const lineAmount = (line.creditAmount || 0) + (line.debitAmount || 0);
        sumLinesNet += lineAmount;
        if (line.tax.taxPercentage && line.tax.taxPercentage > 0) {
          sumLinesTax += (lineAmount * line.tax.taxPercentage) / 100;
        }
      }

      // Verificação de Coerência Matemática dos Totais
      const calculatedGross = Number((inv.documentTotals.netTotal + inv.documentTotals.taxPayable).toFixed(2));
      const declaredGross = Number(inv.documentTotals.grossTotal.toFixed(2));
      const difference = Math.abs(calculatedGross - declaredGross);

      if (difference > 0.05) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_013',
          section: 'SALES_INVOICES',
          field: 'DocumentTotals',
          documentReference: inv.invoiceNo,
          message: `Incoerência na factura ${inv.invoiceNo}: NetTotal (${inv.documentTotals.netTotal}) + TaxPayable (${inv.documentTotals.taxPayable}) difere de GrossTotal (${inv.documentTotals.grossTotal}).`,
        });
      }

      if (inv.documentStatus.invoiceStatus !== 'A') {
        if (inv.invoiceType === 'NC') {
          totalSalesDebit += inv.documentTotals.grossTotal;
        } else {
          totalSalesCredit += inv.documentTotals.grossTotal;
        }
        totalTaxPayable += inv.documentTotals.taxPayable;
        totalGrossSales += inv.documentTotals.grossTotal;
      }
    }

    // Validação de Totais Globais do Bloco SalesInvoices
    if (auditFile.sourceDocuments.salesInvoices) {
      const declaredDebit = auditFile.sourceDocuments.salesInvoices.totalDebit;
      const declaredCredit = auditFile.sourceDocuments.salesInvoices.totalCredit;

      if (Math.abs(declaredDebit - Number(totalSalesDebit.toFixed(2))) > 0.05) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_014',
          section: 'SALES_INVOICES',
          field: 'TotalDebit',
          message: `TotalDebit declarado (${declaredDebit}) não confere com o somatório dos documentos rectificativos/NC (${totalSalesDebit.toFixed(2)}).`,
        });
      }

      if (Math.abs(declaredCredit - Number(totalSalesCredit.toFixed(2))) > 0.05) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_015',
          section: 'SALES_INVOICES',
          field: 'TotalCredit',
          message: `TotalCredit declarado (${declaredCredit}) não confere com o somatório das facturas de crédito/venda (${totalSalesCredit.toFixed(2)}).`,
        });
      }
    }

    // ==========================================
    // 4. VALIDAÇÃO DOS PAGAMENTOS (RECEIPTS)
    // ==========================================
    const payments = auditFile.sourceDocuments.payments?.payment || [];
    for (const pmt of payments) {
      if (!customerIdSet.has(pmt.customerID)) {
        issues.push({
          severity: 'ERROR',
          code: 'SAFT_ERR_016',
          section: 'PAYMENTS',
          field: 'CustomerID',
          documentReference: pmt.paymentRefNo,
          message: `Recibo ${pmt.paymentRefNo} referencia cliente '${pmt.customerID}' não existente em MasterFiles.`,
        });
      }
    }

    const errors = issues.filter((i) => i.severity === 'ERROR');
    const warnings = issues.filter((i) => i.severity === 'WARNING');

    return {
      isValid: errors.length === 0,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      issues,
      metrics: {
        customerCount: mf.customers.length,
        productCount: mf.products.length,
        invoiceCount,
        paymentCount: payments.length,
        totalSalesDebit: Number(totalSalesDebit.toFixed(2)),
        totalSalesCredit: Number(totalSalesCredit.toFixed(2)),
        totalTaxPayable: Number(totalTaxPayable.toFixed(2)),
        totalGrossSales: Number(totalGrossSales.toFixed(2)),
      },
    };
  }
}
