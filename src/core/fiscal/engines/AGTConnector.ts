import {
  AGTEnvironment,
  AGTCredentials,
  AGTDocumentPayload,
  AGTTransmissionReceipt,
  AGTSimulatorConfig,
  AGTSeriesAuthorizationRequest,
  AGTSeriesAuthorizationResponse,
} from '../types/agt';
import { SignatureService } from '../security/SignatureService';
import { HashChainingService } from '../security/HashChainingService';

export class AGTConnector {
  private credentials: AGTCredentials;
  private simulatorConfig: AGTSimulatorConfig;
  private processedRequestIds: Set<string> = new Set();
  private processedIdempotencyKeys: Map<string, AGTTransmissionReceipt> = new Map();

  constructor(
    environment: AGTEnvironment = 'HOMOLOGATION',
    simulatorConfig?: Partial<AGTSimulatorConfig>
  ) {
    this.credentials = {
      companyTaxId: '5417082341',
      certificateSerialNumber: 'AGT-RSA2048-AO-2026-991823',
      rsaKeyFingerprint: 'SHA256:4a8b7f90c23e817d12f9b87a412093ea6518bc29df',
      keyVersion: 1,
      environment,
      apiBaseUrl:
        environment === 'PRODUCTION'
          ? 'https://webservices.agt.minfin.gov.ao/api/v1/invoices'
          : 'https://homologacao.agt.minfin.gov.ao/api/v1/invoices',
      softwareCertificateNumber: 'CERT-AGT-2026/089',
      softwareName: 'ERP Fiscal Angolano',
      softwareVersion: '1.0.0',
    };

    this.simulatorConfig = {
      networkLatencyMs: 300,
      failureRatePercentage: 0,
      simulateTimeout: false,
      simulateInvalidSignature: false,
      simulateDuplicateSubmission: false,
      ...simulatorConfig,
    };
  }

  public setEnvironment(environment: AGTEnvironment): void {
    this.credentials.environment = environment;
    this.credentials.apiBaseUrl =
      environment === 'PRODUCTION'
        ? 'https://webservices.agt.minfin.gov.ao/api/v1/invoices'
        : 'https://homologacao.agt.minfin.gov.ao/api/v1/invoices';
  }

  public getEnvironment(): AGTEnvironment {
    return this.credentials.environment;
  }

  public getCredentials(): AGTCredentials {
    return { ...this.credentials };
  }

  public getSimulatorConfig(): AGTSimulatorConfig {
    return { ...this.simulatorConfig };
  }

  public updateSimulatorConfig(config: Partial<AGTSimulatorConfig>): void {
    this.simulatorConfig = { ...this.simulatorConfig, ...config };
  }

  /**
   * Transmissão do documento fiscal para o Web Service da AGT.
   * Suporta Idempotency Key para prevenir duplicação de registos na AGT.
   */
  public async transmitDocument(
    payload: AGTDocumentPayload,
    idempotencyKey: string
  ): Promise<AGTTransmissionReceipt> {
    // 1. Simulação de latência de rede
    if (this.simulatorConfig.networkLatencyMs > 0) {
      await new Promise((res) => setTimeout(res, this.simulatorConfig.networkLatencyMs));
    }

    // 2. Simulação de Timeout de Rede (Contingência)
    if (this.simulatorConfig.simulateTimeout) {
      throw new Error('GATEWAY_TIMEOUT: Conexão ao servidor da AGT expirou (HTTP 504). Fila de contingência activada.');
    }

    // 3. Simulação de Falha Aleatória de Infraestrutura
    if (
      this.simulatorConfig.failureRatePercentage > 0 &&
      Math.random() * 100 < this.simulatorConfig.failureRatePercentage
    ) {
      throw new Error('SERVICE_UNAVAILABLE: O portal da AGT reportou sobrecarga temporária (HTTP 503). Retentando...');
    }

    // 4. Verificação de Idempotência (Se já foi transmitido com a mesma chave, devolve o recibo prévio)
    if (this.processedIdempotencyKeys.has(idempotencyKey)) {
      const cached = this.processedIdempotencyKeys.get(idempotencyKey)!;
      return {
        ...cached,
        responseDescription: 'Documento já processado previamente pela AGT (Idempotência Confirmada).',
      };
    }

    // 5. Simulação de Envio Duplicado sem Idempotência
    if (this.simulatorConfig.simulateDuplicateSubmission) {
      throw new Error(`DUPLICATE_DOCUMENT: O documento fiscal ${payload.documentNumber} já consta nos registos da AGT.`);
    }

    // 6. Verificação de Assinatura RSA pelo Web Service da AGT
    let signatureStatus: 'VALID' | 'INVALID' = 'VALID';
    if (this.simulatorConfig.simulateInvalidSignature) {
      signatureStatus = 'INVALID';
      throw new Error('SIGNATURE_VERIFICATION_FAILED: A assinatura digital do software não pôde ser validada pela AGT.');
    }

    const verification = SignatureService.verifySignature(
      {
        documentDate: payload.documentDate,
        systemEntryDate: payload.systemEntryDate,
        documentNumber: payload.documentNumber,
        netTotal: payload.netTotal,
        hash: payload.hash,
      },
      payload.signature
    );

    if (!verification.isValid) {
      throw new Error(`SIGNATURE_REJECTED: ${verification.reason}`);
    }

    // 7. Geração de Recibo Oficial da AGT
    const requestId = `AGT-REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const receiptSeq = Math.floor(100000 + Math.random() * 900000);
    const receiptNumber = `REC-AGT-${new Date().getFullYear()}-${receiptSeq}`;
    const digitalSeal = HashChainingService.sha256(`${payload.documentNumber};${requestId};${payload.hash}`).slice(0, 32);

    const receipt: AGTTransmissionReceipt = {
      requestId,
      receiptNumber,
      transmissionTimestamp: new Date().toISOString(),
      status: 'ACCEPTED',
      responseCode: 'AGT_200_OK',
      responseDescription: 'Documento fiscal validado, aceite e arquivado com sucesso no repositório tributário da AGT.',
      environment: this.credentials.environment,
      qrCodeVerificationUrl: `https://validador.agt.minfin.gov.ao/consulta?nif=${this.credentials.companyTaxId}&doc=${encodeURIComponent(payload.documentNumber)}&seal=${digitalSeal}`,
      signatureVerificationStatus: 'VALID',
      digitalSeal,
    };

