import QRCode from 'qrcode';
import { FiscalDocument } from '../types/document';
import { Company } from '../types/company';

export interface AGTFiscalQRCodePayload {
  emitterTaxId: string; // A: NIF do emitente
  customerTaxId: string; // B: NIF do adquirente
  customerCountry: string; // C: País do adquirente
  documentType: string; // D: Tipo de documento (FT, FR, NC, ND, RC)
  documentStatus: 'N' | 'A' | 'R' | 'F'; // E: Estado do documento
  documentDate: string; // F: Data no formato YYYYMMDD
  documentNumber: string; // G: Identificação única (ex: FT A2026/000001)
  atcudOrSeries: string; // H: ATCUD ou Código de Série
  taxRegion: string; // I1: Região fiscal (AO)
  taxableBase: number; // I7: Base tributável (incidência)
  taxAmount: number; // I8: Montante de IVA
  grossTotal: number; // N: Total com impostos
  withholdingAmount?: number; // O: Retenção na fonte (se aplicável)
  hashControl: string; // Q: 4 Caracteres de controlo da assinatura RSA-2048
  softwareCertificateNumber: string; // R: Número de validação do software AGT
}

export interface PublicVerificationItem {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface PublicVerificationData {
  documentNumber: string;
  documentTypeCode: string;
  seriesId: string;
  documentDate: string;
  documentTime?: string;
  status: 'NORMAL' | 'CANCELLED';
  // Emitente
  emitterName: string;
  emitterTaxId: string;
  emitterAddress?: string;
  emitterCity?: string;
  taxRegime?: string;
  // Adquirente
  customerName?: string;
  customerTaxId: string;
  customerAddress?: string;
  // Totais Fiscais
  taxableBase: number;
  taxAmount: number;
  withholdingAmount?: number;
  netTotal: number;
  grossTotal: number;
  // Segurança & Criptografia RSA-2048
  hashControl: string;
  hash: string;
  signatureBase64?: string;
  signatureAlgorithm?: string;
  softwareCertificateNumber: string;
  // Itens
  items?: PublicVerificationItem[];
  // String canónica da AGT
  canonicalString: string;
}

// Funções utilitárias seguras para codificação UTF-8 Base64
function utf8ToBase64(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch {
    return '';
  }
}

function base64ToUtf8(b64: string): string {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(b64), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  } catch {
    return '';
  }
}

export class FiscalQRCodeService {
  /**
   * Constrói a string canónica oficial do Código QR da AGT (Angola)
   * Formato chave:valor separado por asteriscos (*):
   * A:NIF*B:NIF_CLI*C:AO*D:FT*E:N*F:YYYYMMDD*G:NUMDOC*H:0*I1:AO*I7:0.00*I8:0.00*N:0.00*Q:XXXX*R:NUM_CERT
   */
  public static buildQRCodeString(document: FiscalDocument, company: Company): string {
    const cleanTaxId = company.taxId.trim().toUpperCase();
    const cleanCustomerTaxId = (document.customerTaxId || '999999999').trim().toUpperCase();
    const formattedDate = document.documentDate.replace(/-/g, ''); // YYYYMMDD
    const docStatus = document.status === 'CANCELLED' ? 'A' : 'N';

    // Base tributável e montante de impostos formatados com 2 casas decimais
    const base = document.taxableBase.toFixed(2);
    const tax = document.taxAmount.toFixed(2);
    const gross = (document.taxableBase + document.taxAmount).toFixed(2);
    const hashControl = (document.hashControl || 'XXXX').trim();
    const certNum = (document.softwareCertificateNumber || '999/AGT/2026').trim();

    const parts: string[] = [
      `A:${cleanTaxId}`,
      `B:${cleanCustomerTaxId}`,
      `C:AO`,
      `D:${document.documentTypeCode}`,
      `E:${docStatus}`,
      `F:${formattedDate}`,
      `G:${document.documentNumber}`,
      `H:${document.seriesId || '0'}`,
      `I1:AO`,
      `I7:${base}`,
      `I8:${tax}`,
      `N:${gross}`,
    ];

    if (document.withholdingAmount && document.withholdingAmount > 0) {
      parts.push(`O:${document.withholdingAmount.toFixed(2)}`);
    }

    parts.push(`Q:${hashControl}`);
    parts.push(`R:${certNum}`);

    return parts.join('*');
  }

