import { FiscalDatabase } from '../repository/FiscalDatabase';
import { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from '../types/erp';
import { InventoryEngine } from '../engines/InventoryEngine';

export class PurchaseEngine {
  /**
   * Cria nova Ordem de Compra a Fornecedor
   */
  public static createPurchaseOrder(params: {
    companyId: string;
    supplierId: string;
    warehouseId: string;
    expectedDeliveryDate: string;
    lines: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>;
    notes?: string;
  }): PurchaseOrder {
    const db = FiscalDatabase.getInstance();
    const supplier = db.suppliers.get(params.supplierId);
    if (!supplier) {
      throw new Error(`Fornecedor '${params.supplierId}' não encontrado.`);
    }

    const warehouse = db.warehouses.get(params.warehouseId);
    if (!warehouse) {
      throw new Error(`Armazém '${params.warehouseId}' não encontrado.`);
    }

    const orderLines: PurchaseOrderLine[] = [];
    let subtotal = 0;
    let taxTotal = 0;

    params.lines.forEach((l, idx) => {
      const product = db.products.get(l.productId);
      if (!product) {
        throw new Error(`Artigo '${l.productId}' não encontrado.`);
      }

      const lineNet = l.quantity * l.unitPrice;
      const lineTax = (lineNet * l.taxRate) / 100;
      const totalAmount = lineNet + lineTax;

      subtotal += lineNet;
      taxTotal += lineTax;

      orderLines.push({
        id: `POL-${idx + 1}-${Date.now().toString(36)}`,
        productId: product.id,
        productCode: product.code,
        description: product.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        taxAmount: Math.round(lineTax * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      });
    });

    const count = db.purchaseOrders.size + 1;
    const orderNumber = `OC-2026/${count.toString().padStart(4, '0')}`;

    const po: PurchaseOrder = {
      id: `PO-${Date.now().toString(36)}`,
      companyId: params.companyId,
      orderNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierTaxId: supplier.taxId,
      warehouseId: warehouse.id,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: params.expectedDeliveryDate,
      lines: orderLines,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round((subtotal + taxTotal) * 100) / 100,
      status: 'APPROVED',
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.purchaseOrders.set(po.id, po);
    db.notify();
    return po;
  }

  /**
   * Recepção física de mercadoria no armazém e entrada em stock
   */
  public static receivePurchaseOrder(orderId: string, userId: string): void {
    const db = FiscalDatabase.getInstance();
    const po = db.purchaseOrders.get(orderId);
    if (!po) {
      throw new Error(`Ordem de compra '${orderId}' não encontrada.`);
    }

    if (po.status === 'RECEIVED') {
      throw new Error(`Ordem de compra '${po.orderNumber}' já se encontra recebida em armazém.`);
    }

    // Processa entrada em stock para cada linha
    po.lines.forEach((line) => {
      // Procura ou cria StockItem
      let stock = Array.from(db.stockItems.values()).find(
        (s) => s.productId === line.productId && s.warehouseId === po.warehouseId
      );

      if (!stock) {
        stock = {
          id: `STK-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          warehouseId: po.warehouseId,
          productId: line.productId,
          currentQuantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          averageCostPrice: line.unitPrice,
          totalValuation: 0,
          minimumStock: 5,
          maximumStock: 1000,
          lastMovementDate: new Date().toISOString(),
        };
        db.stockItems.set(stock.id, stock);
      }

      const { updatedStockItem, movement } = InventoryEngine.processMovement({
        stockItem: stock,
        movementType: 'ENTRY_PURCHASE',
        quantity: line.quantity,
        unitCost: line.unitPrice,
        documentReference: po.orderNumber,
        notes: `Entrada por recepção da Encomenda a Fornecedor ${po.supplierName}`,
        userId,
      });

      db.stockItems.set(updatedStockItem.id, updatedStockItem);
      db.stockMovements.set(movement.id, movement);
    });

    po.status = 'RECEIVED';
    po.updatedAt = new Date().toISOString();
    db.purchaseOrders.set(po.id, po);
    db.notify();
  }
}