    this.processedRequestIds.add(requestId);
    this.processedIdempotencyKeys.set(idempotencyKey, receipt);

    return receipt;
  }

  /**
   * Valida e regista uma nova série documental no Web Service da AGT.
   * Conforme o Decreto Executivo: após homologação e mediante inserção da Chave de Comunicação,
   * as séries passam a depender do registo e autorização expressa da AGT.
   */
  public async requestSeriesAuthorization(
    request: AGTSeriesAuthorizationRequest,
    communicationKey: string
  ): Promise<AGTSeriesAuthorizationResponse> {
    if (!communicationKey || communicationKey.trim().length < 6) {
      throw new Error(
        'CHAVE_COMUNICACAO_INVALIDA: A chave de comunicação com a AGT é obrigatória para obter e validar séries no modo homologado.'
      );
    }

    // Simulação de latência de rede com a AGT
    if (this.simulatorConfig.networkLatencyMs > 0) {
      await new Promise((res) => setTimeout(res, this.simulatorConfig.networkLatencyMs));
    }

    if (this.simulatorConfig.simulateTimeout) {
      throw new Error('GATEWAY_TIMEOUT: Conexão ao serviço de séries da AGT expirou.');
    }

    const cleanSeries = request.seriesCode.trim().toUpperCase();
    const cleanDocType = request.documentTypeCode.trim().toUpperCase();

    // Código de validação oficial gerado pela AGT para a série autorizada
    const agtValidationCode = `AGT-VAL-${request.fiscalYear}-${cleanDocType}-${cleanSeries}`;

    return {
      success: true,
      agtValidationCode,
      seriesCode: cleanSeries,
      documentTypeCode: cleanDocType,
      fiscalYear: request.fiscalYear,
      authorizedAt: new Date().toISOString(),
      status: 'APPROVED',
      message: `Série ${cleanDocType} ${cleanSeries}/${request.fiscalYear} validada e autorizada com sucesso pela AGT.`,
    };
  }

  /**
   * Valida a chave de comunicação e obtém o certificado de homologação da AGT
   */
  public async validateCommunicationKey(
    communicationKey: string
  ): Promise<{ isValid: boolean; softwareCertificateNumber: string; message: string }> {
    const cleanKey = communicationKey.trim();
    if (!cleanKey || cleanKey.length < 6) {
      return {
        isValid: false,
        softwareCertificateNumber: '0/AGT/2026',
        message: 'Chave de comunicação inválida ou com formato insuficiente.',
      };
    }

    // Simulação de validação da chave no Web Service da AGT
    const certNum = 'CERT-AGT-2026/089';
    return {
      isValid: true,
      softwareCertificateNumber: certNum,
      message: `Chave de comunicação validada com sucesso pela AGT. Software homologado sob nº ${certNum}.`,
    };
  }
}