  /**
   * Decompõe e valida os campos de uma string de Código QR
   */
  public static parseQRCodeString(rawString: string): Partial<AGTFiscalQRCodePayload> | null {
    if (!rawString || !rawString.includes('*')) {
      return null;
    }

    const segments = rawString.split('*');
    const result: Record<string, string> = {};

    for (const seg of segments) {
      const colonIdx = seg.indexOf(':');
      if (colonIdx > 0) {
        const key = seg.slice(0, colonIdx);
        const val = seg.slice(colonIdx + 1);
        result[key] = val;
      }
    }

    return {
      emitterTaxId: result['A'],
      customerTaxId: result['B'],
      customerCountry: result['C'],
      documentType: result['D'],
      documentStatus: result['E'] as any,
      documentDate: result['F'],
      documentNumber: result['G'],
      atcudOrSeries: result['H'],
      taxRegion: result['I1'],
      taxableBase: result['I7'] ? parseFloat(result['I7']) : undefined,
      taxAmount: result['I8'] ? parseFloat(result['I8']) : undefined,
      grossTotal: result['N'] ? parseFloat(result['N']) : undefined,
      withholdingAmount: result['O'] ? parseFloat(result['O']) : undefined,
      hashControl: result['Q'],
      softwareCertificateNumber: result['R'],
    };
  }

  /**
   * Constrói o payload estruturado e autónomo para o Portal Público de Validação
   */
  public static buildPublicVerificationData(
    document: FiscalDocument,
    company: Company
  ): PublicVerificationData {
    const canonicalString = this.buildQRCodeString(document, company);

    return {
      documentNumber: document.documentNumber,
      documentTypeCode: document.documentTypeCode,
      seriesId: document.seriesId,
      documentDate: document.documentDate,
      documentTime: document.systemEntryDate ? document.systemEntryDate.slice(11, 19) : undefined,
      status: document.status === 'CANCELLED' ? 'CANCELLED' : 'NORMAL',
      emitterName: company.tradeName || company.name,
      emitterTaxId: company.taxId,
      emitterAddress: company.address,
      emitterCity: company.city,
      taxRegime: company.taxRegime,
      customerName: document.customerName,
      customerTaxId: document.customerTaxId || '999999999',
      customerAddress: document.customerAddress,
      taxableBase: document.taxableBase,
      taxAmount: document.taxAmount,
      withholdingAmount: document.withholdingAmount,
      netTotal: document.netTotal,
      grossTotal: document.taxableBase + document.taxAmount,
      hashControl: document.hashControl,
      hash: document.hash,
      signatureBase64: document.signature?.signatureBase64,
      signatureAlgorithm: document.signature?.algorithm,
      softwareCertificateNumber: document.softwareCertificateNumber || '999/AGT/2026',
      items: document.lines?.map((l) => ({
        code: l.productCode,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        total: l.totalLineAmount,
      })),
      canonicalString,
    };
  }

  /**
   * Codifica os dados públicos de validação num token base64 compacto e seguro para URL
   */
  public static encodeVerificationPayload(
    document: FiscalDocument,
    company: Company
  ): string {
    const data = this.buildPublicVerificationData(document, company);
    const jsonStr = JSON.stringify(data);
    return utf8ToBase64(jsonStr);
  }

