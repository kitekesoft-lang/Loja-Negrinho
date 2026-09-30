import { FiscalDocument } from '../types/document';
import {
  AGTQueueItem,
  AGTTransmissionReceipt,
  AGTDocumentPayload,
  AGTTransmissionStatus,
} from '../types/agt';
import { AGTConnector } from './AGTConnector';
import { SignatureService } from '../security/SignatureService';
import { AuditService } from '../security/AuditService';

export class AGTTransmissionQueue {
  private queue: Map<string, AGTQueueItem> = new Map();
  private connector: AGTConnector;
  private isProcessing: boolean = false;
  private listeners: Array<() => void> = [];

  constructor(connector?: AGTConnector) {
    this.connector = connector || new AGTConnector('HOMOLOGATION');
  }

  public getConnector(): AGTConnector {
    return this.connector;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getAll(): AGTQueueItem[] {
    return Array.from(this.queue.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getById(id: string): AGTQueueItem | undefined {
    return this.queue.get(id);
  }

  public getByDocumentId(documentId: string): AGTQueueItem | undefined {
    return Array.from(this.queue.values()).find((item) => item.documentId === documentId);
  }

  /**
   * Enfileira um documento fiscal assinado para transmissão oficial à AGT.
   */
  public enqueueDocument(document: FiscalDocument): AGTQueueItem {
    // Verificar se já existe na fila
    const existing = this.getByDocumentId(document.id);
    if (existing) {
      return existing;
    }

    // Assinar digitalmente com RSA antes do envio
    const signature = SignatureService.signDocument({
      documentDate: document.documentDate,
      systemEntryDate: document.systemEntryDate,
      documentNumber: document.documentNumber,
      netTotal: document.netTotal,
      hash: document.hash,
    });

    const payload: AGTDocumentPayload = {
      documentId: document.id,
      documentNumber: document.documentNumber,
      documentTypeCode: document.documentTypeCode,
      seriesCode: document.seriesId,
      fiscalYear: new Date(document.documentDate).getFullYear(),
      documentDate: document.documentDate,
      systemEntryDate: document.systemEntryDate,
      customerTaxId: document.customerTaxId,
      customerName: document.customerName,
      grossTotal: document.grossAmount,
      taxTotal: document.taxAmount,
      withholdingTaxTotal: document.withholdingAmount,
      netTotal: document.netTotal,
      hash: document.hash,
      hashControl: document.hashControl,
      previousHash: document.previousHash,
      linesCount: document.lines.length,
      signature,
    };

    const idempotencyKey = `IDEMP-${document.companyId}-${document.seriesId}-${document.sequentialNumber}`;

    const queueItem: AGTQueueItem = {
      id: `Q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      documentId: document.id,
      documentNumber: document.documentNumber,
      idempotencyKey,
      attempts: 0,
      maxAttempts: 5,
      status: 'QUEUED',
      payload,
      backoffDelayMs: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.queue.set(queueItem.id, queueItem);

    AuditService.logEvent({
      companyId: document.companyId,
      user: { id: document.issuedByUserId, name: 'Operador Fiscal', role: 'CONTABILISTA' },
      entityType: 'AGT_QUEUE',
      entityId: queueItem.id,
      operation: 'TRANSMIT_AGT',
      description: `Documento fiscal ${document.documentNumber} colocado na fila de comunicação AGT com IdempotencyKey ${idempotencyKey}`,
      newState: { status: queueItem.status, attempts: 0 },
    });

    this.notify();
    return queueItem;
  }

  /**
   * Processa itens pendentes na fila utilizando algoritmo de retry com Backoff Exponencial.
   */
  public async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    const pendingItems = Array.from(this.queue.values()).filter(
      (item) => item.status === 'QUEUED' || item.status === 'FAILED_CONTINGENCY'
    );

    for (const item of pendingItems) {
      processed++;
      item.status = 'IN_FLIGHT';
      item.attempts += 1;
      item.lastAttemptAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      this.notify();

      try {
        const receipt = await this.connector.transmitDocument(item.payload, item.idempotencyKey);
        item.status = 'ACCEPTED';
        item.response = receipt;
        item.lastError = undefined;
        item.updatedAt = new Date().toISOString();
        succeeded++;

        AuditService.logEvent({
          companyId: 'COMP-001',
          user: { id: 'SYS-AGT', name: 'AGT Connector Daemon', role: 'ADMIN' },
          entityType: 'AGT_QUEUE',
          entityId: item.id,
          operation: 'TRANSMIT_AGT',
          description: `Documento ${item.documentNumber} aceite pela AGT. Recibo: ${receipt.receiptNumber}, RequestID: ${receipt.requestId}`,
          newState: { receiptNumber: receipt.receiptNumber, seal: receipt.digitalSeal },
        });
      } catch (err: any) {
        failed++;
        const errorMessage = err?.message || 'Erro de comunicação com o Web Service da AGT.';
        item.lastError = errorMessage;

        if (item.attempts >= item.maxAttempts) {
          item.status = 'REJECTED';
        } else {
          item.status = 'FAILED_CONTINGENCY';
          // Backoff exponencial: 1s, 2s, 4s, 8s, 16s...
          item.backoffDelayMs = Math.min(30000, 1000 * Math.pow(2, item.attempts - 1));
          const nextRetry = new Date(Date.now() + item.backoffDelayMs);
          item.nextRetryAt = nextRetry.toISOString();
        }

        item.updatedAt = new Date().toISOString();

        AuditService.logEvent({
          companyId: 'COMP-001',
          user: { id: 'SYS-AGT', name: 'AGT Connector Daemon', role: 'ADMIN' },
          entityType: 'AGT_QUEUE',
          entityId: item.id,
          operation: 'AGT_RETRY',
          description: `Falha na transmissão do documento ${item.documentNumber} para a AGT (Tentativa ${item.attempts}/${item.maxAttempts}): ${errorMessage}. Modo contingência activado.`,
        });
      }

      this.notify();
    }

    this.isProcessing = false;
    return { processed, succeeded, failed };
  }

  /**
   * Força o reenvio de um documento específico rejeitado ou em contingência.
   */
  public async retryItem(itemId: string): Promise<AGTQueueItem> {
    const item = this.queue.get(itemId);
    if (!item) {
      throw new Error(`Item de fila ${itemId} não encontrado.`);
    }

    item.status = 'QUEUED';
    item.updatedAt = new Date().toISOString();
    this.notify();

    await this.processQueue();
    return this.queue.get(itemId)!;
  }
}
