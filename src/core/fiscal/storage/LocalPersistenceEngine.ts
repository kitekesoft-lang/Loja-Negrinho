import { FiscalDatabase } from '../repository/FiscalDatabase';
import { Product } from '../types/product';
import { Customer, Supplier } from '../types/customer';
import { FiscalDocument } from '../types/document';
import { StockItem, StockMovement } from '../types/erp';
import { Payment } from '../types/payment';

export interface SyncQueueItem {
  id: string;
  entityType: 'PRODUCT' | 'SALE_DOCUMENT' | 'STOCK_MOVEMENT' | 'CUSTOMER' | 'SUPPLIER';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
  synced: boolean;
}

export interface CloudStorageConfig {
  cloudEnabled: boolean;
  endpointUrl: string;
  apiKey: string;
  autoSyncIntervalSec: number;
  lastSyncTimestamp: string | null;
}

const STORAGE_KEYS = {
  PRODUCTS: 'minha_loja_products_v1',
  STOCK_ITEMS: 'minha_loja_stock_items_v1',
  STOCK_MOVEMENTS: 'minha_loja_stock_movements_v1',
  DOCUMENTS: 'minha_loja_documents_v1',
  CUSTOMERS: 'minha_loja_customers_v1',
  SUPPLIERS: 'minha_loja_suppliers_v1',
  PAYMENTS: 'minha_loja_payments_v1',
  SYNC_QUEUE: 'minha_loja_sync_queue_v1',
  CLOUD_CONFIG: 'minha_loja_cloud_config_v1',
  BACKUP_TIMESTAMP: 'minha_loja_last_backup_v1',
};

export class LocalPersistenceEngine {
  private static isSaving = false;

  /**
   * Obtém a configuração de sincronização em nuvem
   */
  public static getCloudConfig(): CloudStorageConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }

    return {
      cloudEnabled: true,
      endpointUrl: 'https://api.minhaloja.ao/v1/sync',
      apiKey: 'ML-CLOUD-PROD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      autoSyncIntervalSec: 60,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Salva a configuração de nuvem
   */
  public static saveCloudConfig(config: CloudStorageConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Erro ao guardar configuração de nuvem:', e);
    }
  }

  /**
   * Carrega dados do armazenamento local para a FiscalDatabase
   */
  public static hydrateFromLocalStorage(db: FiscalDatabase): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      // 1. Produtos
      const rawProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (rawProds) {
        const prodsArray: Product[] = JSON.parse(rawProds);
        prodsArray.forEach((p) => db.products.set(p.id, p));
      }

      // 2. Estoque
      const rawStock = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
      if (rawStock) {
        const stockArray: StockItem[] = JSON.parse(rawStock);
        stockArray.forEach((s) => db.stockItems.set(s.id, s));
      }

      // 3. Movimentos de Estoque
      const rawMovements = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
      if (rawMovements) {
        const movArray: StockMovement[] = JSON.parse(rawMovements);
        movArray.forEach((m) => db.stockMovements.set(m.id, m));
      }

      // 4. Documentos Fiscais (Vendas / Facturas / Recibos)
      const rawDocs = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (rawDocs) {
        const docsArray: FiscalDocument[] = JSON.parse(rawDocs);
        docsArray.forEach((d) => db.documents.set(d.id, d));
      }

      // 5. Clientes
      const rawCusts = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (rawCusts) {
        const custsArray: Customer[] = JSON.parse(rawCusts);
        custsArray.forEach((c) => db.customers.set(c.id, c));
      }

      // 6. Fornecedores
      const rawSupps = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      if (rawSupps) {
        const suppsArray: Supplier[] = JSON.parse(rawSupps);
        suppsArray.forEach((s) => db.suppliers.set(s.id, s));
      }

      // 7. Pagamentos
      const rawPmts = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (rawPmts) {
        const pmtsArray: Payment[] = JSON.parse(rawPmts);
        pmtsArray.forEach((p) => db.payments.set(p.id, p));
      }
    } catch (e) {
      console.warn('Aviso na hidratação de armazenamento local:', e);
    }
  }

  /**
   * Salva o estado atual da FiscalDatabase no armazenamento local do dispositivo
   */
  public static persistToLocalStorage(db: FiscalDatabase): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (this.isSaving) return;

    this.isSaving = true;

    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(Array.from(db.products.values())));
      localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(Array.from(db.stockItems.values())));
      localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(Array.from(db.stockMovements.values())));
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(Array.from(db.documents.values())));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(Array.from(db.customers.values())));
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(Array.from(db.suppliers.values())));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(Array.from(db.payments.values())));
      localStorage.setItem(STORAGE_KEYS.BACKUP_TIMESTAMP, new Date().toISOString());
    } catch (err) {
      console.error('Erro ao persistir no armazenamento local:', err);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Adiciona um item à fila de sincronização em nuvem
   */
  public static queueSyncItem(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'synced'>): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const queue = this.getSyncQueue();
      const newItem: SyncQueueItem = {
        ...item,
        id: `SYNC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        synced: false,
      };
      queue.push(newItem);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue.slice(-200)));
    } catch (e) {
      console.error('Erro na fila de sincronização:', e);
    }
  }

  /**
   * Obtém a fila de operações pendentes para nuvem
   */
  public static getSyncQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Limpa itens sincronizados
   */
  public static markAllSynced(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
      const cfg = this.getCloudConfig();
      cfg.lastSyncTimestamp = new Date().toISOString();
      this.saveCloudConfig(cfg);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Exporta cópia de segurança completa em JSON (Backup do Sistema)
   */
  public static exportFullBackupJSON(db: FiscalDatabase): string {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      storeName: 'Minha Loja',
      products: Array.from(db.products.values()),
      stockItems: Array.from(db.stockItems.values()),
      stockMovements: Array.from(db.stockMovements.values()),
      documents: Array.from(db.documents.values()),
      customers: Array.from(db.customers.values()),
      suppliers: Array.from(db.suppliers.values()),
      payments: Array.from(db.payments.values()),
    };

    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Importa cópia de segurança a partir de ficheiro JSON
   */
  public static importBackupJSON(jsonStr: string, db: FiscalDatabase): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed.products)) {
        parsed.products.forEach((p: Product) => db.products.set(p.id, p));
      }
      if (Array.isArray(parsed.stockItems)) {
        parsed.stockItems.forEach((s: StockItem) => db.stockItems.set(s.id, s));
      }
      if (Array.isArray(parsed.stockMovements)) {
        parsed.stockMovements.forEach((m: StockMovement) => db.stockMovements.set(m.id, m));
      }
      if (Array.isArray(parsed.documents)) {
        parsed.documents.forEach((d: FiscalDocument) => db.documents.set(d.id, d));
      }
      if (Array.isArray(parsed.customers)) {
        parsed.customers.forEach((c: Customer) => db.customers.set(c.id, c));
      }
      if (Array.isArray(parsed.suppliers)) {
        parsed.suppliers.forEach((s: Supplier) => db.suppliers.set(s.id, s));
      }
      if (Array.isArray(parsed.payments)) {
        parsed.payments.forEach((p: Payment) => db.payments.set(p.id, p));
      }

      this.persistToLocalStorage(db);
      db.notify();

      return {
        success: true,
        message: `Cópia restaurada com sucesso! ${parsed.products?.length || 0} produtos e ${parsed.documents?.length || 0} documentos carregados.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Erro ao importar ficheiro de backup: ${msg}` };
    }
  }
}