  /**
   * Descodifica um token ou string de validação (seja base64, URL ou string canónica AGT)
   */
  public static decodeVerificationPayload(
    tokenOrString: string
  ): PublicVerificationData | null {
    if (!tokenOrString) return null;

    // 1. Tentar como token base64 JSON
    try {
      const decodedJson = base64ToUtf8(tokenOrString.trim());
      if (decodedJson.startsWith('{') && decodedJson.endsWith('}')) {
        const parsed = JSON.parse(decodedJson);
        if (parsed.documentNumber && parsed.emitterTaxId) {
          return parsed as PublicVerificationData;
        }
      }
    } catch {
      // Ignora e tenta outros formatos
    }

    // 2. Tentar como string canónica AGT (A:NIF*B:NIF*...)
    const parsedAgt = this.parseQRCodeString(tokenOrString);
    if (parsedAgt && parsedAgt.documentNumber && parsedAgt.emitterTaxId) {
      const formattedDate = parsedAgt.documentDate
        ? `${parsedAgt.documentDate.slice(0, 4)}-${parsedAgt.documentDate.slice(4, 6)}-${parsedAgt.documentDate.slice(6, 8)}`
        : new Date().toISOString().split('T')[0];

      return {
        documentNumber: parsedAgt.documentNumber,
        documentTypeCode: parsedAgt.documentType || 'FT',
        seriesId: parsedAgt.atcudOrSeries || 'SER-2026',
        documentDate: formattedDate,
        status: parsedAgt.documentStatus === 'A' ? 'CANCELLED' : 'NORMAL',
        emitterName: 'Empresa Certificada AGT',
        emitterTaxId: parsedAgt.emitterTaxId,
        customerName: parsedAgt.customerTaxId === '999999999' ? 'Consumidor Final' : 'Cliente Registado',
        customerTaxId: parsedAgt.customerTaxId || '999999999',
        taxableBase: parsedAgt.taxableBase || 0,
        taxAmount: parsedAgt.taxAmount || 0,
        withholdingAmount: parsedAgt.withholdingAmount || 0,
        netTotal: (parsedAgt.grossTotal || 0) - (parsedAgt.withholdingAmount || 0),
        grossTotal: parsedAgt.grossTotal || 0,
        hashControl: parsedAgt.hashControl || 'XXXX',
        hash: 'SHA256-EMBUTIDO-NO-QR-CODE',
        softwareCertificateNumber: parsedAgt.softwareCertificateNumber || '999/AGT/2026',
        canonicalString: tokenOrString,
      };
    }

    return null;
  }

  /**
   * Constrói a URL completa do Portal Público de Validação que qualquer telemóvel abre ao ler o QR Code
   */
  public static buildVerificationURL(
    document: FiscalDocument,
    company: Company,
    customBaseUrl?: string
  ): string {
    let base = customBaseUrl;
    if (!base && typeof window !== 'undefined') {
      base = window.location.origin + window.location.pathname;
    }
    if (!base) {
      base = 'https://portal-fiscal.minfin.gov.ao/validar';
    }

    const payloadToken = this.encodeVerificationPayload(document, company);
    const cleanDocNum = encodeURIComponent(document.documentNumber);

    // Formato com parâmetros para máxima compatibilidade em telemóveis
    const url = new URL(base);
    url.searchParams.set('validar', '1');
    url.searchParams.set('doc', cleanDocNum);
    url.searchParams.set('token', payloadToken);

    return url.toString();
  }

  /**
   * Gera o QR Code em formato DataURL (imagem PNG base64) para renderização em <img> ou impressão
   */
  public static async generateDataURL(
    content: string,
    options?: { width?: number; margin?: number }
  ): Promise<string> {
    const opts: QRCode.QRCodeToDataURLOptions = {
      width: options?.width || 200,
      margin: options?.margin !== undefined ? options.margin : 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0a0a0a',
        light: '#ffffff',
      },
    };

    return await QRCode.toDataURL(content, opts);
  }

  /**
   * Gera o QR Code em formato SVG como string para renderização vetorial cristalina
   */
  public static async generateSVG(
    content: string,
    options?: { width?: number; margin?: number }
  ): Promise<string> {
    const opts: QRCode.QRCodeToStringOptions = {
      type: 'svg',
      width: options?.width || 180,
      margin: options?.margin !== undefined ? options.margin : 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    };

    return await QRCode.toString(content, opts);
  }
}
