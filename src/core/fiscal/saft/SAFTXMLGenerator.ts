import { SAFTAuditFile } from '../types/saft';

export class SAFTXMLGenerator {
  public static generateXML(auditFile: SAFTAuditFile): string {
    const xmlParts: string[] = [];

    // Header XML padrão UTF-8
    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlParts.push(
      '<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    );

    // 1. Header
    const h = auditFile.header;
    xmlParts.push('  <Header>');
    xmlParts.push(`    <AuditFileVersion>${this.escapeXml(h.auditFileVersion)}</AuditFileVersion>`);
    xmlParts.push(`    <CompanyID>${this.escapeXml(h.companyID)}</CompanyID>`);
    xmlParts.push(`    <TaxRegistrationNumber>${this.escapeXml(h.taxRegistrationNumber)}</TaxRegistrationNumber>`);
    xmlParts.push(`    <TaxAccountingBasis>${this.escapeXml(h.taxAccountingBasis)}</TaxAccountingBasis>`);
    xmlParts.push(`    <CompanyName>${this.escapeXml(h.companyName)}</CompanyName>`);
    if (h.businessName) {
      xmlParts.push(`    <BusinessName>${this.escapeXml(h.businessName)}</BusinessName>`);
    }
    xmlParts.push('    <CompanyAddress>');
    xmlParts.push(`      <AddressDetail>${this.escapeXml(h.companyAddress.addressDetail)}</AddressDetail>`);
    xmlParts.push(`      <City>${this.escapeXml(h.companyAddress.city)}</City>`);
    xmlParts.push(`      <Province>${this.escapeXml(h.companyAddress.province)}</Province>`);
    xmlParts.push(`      <PostalCode>${this.escapeXml(h.companyAddress.postalCode)}</PostalCode>`);
    xmlParts.push(`      <Country>${this.escapeXml(h.companyAddress.country)}</Country>`);
    xmlParts.push('    </CompanyAddress>');
    xmlParts.push(`    <FiscalYear>${h.fiscalYear}</FiscalYear>`);
    xmlParts.push(`    <StartDate>${h.startDate}</StartDate>`);
    xmlParts.push(`    <EndDate>${h.endDate}</EndDate>`);
    xmlParts.push(`    <CurrencyCode>${h.currencyCode}</CurrencyCode>`);
    xmlParts.push(`    <DateCreated>${h.dateCreated}</DateCreated>`);
    xmlParts.push(`    <TaxEntity>${this.escapeXml(h.taxEntity)}</TaxEntity>`);
    xmlParts.push(`    <ProductCompanyTaxID>${this.escapeXml(h.productCompanyTaxID)}</ProductCompanyTaxID>`);
    xmlParts.push(`    <SoftwareValidationNumber>${this.escapeXml(h.softwareValidationNumber)}</SoftwareValidationNumber>`);
    xmlParts.push(`    <ProductID>${this.escapeXml(h.productID)}</ProductID>`);
    xmlParts.push(`    <ProductVersion>${this.escapeXml(h.productVersion)}</ProductVersion>`);
    if (h.headerComment) {
      xmlParts.push(`    <HeaderComment>${this.escapeXml(h.headerComment)}</HeaderComment>`);
    }
    if (h.telephone) {
      xmlParts.push(`    <Telephone>${this.escapeXml(h.telephone)}</Telephone>`);
    }
    if (h.email) {
      xmlParts.push(`    <Email>${this.escapeXml(h.email)}</Email>`);
    }
    if (h.website) {
      xmlParts.push(`    <Website>${this.escapeXml(h.website)}</Website>`);
    }
    xmlParts.push('  </Header>');

    // 2. MasterFiles
    const mf = auditFile.masterFiles;
    xmlParts.push('  <MasterFiles>');

    // Customers
    for (const c of mf.customers) {
      xmlParts.push('    <Customer>');
      xmlParts.push(`      <CustomerID>${this.escapeXml(c.customerID)}</CustomerID>`);
      xmlParts.push(`      <AccountID>${this.escapeXml(c.accountID)}</AccountID>`);
      xmlParts.push(`      <CustomerTaxID>${this.escapeXml(c.customerTaxID)}</CustomerTaxID>`);
      xmlParts.push(`      <CompanyName>${this.escapeXml(c.companyName)}</CompanyName>`);
      xmlParts.push('      <BillingAddress>');
      xmlParts.push(`        <AddressDetail>${this.escapeXml(c.billingAddress.addressDetail)}</AddressDetail>`);
      xmlParts.push(`        <City>${this.escapeXml(c.billingAddress.city)}</City>`);
      xmlParts.push(`        <PostalCode>${this.escapeXml(c.billingAddress.postalCode)}</PostalCode>`);
      xmlParts.push(`        <Country>${this.escapeXml(c.billingAddress.country)}</Country>`);
      xmlParts.push('      </BillingAddress>');
      xmlParts.push(`      <SelfBillingIndicator>${c.selfBillingIndicator}</SelfBillingIndicator>`);
      xmlParts.push('    </Customer>');
    }

    // Products
    for (const p of mf.products) {
      xmlParts.push('    <Product>');
      xmlParts.push(`      <ProductType>${p.productType}</ProductType>`);
      xmlParts.push(`      <ProductCode>${this.escapeXml(p.productCode)}</ProductCode>`);
      xmlParts.push(`      <ProductGroup>${this.escapeXml(p.productGroup)}</ProductGroup>`);
      xmlParts.push(`      <ProductDescription>${this.escapeXml(p.productDescription)}</ProductDescription>`);
      xmlParts.push(`      <ProductNumberCode>${this.escapeXml(p.productNumberCode)}</ProductNumberCode>`);
      xmlParts.push('    </Product>');
    }

    // TaxTable
    xmlParts.push('    <TaxTable>');
    for (const t of mf.taxTable) {
      xmlParts.push('      <TaxTableEntry>');
      xmlParts.push(`        <TaxType>${t.taxType}</TaxType>`);
      xmlParts.push(`        <TaxCountryRegion>${t.taxCountryRegion}</TaxCountryRegion>`);
      xmlParts.push(`        <TaxCode>${t.taxCode}</TaxCode>`);
      xmlParts.push(`        <Description>${this.escapeXml(t.description)}</Description>`);
      if (t.taxPercentage !== undefined) {
        xmlParts.push(`        <TaxPercentage>${t.taxPercentage.toFixed(2)}</TaxPercentage>`);
      }
      xmlParts.push('      </TaxTableEntry>');
    }
    xmlParts.push('    </TaxTable>');
    xmlParts.push('  </MasterFiles>');

    // 3. SourceDocuments
    xmlParts.push('  <SourceDocuments>');

    // SalesInvoices
    if (auditFile.sourceDocuments.salesInvoices) {
      const si = auditFile.sourceDocuments.salesInvoices;
      xmlParts.push('    <SalesInvoices>');
      xmlParts.push(`      <NumberOfEntries>${si.numberOfEntries}</NumberOfEntries>`);
      xmlParts.push(`      <TotalDebit>${si.totalDebit.toFixed(2)}</TotalDebit>`);
      xmlParts.push(`      <TotalCredit>${si.totalCredit.toFixed(2)}</TotalCredit>`);

      for (const inv of si.invoice) {
        xmlParts.push('      <Invoice>');
        xmlParts.push(`        <InvoiceNo>${this.escapeXml(inv.invoiceNo)}</InvoiceNo>`);
        xmlParts.push('        <DocumentStatus>');
        xmlParts.push(`          <InvoiceStatus>${inv.documentStatus.invoiceStatus}</InvoiceStatus>`);
        xmlParts.push(`          <InvoiceStatusDate>${inv.documentStatus.invoiceStatusDate}</InvoiceStatusDate>`);
        xmlParts.push(`          <SourceID>${this.escapeXml(inv.documentStatus.sourceID)}</SourceID>`);
        xmlParts.push(`          <SourceBilling>${inv.documentStatus.sourceBilling}</SourceBilling>`);
        xmlParts.push('        </DocumentStatus>');
        xmlParts.push(`        <Hash>${inv.hash}</Hash>`);
        xmlParts.push(`        <HashControl>${inv.hashControl}</HashControl>`);
        xmlParts.push(`        <Period>${inv.period}</Period>`);
        xmlParts.push(`        <InvoiceDate>${inv.invoiceDate}</InvoiceDate>`);
        xmlParts.push(`        <InvoiceType>${inv.invoiceType}</InvoiceType>`);
        xmlParts.push('        <SpecialRegimes>');
        xmlParts.push(`          <SelfBillingIndicator>${inv.specialRegimes.selfBillingIndicator}</SelfBillingIndicator>`);
        xmlParts.push(`          <CashVATSchemeIndicator>${inv.specialRegimes.cashVATSchemeIndicator}</CashVATSchemeIndicator>`);
        xmlParts.push(`          <ThirdPartiesBillingIndicator>${inv.specialRegimes.thirdPartiesBillingIndicator}</ThirdPartiesBillingIndicator>`);
        xmlParts.push('        </SpecialRegimes>');
        xmlParts.push(`        <SourceID>${this.escapeXml(inv.sourceID)}</SourceID>`);
        xmlParts.push(`        <SystemEntryDate>${inv.systemEntryDate}</SystemEntryDate>`);
        xmlParts.push(`        <CustomerID>${this.escapeXml(inv.customerID)}</CustomerID>`);

        // Lines
        for (const line of inv.lines) {
          xmlParts.push('        <Line>');
          xmlParts.push(`          <LineNumber>${line.lineNumber}</LineNumber>`);
          xmlParts.push(`          <ProductCode>${this.escapeXml(line.productCode)}</ProductCode>`);
          xmlParts.push(`          <ProductDescription>${this.escapeXml(line.productDescription)}</ProductDescription>`);
          xmlParts.push(`          <Quantity>${line.quantity}</Quantity>`);
          xmlParts.push(`          <UnitOfMeasure>${this.escapeXml(line.unitOfMeasure)}</UnitOfMeasure>`);
          xmlParts.push(`          <UnitPrice>${line.unitPrice.toFixed(2)}</UnitPrice>`);
          xmlParts.push(`          <TaxPointDate>${line.taxPointDate}</TaxPointDate>`);
          xmlParts.push(`          <Description>${this.escapeXml(line.description)}</Description>`);
          if (line.debitAmount !== undefined) {
            xmlParts.push(`          <DebitAmount>${line.debitAmount.toFixed(2)}</DebitAmount>`);
          }
          if (line.creditAmount !== undefined) {
            xmlParts.push(`          <CreditAmount>${line.creditAmount.toFixed(2)}</CreditAmount>`);
          }
          xmlParts.push('          <Tax>');
          xmlParts.push(`            <TaxType>${line.tax.taxType}</TaxType>`);
          xmlParts.push(`            <TaxCountryRegion>${line.tax.taxCountryRegion}</TaxCountryRegion>`);
          xmlParts.push(`            <TaxCode>${line.tax.taxCode}</TaxCode>`);
          if (line.tax.taxPercentage !== undefined) {
            xmlParts.push(`            <TaxPercentage>${line.tax.taxPercentage.toFixed(2)}</TaxPercentage>`);
          }
          xmlParts.push('          </Tax>');
          if (line.taxExemptionReason) {
            xmlParts.push(`          <TaxExemptionReason>${this.escapeXml(line.taxExemptionReason)}</TaxExemptionReason>`);
          }
          if (line.taxExemptionCode) {
            xmlParts.push(`          <TaxExemptionCode>${this.escapeXml(line.taxExemptionCode)}</TaxExemptionCode>`);
          }
          if (line.settlementAmount !== undefined) {
            xmlParts.push(`          <SettlementAmount>${line.settlementAmount.toFixed(2)}</SettlementAmount>`);
          }
          xmlParts.push('        </Line>');
        }

        // DocumentTotals
        xmlParts.push('        <DocumentTotals>');
        xmlParts.push(`          <TaxPayable>${inv.documentTotals.taxPayable.toFixed(2)}</TaxPayable>`);
        xmlParts.push(`          <NetTotal>${inv.documentTotals.netTotal.toFixed(2)}</NetTotal>`);
        xmlParts.push(`          <GrossTotal>${inv.documentTotals.grossTotal.toFixed(2)}</GrossTotal>`);
        xmlParts.push('        </DocumentTotals>');

        // WithholdingTax
        if (inv.withholdingTax) {
          xmlParts.push('        <WithholdingTax>');
          xmlParts.push(`          <WithholdingTaxType>${inv.withholdingTax.withholdingTaxType}</WithholdingTaxType>`);
          xmlParts.push(`          <WithholdingTaxDescription>${this.escapeXml(inv.withholdingTax.withholdingTaxDescription)}</WithholdingTaxDescription>`);
          xmlParts.push(`          <WithholdingTaxAmount>${inv.withholdingTax.withholdingTaxAmount.toFixed(2)}</WithholdingTaxAmount>`);
          xmlParts.push('        </WithholdingTax>');
        }

        xmlParts.push('      </Invoice>');
      }

      xmlParts.push('    </SalesInvoices>');
    }

    // Payments
    if (auditFile.sourceDocuments.payments && auditFile.sourceDocuments.payments.numberOfEntries > 0) {
      const pmts = auditFile.sourceDocuments.payments;
      xmlParts.push('    <Payments>');
      xmlParts.push(`      <NumberOfEntries>${pmts.numberOfEntries}</NumberOfEntries>`);
      xmlParts.push(`      <TotalDebit>${pmts.totalDebit.toFixed(2)}</TotalDebit>`);
      xmlParts.push(`      <TotalCredit>${pmts.totalCredit.toFixed(2)}</TotalCredit>`);

      for (const p of pmts.payment) {
        xmlParts.push('      <Payment>');
        xmlParts.push(`        <PaymentRefNo>${this.escapeXml(p.paymentRefNo)}</PaymentRefNo>`);
        xmlParts.push(`        <Period>${p.period}</Period>`);
        xmlParts.push(`        <TransactionDate>${p.transactionDate}</TransactionDate>`);
        xmlParts.push(`        <PaymentType>${p.paymentType}</PaymentType>`);
        xmlParts.push(`        <Description>${this.escapeXml(p.description)}</Description>`);
        xmlParts.push('        <DocumentStatus>');
        xmlParts.push(`          <PaymentStatus>${p.documentStatus.paymentStatus}</PaymentStatus>`);
        xmlParts.push(`          <PaymentStatusDate>${p.documentStatus.paymentStatusDate}</PaymentStatusDate>`);
        xmlParts.push(`          <SourceID>${this.escapeXml(p.documentStatus.sourceID)}</SourceID>`);
        xmlParts.push(`          <SourcePayment>${p.documentStatus.sourcePayment}</SourcePayment>`);
        xmlParts.push('        </DocumentStatus>');
        xmlParts.push('        <PaymentMethod>');
        xmlParts.push(`          <PaymentMechanism>${p.paymentMethod.paymentMechanism}</PaymentMechanism>`);
        xmlParts.push(`          <PaymentAmount>${p.paymentMethod.paymentAmount.toFixed(2)}</PaymentAmount>`);
        xmlParts.push(`          <PaymentDate>${p.paymentMethod.paymentDate}</PaymentDate>`);
        xmlParts.push('        </PaymentMethod>');
        xmlParts.push(`        <SourceID>${this.escapeXml(p.sourceID)}</SourceID>`);
        xmlParts.push(`        <SystemEntryDate>${p.systemEntryDate}</SystemEntryDate>`);
        xmlParts.push(`        <CustomerID>${this.escapeXml(p.customerID)}</CustomerID>`);

        for (const line of p.line) {
          xmlParts.push('        <Line>');
          xmlParts.push(`          <LineNumber>${line.lineNumber}</LineNumber>`);
          xmlParts.push('          <SourceDocumentID>');
          xmlParts.push(`            <OriginatingON>${this.escapeXml(line.sourceDocumentID.originatingON)}</OriginatingON>`);
          xmlParts.push(`            <InvoiceDate>${line.sourceDocumentID.invoiceDate}</InvoiceDate>`);
          xmlParts.push(`            <Description>${this.escapeXml(line.sourceDocumentID.description)}</Description>`);
          xmlParts.push('          </SourceDocumentID>');
          xmlParts.push(`          <CreditAmount>${line.creditAmount.toFixed(2)}</CreditAmount>`);
          xmlParts.push('        </Line>');
        }

        xmlParts.push('        <DocumentTotals>');
        xmlParts.push(`          <TaxPayable>${p.documentTotals.taxPayable.toFixed(2)}</TaxPayable>`);
        xmlParts.push(`          <NetTotal>${p.documentTotals.netTotal.toFixed(2)}</NetTotal>`);
        xmlParts.push(`          <GrossTotal>${p.documentTotals.grossTotal.toFixed(2)}</GrossTotal>`);
        xmlParts.push('        </DocumentTotals>');

        xmlParts.push('      </Payment>');
      }

      xmlParts.push('    </Payments>');
    }

    xmlParts.push('  </SourceDocuments>');
    xmlParts.push('</AuditFile>');

    return xmlParts.join('\n');
  }

  private static escapeXml(unsafe: string | null | undefined): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
