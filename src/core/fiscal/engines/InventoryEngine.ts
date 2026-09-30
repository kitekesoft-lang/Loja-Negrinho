import { StockItem, StockMovement, StockMovementType, Warehouse } from '../types/erp';

export class InventoryEngine {
  /**
   * Processa movimentação de stock com cálculo de Custo Médio Ponderado (CMP)
   */
  public static processMovement(params: {
    stockItem: StockItem;
    movementType: StockMovementType;
    quantity: number;
    unitCost?: number;
    documentReference?: string;
    notes: string;
    userId: string;
  }): { updatedStockItem: StockItem; movement: StockMovement } {
    const { stockItem, movementType, quantity, documentReference, notes, userId } = params;

    if (quantity <= 0) {
      throw new Error('A quantidade da movimentação de stock deve ser superior a zero.');
    }

    let newCurrentQty = stockItem.currentQuantity;
    let newAvgCost = stockItem.averageCostPrice;
    const unitCost = params.unitCost ?? stockItem.averageCostPrice;

    switch (movementType) {
      case 'ENTRY_PURCHASE':
      case 'ADJUSTMENT_IN':
      case 'TRANSFER_IN':
      case 'RETURN_IN': {
        // Cálculo do Custo Médio Ponderado:
        // Novo CMP = (Valor Anterior + Valor Entrada) / Quantidade Total
        const previousValuation = stockItem.currentQuantity * stockItem.averageCostPrice;
        const incomingValuation = quantity * unitCost;
        newCurrentQty = stockItem.currentQuantity + quantity;
        newAvgCost = newCurrentQty > 0 ? (previousValuation + incomingValuation) / newCurrentQty : unitCost;
        break;
      }

      case 'EXIT_SALE':
      case 'ADJUSTMENT_OUT':
      case 'TRANSFER_OUT':
      case 'RETURN_OUT': {
        if (stockItem.currentQuantity < quantity) {
          throw new Error(
            `Ruptura de Stock: Quantidade disponível (${stockItem.currentQuantity}) é insuficiente para a saída solicitada (${quantity}).`
          );
        }
        newCurrentQty = stockItem.currentQuantity - quantity;
        break;
      }
    }

    const updatedStockItem: StockItem = {
      ...stockItem,
      currentQuantity: newCurrentQty,
      availableQuantity: newCurrentQty - stockItem.reservedQuantity,
      averageCostPrice: Math.round(newAvgCost * 100) / 100,
      totalValuation: Math.round(newCurrentQty * newAvgCost * 100) / 100,
      lastMovementDate: new Date().toISOString(),
    };

    const movement: StockMovement = {
      id: `MOV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      warehouseId: stockItem.warehouseId,
      productId: stockItem.productId,
      movementType,
      quantity,
      unitCost,
      totalCost: Math.round(quantity * unitCost * 100) / 100,
      documentReference,
      notes,
      date: new Date().toISOString(),
      userId,
    };

    return { updatedStockItem, movement };
  }

  /**
   * Valida se todos os produtos têm stock disponível antes de faturar
   */
  public static checkAvailability(
    items: { productId: string; quantity: number }[],
    stockMap: Map<string, StockItem>
  ): { available: boolean; ruptures: { productId: string; requested: number; available: number }[] } {
    const ruptures: { productId: string; requested: number; available: number }[] = [];

    for (const item of items) {
      // Procura stock do produto no armazém principal
      const stock = Array.from(stockMap.values()).find((s) => s.productId === item.productId);
      if (!stock || stock.availableQuantity < item.quantity) {
        ruptures.push({
          productId: item.productId,
          requested: item.quantity,
          available: stock ? stock.availableQuantity : 0,
        });
      }
    }

    return {
      available: ruptures.length === 0,
      ruptures,
    };
  }
}
