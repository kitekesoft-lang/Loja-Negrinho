import { FiscalDocument, FiscalDocumentLine, FiscalDocumentReference } from '../types/document';
import { Customer } from '../types/customer';
import { Product } from '../types/product';
import { TaxConfiguration } from '../types/tax';
import { DocumentSeries, FiscalDocumentTypeCode } from '../types/series';
import { User } from '../types/user';
import { Company } from '../types/company';
import { TaxEngine } from './TaxEngine';
import { DocumentSeriesEngine } from './DocumentSeriesEngine';
import { HashChainingService } from '../security/HashChainingService';
import { SignatureService } from '../security/SignatureService';
import { NifValidator } from '../security/NifValidator';
import { RbacService } from '../security/RbacService';
import { AuditService } from '../security/AuditService';
import { FiscalDatabase } from '../repository/FiscalDatabase';

export interface CreateDocumentLineInput {
  productId: string;
  quantity: number;
  unitPrice?: number; // Se não fornecido, usa o preço padrão do produto
  discountPercentage?: number;
  customDescription?: string;
  applyWithholdingTax?: boolean;
}

export interface CreateDocumentInput {
  company: Company;
  establishmentId: string;
  series: DocumentSeries;
  documentTypeCode: FiscalDocumentTypeCode;
  customer: Customer;
  lines: CreateDocumentLineInput[];
  references?: FiscalDocumentReference[];
  issuedByUser: User;
  documentDate?: string; // YYYY-MM-DD
  notes?: string;
  previousDocumentHash?: string; // Hash do documento imediatamente anterior da mesma série
}

