import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import {
  PackagePlus,
  ArrowDownCircle,
  Sliders,
  History,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface OperatorStockViewProps {
  currentUser: User;
}

export const OperatorStockView: React.FC<OperatorStockViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  const [activeTab, setActiveTab] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'HISTORICO'>('ENTRADA');

  // Form de Entrada de mercadorias
  const [selectedProductId, setSelectedProductId] = useState('P001');
  const [quantity, setQuantity] = useState<string>('10');
  const [purchasePrice, setPurchasePrice] = useState<string>('0,00');
  const [selectedSupplierId, setSelectedSupplierId] = useState('SUP-LIMA');
  const [entryDate, setEntryDate] = useState('2025-09-30');
  const [notes, setNotes] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  const suppliers = Array.from(db.suppliers.values());
  const allDbProducts = Array.from(db.products.values());

  // Obter stock real de todos os produtos da base de dados fiscal
  const liveAlertItems = allDbProducts.map((p) => {
    const stock = Array.from(db.stockItems.values()).find((s) => s.productId === p.id);
    const qty = stock ? stock.currentQuantity : 10;
    const min = stock ? stock.minimumStock : 5;
    return {
      id: p.id,
      name: p.description,
      stock: qty,
      min,
      isLow: qty <= min,
    };
  });

  const handleRegisterEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) return;

    let stockItem = Array.from(db.stockItems.values()).find((s) => s.productId === selectedProductId);
    const mainWarehouse = Array.from(db.warehouses.values())[0];

    if (!stockItem && mainWarehouse) {
      const stockId = `STK-${Date.now().toString(36)}`;
      stockItem = {
        id: stockId,
        warehouseId: mainWarehouse.id,
        productId: selectedProductId,
        currentQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        averageCostPrice: 3000,
        totalValuation: 0,
        minimumStock: 10,
        maximumStock: 500,
        lastMovementDate: new Date().toISOString(),
      };
      db.stockItems.set(stockId, stockItem);
    }

    if (stockItem) {
      stockItem.currentQuantity += qtyNum;
      stockItem.availableQuantity += qtyNum;
      stockItem.lastMovementDate = new Date().toISOString();
      db.stockItems.set(stockItem.id, stockItem);
    }

    // Registar movimento
    const movId = `MOV-${Date.now().toString(36)}`;
    db.stockMovements.set(movId, {
      id: movId,
      warehouseId: stockItem ? stockItem.warehouseId : 'WAR-001',
      productId: selectedProductId,
      movementType: 'ENTRY_PURCHASE',
      quantity: qtyNum,
      unitCost: 3500,
      totalCost: qtyNum * 3500,
      documentReference: 'ENTRADA-LOJA',
      notes: notes || 'Entrada manual de mercadorias',
      date: new Date().toISOString(),
      userId: currentUser.id,
    });

    const prodObj = db.products.get(selectedProductId);
    setFeedbackSuccess(`Entrada de ${qtyNum} unidades de "${prodObj?.description || 'Produto'}" registada!`);
    setQuantity('10');
    setNotes('');
    setTick((t) => t + 1);
    setTimeout(() => setFeedbackSuccess(null), 3500);
  };

  return (
    <div id="operator-stock-view" className="space-y-4">
      {/* 1. Abas Superiores de Estoque */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2">
        <button
          onClick={() => setActiveTab('ENTRADA')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ENTRADA'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Entrada de mercadorias
        </button>

        <button
          onClick={() => setActiveTab('SAIDA')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'SAIDA'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Saída de mercadorias
        </button>

        <button
          onClick={() => setActiveTab('AJUSTE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'AJUSTE'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Ajuste de estoque
        </button>

        <button
          onClick={() => setActiveTab('HISTORICO')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'HISTORICO'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Histórico
        </button>
      </div>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* 2. Grid de Conteúdo: Formulário à Esquerda + Tabela Alertas à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Lado Esquerdo: Formulário de Entrada (7 colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-4">
            Entrada de mercadorias
          </h2>

          <form onSubmit={handleRegisterEntry} className="space-y-3.5 text-xs">
            {/* Produto */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Produto</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {allDbProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.description} {p.barcode ? `(${p.barcode.slice(-4)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantidade e Valor de Compra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Quantidade</label>
                <input
                  type="text"
                  placeholder="Ex: 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Valor de compra <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Fornecedor */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Fornecedor</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Data</label>
              <div className="relative">
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Observações</label>
              <textarea
                rows={2}
                placeholder="Observações..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              ></textarea>
            </div>

            {/* Botão Verde Registar Entrada */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Registar entrada</span>
            </button>
          </form>
        </div>

        {/* Lado Direito: Estoque Atual (Alertas) (5 colunas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Estoque atual <span className="text-red-500 font-semibold text-xs">(alertas)</span>
            </h2>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2.5">Produto</th>
                  <th className="pb-2.5 text-center">Estoque</th>
                  <th className="pb-2.5 text-right">Mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {liveAlertItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-bold text-slate-800">{item.name}</td>
                    <td className="py-2.5 text-center font-bold">
                      <span className={item.isLow ? 'text-red-500' : 'text-emerald-600'}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {item.isLow ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ffedd5] text-[#c2410c]">
                          {item.min}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
                          {item.min}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
