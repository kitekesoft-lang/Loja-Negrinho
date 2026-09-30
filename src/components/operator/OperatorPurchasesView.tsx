import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import {
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  DollarSign,
  PackageCheck,
  Building2,
  FileText,
  X,
  CheckCircle2,
  ArrowUpRight,
  Eye,
} from 'lucide-react';

interface PurchaseRecord {
  id: string;
  orderNumber: string;
  supplierName: string;
  supplierId: string;
  date: string;
  itemsSummary: string;
  totalAmount: number;
  status: 'RECEBIDO' | 'PENDENTE';
}

interface OperatorPurchasesViewProps {
  currentUser: User;
}

export const OperatorPurchasesView: React.FC<OperatorPurchasesViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);

  // Form states
  const [supplierId, setSupplierId] = useState('SUP-LIMA');
  const [productId, setProductId] = useState('P001');
  const [quantity, setQuantity] = useState<string>('20');
  const [costPrice, setCostPrice] = useState<string>('3500');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('2025-09-30');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  // Lista padrão baseada no layout do mockup
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([
    {
      id: 'PUR-001',
      orderNumber: 'CMP-2025-001',
      supplierName: 'Distribuidora Lima',
      supplierId: 'SUP-LIMA',
      date: '29/09/2025',
      itemsSummary: 'Arroz (20), Açúcar (15)',
      totalAmount: 185000,
      status: 'RECEBIDO',
    },
    {
      id: 'PUR-002',
      orderNumber: 'CMP-2025-002',
      supplierName: 'Comércio do Povo',
      supplierId: 'SUP-POVO',
      date: '27/09/2025',
      itemsSummary: 'Óleo (10), Sabão (30)',
      totalAmount: 94000,
      status: 'RECEBIDO',
    },
    {
      id: 'PUR-003',
      orderNumber: 'CMP-2025-003',
      supplierName: 'AgroAlimentos',
      supplierId: 'SUP-AGRO',
      date: '25/09/2025',
      itemsSummary: 'Farinha (25), Sal (50)',
      totalAmount: 45000,
      status: 'RECEBIDO',
    },
    {
      id: 'PUR-004',
      orderNumber: 'CMP-2025-004',
      supplierName: 'FarmaVida',
      supplierId: 'SUP-FARMA',
      date: '22/09/2025',
      itemsSummary: 'Álcool (20), Papel (40)',
      totalAmount: 68000,
      status: 'RECEBIDO',
    },
  ]);

  const suppliers = Array.from(db.suppliers.values());
  const products = Array.from(db.products.values());

  const totalSpent = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  const filtered = purchases.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.orderNumber.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      p.itemsSummary.toLowerCase().includes(q) ||
      p.date.includes(q)
    );
  });

  const handleRegisterPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    const unitCost = parseFloat(costPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(unitCost) || unitCost <= 0) return;

    const supplier = db.suppliers.get(supplierId);
    const product = db.products.get(productId);
    const supName = supplier ? supplier.name : 'Distribuidora Lima';
    const prodName = product ? product.description : 'Produto';

    const orderNum = invoiceNumber.trim() || `CMP-2025-00${purchases.length + 1}`;
    const total = qty * unitCost;

    const newRecord: PurchaseRecord = {
      id: `PUR-${Date.now().toString(36)}`,
      orderNumber: orderNum,
      supplierName: supName,
      supplierId,
      date: new Date().toLocaleDateString('pt-AO'),
      itemsSummary: `${prodName} (${qty})`,
      totalAmount: total,
      status: 'RECEBIDO',
    };

    setPurchases([newRecord, ...purchases]);

    // Atualizar stock no FiscalDatabase
    let stockItem = Array.from(db.stockItems.values()).find((s) => s.productId === productId);
    const mainWarehouse = Array.from(db.warehouses.values())[0];

    if (!stockItem && mainWarehouse) {
      const stockId = `STK-${Date.now().toString(36)}`;
      stockItem = {
        id: stockId,
        warehouseId: mainWarehouse.id,
        productId,
        currentQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        averageCostPrice: unitCost,
        totalValuation: 0,
        minimumStock: 5,
        maximumStock: 200,
        lastMovementDate: new Date().toISOString(),
      };
      db.stockItems.set(stockId, stockItem);
    }

    if (stockItem) {
      stockItem.currentQuantity += qty;
      stockItem.availableQuantity += qty;
      stockItem.averageCostPrice = unitCost;
      stockItem.totalValuation += total;
      stockItem.lastMovementDate = new Date().toISOString();
      db.stockItems.set(stockItem.id, stockItem);
    }

    // Registar movimento de inventário
    const movId = `MOV-${Date.now().toString(36)}`;
    db.stockMovements.set(movId, {
      id: movId,
      warehouseId: stockItem ? stockItem.warehouseId : 'WAR-001',
      productId,
      movementType: 'ENTRY_PURCHASE',
      quantity: qty,
      unitCost: unitCost,
      totalCost: total,
      documentReference: orderNum,
      notes: `Compra a ${supName}`,
      date: new Date().toISOString(),
      userId: currentUser.id,
    });

    setFeedbackSuccess(`Compra ${orderNum} registrada e estoque aumentado em +${qty} unidades!`);
    setTimeout(() => setFeedbackSuccess(null), 4000);

    setShowAddModal(false);
    setInvoiceNumber('');
    setQuantity('10');
    setTick((t) => t + 1);
  };

  return (
    <div id="operator-purchases-view" className="space-y-4">
      {/* 1. Header & Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            Compras &amp; Entradas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro de compras a fornecedores e conferência de faturas de entrada.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Compra</span>
        </button>
      </div>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {feedbackSuccess}
        </div>
      )}

      {/* 2. Cartões de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Compras</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {totalSpent.toLocaleString('pt-AO')} Kz
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Compras Recebidas</span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
              {purchases.filter((p) => p.status === 'RECEBIDO').length} Pedidos
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Fornecedores Ativos</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {suppliers.length || 4} Parceiros
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Barra de Pesquisa */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nº de pedido, fornecedor, itens ou data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 4. Tabela de Compras */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">N.º Compra</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Itens / Descrição</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{p.orderNumber}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.supplierName}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.date}</td>
                  <td className="py-3 px-4 text-slate-700">{p.itemsSummary}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                    {p.totalAmount.toLocaleString('pt-AO')} Kz
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Recebido
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedPurchase(p)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Compra */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                Registrar Nova Compra de Mercadoria
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterPurchase} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fornecedor *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="SUP-LIMA">Distribuidora Lima</option>
                    <option value="SUP-POVO">Comércio do Povo</option>
                    <option value="SUP-AGRO">AgroAlimentos</option>
                    <option value="SUP-FARMA">FarmaVida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    N.º da Factura / Recibo do Fornecedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: FT-LIMA/2025/89"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Artigo / Produto a Receber *
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {Array.from(db.products.values()).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.description} {p.barcode ? `(${p.barcode.slice(-4)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Preço Unitário de Custo (Kz) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Total preview */}
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900">Total da Entrada:</span>
                <span className="text-sm font-bold text-blue-700 font-mono">
                  {(
                    (parseInt(quantity, 10) || 0) * (parseFloat(costPrice) || 0)
                  ).toLocaleString('pt-AO')}{' '}
                  Kz
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Confirmar e Dar Entrada no Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Detalhes da Compra #{selectedPurchase.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fornecedor:</span>
                <span className="font-bold text-slate-800">{selectedPurchase.supplierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Data de Entrada:</span>
                <span className="font-mono text-slate-800">{selectedPurchase.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Produtos / Quantidades:</span>
                <span className="font-medium text-slate-800">{selectedPurchase.itemsSummary}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Valor Total Pago:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  {selectedPurchase.totalAmount.toLocaleString('pt-AO')} Kz
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status no Inventário:</span>
                <span className="font-bold text-emerald-700">Stock Atualizado em Loja</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPurchase(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