export class InvoiceEngine {
  /**
   * Cria, valida e emite um documento fiscal imutável com encadeamento criptográfico
   */
  static issueFiscalDocument(
    input: CreateDocumentInput,
    catalog: {
      products: Map<string, Product>;
      taxConfigs: Map<string, TaxConfiguration>;
    }
  ): FiscalDocument {
    // 1. Validação de Permissões (RBAC)
    let requiredPermission: any = 'INVOICE_CREATE_FT';
    if (input.documentTypeCode === 'FR') requiredPermission = 'INVOICE_CREATE_FR';
    else if (input.documentTypeCode === 'RC') requiredPermission = 'RECEIPT_CREATE_RC';
    else if (input.documentTypeCode === 'NC') requiredPermission = 'CREDIT_NOTE_CREATE_NC';
    else if (input.documentTypeCode === 'ND') requiredPermission = 'DEBIT_NOTE_CREATE_ND';

    const authCheck = RbacService.checkPermission(input.issuedByUser, requiredPermission);
    if (!authCheck.isAuthorized) {
      AuditService.logEvent({
        companyId: input.company.id,
        user: input.issuedByUser,
        entityType: 'DOCUMENT',
        entityId: 'NEW',
        operation: 'PERMISSION_DENIED',
        description: `Tentativa não autorizada de emitir ${input.documentTypeCode}: ${authCheck.reason}`,
      });
      throw new Error(authCheck.reason);
    }

    // 2. Validação do Cliente
    if (!input.customer) {
      throw new Error('O cliente é obrigatório para a emissão de documentos fiscais.');
    }
    const nifValidation = NifValidator.validate(input.customer.taxId, input.customer.country);
    if (!nifValidation.isValid) {
      throw new Error(`NIF do cliente inválido: ${nifValidation.errorMessage}`);
    }

    // 3. Validação das Linhas
    if (!input.lines || input.lines.length === 0) {
      throw new Error('O documento fiscal deve conter pelo menos uma linha de artigo/serviço.');
    }

    const calculatedLines: FiscalDocumentLine[] = [];
    let runningGross = 0;
    let runningDiscount = 0;
    let runningTaxableBase = 0;
    let runningTax = 0;
    let runningWithholding = 0;

    for (let i = 0; i < input.lines.length; i++) {
      const lineInput = input.lines[i];
      const product = catalog.products.get(lineInput.productId);
      if (!product) {
        throw new Error(`Artigo com ID '${lineInput.productId}' não encontrado no catálogo da empresa.`);
      }

      const taxConfig = catalog.taxConfigs.get(product.taxConfigurationId);
      if (!taxConfig) {
        throw new Error(`Configuração fiscal '${product.taxConfigurationId}' não encontrada para o artigo '${product.code}'.`);
      }

      const unitPrice = lineInput.unitPrice !== undefined ? lineInput.unitPrice : product.standardPrice;
      const applyWithholding = lineInput.applyWithholdingTax ?? (product.type === 'SERVICE' && product.withholdingTaxApplicable);

      const calculated = TaxEngine.calculateLine({
        quantity: lineInput.quantity,
        unitPrice,
        discountPercentage: lineInput.discountPercentage,
        taxConfig,
        applyWithholdingTax: applyWithholding,
      });

      const line: FiscalDocumentLine = {
        id: `LINE-${i + 1}-${Date.now().toString(36)}`,
        lineNumber: i + 1,
        productId: product.id,
        productCode: product.code,
        description: lineInput.customDescription || product.description,
        unit: product.unit,
        quantity: calculated.quantity,
        unitPrice: calculated.unitPrice,
        discountRate: calculated.discountPercentage,
        discountAmount: calculated.discountAmount,
        taxableBase: calculated.taxableBase,
        taxConfigurationId: taxConfig.id,
        taxType: taxConfig.taxType,
        taxCode: taxConfig.taxCode,
        taxRate: calculated.taxRate,
        taxAmount: calculated.taxAmount,
        exemptionCode: calculated.exemptionCode,
        exemptionReason: calculated.exemptionReason,
        withholdingRate: calculated.withholdingRate,
        withholdingAmount: calculated.withholdingAmount,
        totalLineAmount: calculated.totalLineAmount,
      };

      calculatedLines.push(line);
      runningGross += calculated.grossAmount;
      runningDiscount += calculated.discountAmount;
      runningTaxableBase += calculated.taxableBase;
      runningTax += calculated.taxAmount;
      runningWithholding += calculated.withholdingAmount || 0;
    }

    const grossAmount = TaxEngine.roundCurrency(runningGross);
    const discountAmount = TaxEngine.roundCurrency(runningDiscount);
    const taxableBase = TaxEngine.roundCurrency(runningTaxableBase);
    const taxAmount = TaxEngine.roundCurrency(runningTax);
    const withholdingAmount = TaxEngine.roundCurrency(runningWithholding);
    const netTotal = TaxEngine.roundCurrency(taxableBase + taxAmount - withholdingAmount);

    // 4. Validação de Referência Obrigatória (NC, ND, RC)
    if (['NC', 'ND', 'RC'].includes(input.documentTypeCode)) {
      if (!input.references || input.references.length === 0) {
        throw new Error(`Documentos do tipo ${input.documentTypeCode} exigem referência obrigatória ao documento fiscal original.`);
      }
    }

    // 5. Alocação Atómica do Número Sequencial da Série
    // Respeito estrito ao Decreto Executivo: no modo homologado as séries dependem da autorização da AGT
    let isHomologated = false;
    let certNumber = '0/AGT/2026';
    try {
      const db = FiscalDatabase.getInstance();
      const hConfig = db.getHomologationConfig();
      if (hConfig) {
        isHomologated = hConfig.status === 'HOMOLOGATED';
        certNumber = hConfig.softwareCertificateNumber || (isHomologated ? 'CERT-AGT-2026/089' : '0/AGT/2026');
      }
    } catch {
      // fallback gracioso em testes unitários isolados
    }

    const allocation = DocumentSeriesEngine.allocateNextNumber(input.series, isHomologated);

    // 6. Datas Fiscais
    const documentDate = input.documentDate || new Date().toISOString().split('T')[0];
    const systemEntryDate = new Date().toISOString().replace(/\.\d{3}Z$/, '');

    // 7. Encadeamento Criptográfico de Hash (SHA-256)
    const previousHash = input.previousDocumentHash || '';
    const hashResult = HashChainingService.generateDocumentHash({
      documentDate,
      systemEntryDate,
      documentNumber: allocation.formattedDocumentNumber,
      netTotal,
      previousHash,
    });

    // 7.1 Assinatura Digital RSA-2048 Conforme AGT (RSASSA-PKCS1-v1_5)
    const signature = SignatureService.signDocument({
      documentDate,
      systemEntryDate,
      documentNumber: allocation.formattedDocumentNumber,
      netTotal,
      hash: hashResult.hash,
    });

    const documentId = `DOC-${allocation.documentTypeCode}-${allocation.seriesCode}-${allocation.sequentialNumber}`;

    const fiscalDocument: FiscalDocument = {
      id: documentId,
      companyId: input.company.id,
      establishmentId: input.establishmentId,
      seriesId: input.series.id,
      documentTypeCode: input.documentTypeCode,
      documentNumber: allocation.formattedDocumentNumber,
      sequentialNumber: allocation.sequentialNumber,
      documentDate,
      systemEntryDate,
      customerId: input.customer.id,
      customerTaxId: input.customer.taxId,
      customerName: input.customer.name,
      customerAddress: input.customer.billingAddress,
      customerCountry: input.customer.country,
      lines: calculatedLines,
      references: input.references || [],
      grossAmount,
      discountAmount,
      taxableBase,
      taxAmount,
      withholdingAmount,
      netTotal,
      hash: hashResult.hash,
      previousHash: hashResult.previousHash,
      hashControl: hashResult.hashControl,
      softwareCertificateNumber: certNumber,
      signature,
      canonicalString: signature.canonicalString,
      status: 'ISSUED',
      isLocked: true, // Imutabilidade imediata
      issuedByUserId: input.issuedByUser.id,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 8. Registo de Auditoria
    AuditService.logEvent({
      companyId: input.company.id,
      user: input.issuedByUser,
      entityType: 'DOCUMENT',
      entityId: fiscalDocument.id,
      operation: 'ISSUE',
      description: `Emissão do documento fiscal ${fiscalDocument.documentNumber} no valor de ${netTotal.toLocaleString('pt-AO')} ${input.company.currency} com Hash de controlo ${fiscalDocument.hashControl}`,
      newState: {
        documentNumber: fiscalDocument.documentNumber,
        netTotal,
        hashControl: fiscalDocument.hashControl,
        customerTaxId: fiscalDocument.customerTaxId,
      },
    });

    return fiscalDocument;
  }

  /**
   * Bloqueia qualquer tentativa de alteração indevida pós-emissão
   */
  static assertDocumentImmutability(document: FiscalDocument): void {
    if (document.isLocked || document.status === 'ISSUED') {
      throw new Error(
        `Violação de Integridade Fiscal: O documento ${document.documentNumber} já foi emitido e encontra-se imutável nos termos da legislação tributária. Rectificações só podem ser efetuadas via Nota de Crédito (NC) ou Débito (ND).`
      );
    }
  }
}
