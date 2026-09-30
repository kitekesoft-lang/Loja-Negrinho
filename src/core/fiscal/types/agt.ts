export type AGTEnvironment = 'HOMOLOGATION' | 'PRODUCTION';

export type AGTTransmissionStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'IN_FLIGHT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'FAILED_CONTINGENCY';

export interface AGTCredentials {
  companyTaxId: string;
  certificateSerialNumber: string;
  rsaKeyFingerprint: string;
  keyVersion: number;
  environment: AGTEnvironment;
  apiBaseUrl: string;
  softwareCertificateNumber: string; // Ex: 'CERT-AGT-2026/089'
  softwareName: string;
  softwareVersion: string;
}

export interface AGTSignatureMetadata {
  algorithm: 'RSASSA-PKCS1-v1_5' | 'RSASSA-PSS';
  digestAlgorithm: 'SHA-256' | 'SHA-1';
  keyVersion: number;
  signedAt: string;
  signatureBase64: string;
  publicKeyFingerprint: string;
  rawDigestHex?: string;
  canonicalString?: string;
}

export interface AGTDocumentPayload {
  documentId: string;
  documentNumber: string;
  documentTypeCode: string;
  seriesCode: string;
  fiscalYear: number;
  documentDate: string;
  systemEntryDate: string;
  customerTaxId: string;
  customerName: string;
  grossTotal: number;
  taxTotal: number;
  withholdingTaxTotal: number;
  netTotal: number;
  hash: string;
  hashControl: string;
  previousHash: string;
  linesCount: number;
  signature: AGTSignatureMetadata;
}

export interface AGTQueueItem {
  id: string;
  documentId: string;
  documentNumber: string;
  idempotencyKey: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastAttemptAt?: string;
  status: AGTTransmissionStatus;
  payload: AGTDocumentPayload;
  response?: AGTTransmissionReceipt;
  lastError?: string;
  backoffDelayMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface AGTTransmissionReceipt {
  requestId: string;
  receiptNumber: string;
  transmissionTimestamp: string;
  status: 'ACCEPTED' | 'REJECTED' | 'ERROR';
  responseCode: string;
  responseDescription: string;
  environment: AGTEnvironment;
  qrCodeVerificationUrl: string;
  validationWarnings?: string[];
  signatureVerificationStatus: 'VALID' | 'INVALID';
  digitalSeal: string;
}

export interface AGTSimulatorConfig {
  networkLatencyMs: number;
  failureRatePercentage: number;
  simulateTimeout: boolean;
  simulateInvalidSignature: boolean;
  simulateDuplicateSubmission: boolean;
}
