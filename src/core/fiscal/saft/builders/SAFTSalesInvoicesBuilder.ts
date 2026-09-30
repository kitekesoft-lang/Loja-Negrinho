import { FiscalDocument } from '../../types/document';
import { SAFTSalesInvoices, SAFTInvoice, SAFTInvoiceLine, SAFTDocumentType } from '../../types/saft';

export class SAFTSalesInvoicesBuilder {
  public static build(documents: FiscalDocument[]): SAFTSalesInvoices {
    // Filtra apenas documentos comerciais faturáveis (FT, FR, NC, ND)
    const salesDocs = documents.filter((d) =>
      ['FT', 'FR', 'NC', 'ND'].includes(d.documentTypeCode)
    );

    let totalDebit = 0;
    let totalCredit = 0;

    const invoices: SAFTInvoice[] = salesDocs.map((doc) => {
      const isCreditNote = doc.documentTypeCode === 'NC';
      const isCancelled = doc.status === 'CANCELLED';

      // Status da Factura: N = Normal, A = Anulado, R = Recuperação
      const invoiceStatus: 'N' | 'A' | 'R' | 'F' = isCancelled ? 'A' : 'N';

      // Mapeamento de Linhas
      const lines: SAFTInvoiceLine[] = doc.lines.map((line) => {
        const lineDebit = isCreditNote ? line.taxableBase : undefined;
        const lineCredit = !isCreditNote ? line.taxableBase : undefined;

        return {
          lineNumber: line.lineNumber,
          productCode: line.productCode,
          productDescription: line.description,
          quantity: line.quantity,
          unitOfMeasure: line.unit,
          unitPrice: line.unitPrice,
          taxPointDate: doc.documentDate,
          description: line.description,
          debitAmount: lineDebit,
          creditAmount: lineCredit,
          tax: {
            taxType: 'IVA',
            taxCountryRegion: 'AO',
            taxCode: line.taxCode,
            taxPercentage: line.taxRate,
          },
          taxExemptionReason: line.exemptionReason,
          taxExemptionCode: line.exemptionCode,
          settlementAmount: line.discountAmount > 0 ? line.discountAmount : undefined,
        };
      });

      // No SAF-T (AO), GrossTotal = NetTotal (taxableBase) + TaxPayable
      // Retenções na fonte (WithholdingTax) são informadas em bloco próprio e não abatem do GrossTotal
      const saftGrossTotal = Number((doc.taxableBase + doc.taxAmount).toFixed(2));

      // Actualiza totais de débito / crédito do lote
      if (!isCancelled) {
        if (isCreditNote) {
          totalDebit += saftGrossTotal;
        } else {
          totalCredit += saftGrossTotal;
        }
      }

      // Determinação do Período Fiscal (Mês de 1 a 12)
      const docDate = new Date(doc.documentDate);
      const period = docDate.getMonth() + 1;

      // No SAF-T (AO), o nó <Hash> armazena a assinatura RSA Base64 oficial (ou o hash criptográfico)
      const officialHash = doc.signature?.signatureBase64 || doc.hash;

      const invoice: SAFTInvoice = {
        invoiceNo: doc.documentNumber,
        documentStatus: {
          invoiceStatus,
          invoiceStatusDate: doc.systemEntryDate,
          sourceID: doc.issuedByUserId,
          sourceBilling: 'P',
        },
        hash: officialHash,
        hashControl: doc.hashControl,
        period,
        invoiceDate: doc.documentDate,
        invoiceType: doc.documentTypeCode as SAFTDocumentType,
        specialRegimes: {
          selfBillingIndicator: 0,
          cashVATSchemeIndicator: 0,
          thirdPartiesBillingIndicator: 0,
        },
        sourceID: doc.issuedByUserId,
        systemEntryDate: doc.systemEntryDate,
        customerID: doc.customerId,
        lines,
        documentTotals: {
          taxPayable: doc.taxAmount,
          netTotal: doc.taxableBase,
          grossTotal: saftGrossTotal,
        },
      };

      if (doc.withholdingAmount > 0) {
        invoice.withholdingTax = {
          withholdingTaxType: 'II', // Imposto Industrial Retido na Fonte
          withholdingTaxDescription: 'Retenção na Fonte de Imposto Industrial 6.5%',
          withholdingTaxAmount: doc.withholdingAmount,
        };
      }

      return invoice;
    });

    return {
      numberOfEntries: invoices.length,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      invoice: invoices,
    };
  }
}
