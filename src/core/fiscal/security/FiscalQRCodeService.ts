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

  // =========================================================================
  // ESPECIFICAÇÕES OFICIAIS AGT PARA DOCUMENTOS IMPRESSOS (100% CONFORMIDADE)
  // Conforme especificações oficiais:
  // - Padrão: QR Code Model 2
  // - Versão: 4 (33 x 33 módulos) / Byte Mode
  // - Nível de correcção de erros: M (15%)
  // - Modo de dados: Byte
  // - Codificação de caracteres: UTF-8
  // - URL codificada: https://portaldocontribuinte.minfin.gov.ao/consultar-fe?documentNo
  // - Formato: PNG, 350x350 px
  // - Substituição de espaços: Cada espaço substituído pela sequência %20
  // - Logótipo central: Emblema oficial AGT - ADMINISTRAÇÃO GERAL TRIBUTÁRIA
  // =========================================================================

  /**
   * Constrói a URL codificada oficial da AGT para documentos impressos:
   * Cada espaço no documentNo é substituído estritamente pela sequência %20.
   */
  public static buildOfficialAGTDocumentURL(documentNumber: string): string {
    const cleanDoc = (documentNumber || '').trim().replace(/ /g, '%20');
    return `https://portaldocontribuinte.minfin.gov.ao/consultar-fe?documentNo=${cleanDoc}`;
  }

  /**
   * Gera o SVG oficial com QR Code Model 2, Nível M (15%) e o logótipo oficial da AGT no centro
   */
  public static async generateOfficialAGTQRCodeSVG(
    documentNumber: string,
    size: number = 350
  ): Promise<string> {
    const url = this.buildOfficialAGTDocumentURL(documentNumber);
    const opts: QRCode.QRCodeToStringOptions = {
      type: 'svg',
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    };

    const rawSvg = await QRCode.toString(url, opts);
    const badgeSvg = this.getOfficialAGTBadgeSVG(size);
    return rawSvg.replace('</svg>', badgeSvg + '</svg>');
  }

  /**
   * Gera o DataURL em formato PNG (350x350 px padrão) fiel ao modelo oficial da AGT
   */
  public static async generateOfficialAGTQRCodeDataURL(
    documentNumber: string,
    targetSize: number = 350
  ): Promise<string> {
    const svgString = await this.generateOfficialAGTQRCodeSVG(documentNumber, targetSize);

    // No ambiente do navegador (Client/React/POS), converte SVG para PNG rasterizado 350x350 px via Canvas
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`);
        }

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(svgBlob);

        img.onload = () => {
          ctx.drawImage(img, 0, 0, targetSize, targetSize);
          URL.revokeObjectURL(blobUrl);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`);
        };
        img.src = blobUrl;
      });
    }

    // Fallback seguro em ambientes sem DOM / Node.js
    const url = this.buildOfficialAGTDocumentURL(documentNumber);
    return await QRCode.toDataURL(url, {
      width: targetSize,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    });
  }

  /**
   * Gera o elemento SVG com o logótipo oficial da AGT (Engrenagem + Tipografia) no centro do QR Code
   */
  public static getOfficialAGTBadgeSVG(size: number = 350): string {
    const scale = size / 350;
    const bw = 120 * scale;
    const bh = 56 * scale;
    const bx = (size - bw) / 2;
    const by = (size - bh) / 2;
    const cx = bx + 27 * scale;
    const cy = by + 28 * scale;
    const outerR = 14 * scale;
    const innerR = 10 * scale;

    // Traçado preciso da engrenagem oficial de 8 dentes da AGT
    let gearPath = '';
    const numTeeth = 8;
    const step = (Math.PI * 2) / numTeeth;
    for (let i = 0; i < numTeeth; i++) {
      const a0 = i * step;
      const a1 = a0 + step * 0.25;
      const a2 = a0 + step * 0.55;
      const a3 = a0 + step * 0.8;
      const x0 = cx + Math.cos(a0) * innerR;
      const y0 = cy + Math.sin(a0) * innerR;
      const x1 = cx + Math.cos(a1) * outerR;
      const y1 = cy + Math.sin(a1) * outerR;
      const x2 = cx + Math.cos(a2) * outerR;
      const y2 = cy + Math.sin(a2) * outerR;
      const x3 = cx + Math.cos(a3) * innerR;
      const y3 = cy + Math.sin(a3) * innerR;
      if (i === 0) gearPath += `M ${x0.toFixed(2)} ${y0.toFixed(2)} `;
      else gearPath += `L ${x0.toFixed(2)} ${y0.toFixed(2)} `;
      gearPath += `L ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} `;
    }
    gearPath += 'Z';

    return `
    <g id="agt-official-badge">
      <!-- Retângulo branco de fundo para isolamento dos módulos do QR Code -->
      <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" ry="2" fill="#ffffff" stroke="#ffffff" stroke-width="2" />
      
      <!-- Engrenagem azul oficial da AGT -->
      <path d="${gearPath}" fill="#00478f" />
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(5.5 * scale).toFixed(1)}" fill="#ffffff" />
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(2.8 * scale).toFixed(1)}" fill="#00478f" />
      
      <!-- Linha vertical divisória -->
      <line x1="${(bx + 48 * scale).toFixed(1)}" y1="${(by + 6 * scale).toFixed(1)}" x2="${(bx + 48 * scale).toFixed(1)}" y2="${(by + 50 * scale).toFixed(1)}" stroke="#94a3b8" stroke-width="0.75" />
      
      <!-- Tipografia oficial AGT: AGT / ADMINISTRAÇÃO / GERAL / TRIBUTÁRIA -->
      <text x="${(bx + 54 * scale).toFixed(1)}" y="${(by + 16 * scale).toFixed(1)}" font-family="Arial, Helvetica, sans-serif" font-size="${(12 * scale).toFixed(1)}" font-weight="900" fill="#00478f">AGT</text>
      <text x="${(bx + 54 * scale).toFixed(1)}" y="${(by + 27 * scale).toFixed(1)}" font-family="Arial, Helvetica, sans-serif" font-size="${(4.8 * scale).toFixed(1)}" font-weight="700" letter-spacing="0.3" fill="#4b6b8b">ADMINISTRAÇÃO</text>
      <text x="${(bx + 54 * scale).toFixed(1)}" y="${(by + 36 * scale).toFixed(1)}" font-family="Arial, Helvetica, sans-serif" font-size="${(4.8 * scale).toFixed(1)}" font-weight="700" letter-spacing="0.3" fill="#4b6b8b">GERAL</text>
      <text x="${(bx + 54 * scale).toFixed(1)}" y="${(by + 45 * scale).toFixed(1)}" font-family="Arial, Helvetica, sans-serif" font-size="${(4.8 * scale).toFixed(1)}" font-weight="700" letter-spacing="0.3" fill="#4b6b8b">TRIBUTÁRIA</text>
    </g>`;
  }
}
