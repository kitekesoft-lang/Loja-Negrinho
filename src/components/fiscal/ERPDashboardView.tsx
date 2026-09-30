import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { InventoryEngine } from '../../core/fiscal/engines/InventoryEngine';
import { AccountingEngine, PGC_ANGOLANO_CHART } from '../../core/fiscal/engines/AccountingEngine';
import {
  Package,
  Building2,
  BookOpen,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ERPDashboardView: React.FC = () => {
  const [subModule, setSubModule] = useState<'inventory' | 'treasury' | 'accounting' | 'commercial'>('inventory');
  const [db, setDb] = useState(FiscalDatabase.getInstance());
  const [, setTick] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, [db]);

  const stockItems = Array.from(db.stockItems.values());
  const warehouses = Array.from(db.warehouses.values());
  const bankAccounts = Array.from(db.bankAccounts.values());
  const cashSessions = Array.from(db.cashSessions.values());
  const cashMovements = Array.from(db.cashMovements.values());
  const commercialDocs = Array.from(db.commercialDocuments.values());
  const products = Array.from(db.products.values());
  const company = Array.from(db.companies.values())[0];

  // Totais de Stock
  const totalStockValuation = stockItems.reduce((acc, s) => acc + s.totalValuation, 0);
  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + b.balance, 0);
  const totalCashSession = cashSessions.reduce((acc, c) => acc + (c.status === 'OPEN' ? c.initialCashAmount + c.totalCashSales - c.totalOutflows : 0), 0);

  return (
    <div id="erp-dashboard-view" className="space-y-6">
      {/* Top Banner do ERP Integrado */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              FASE 4 CONCLUÍDA — ERP EMPRESARIAL
            </span>
            <span className="text-xs text-stone-500 font-mono">Angola PGC &amp; Commercial Suite</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Gestão Empresarial Integrada (ERP) e Núcleo Fiscal Angolano
          </h2>
          <p className="text-xs text-stone-600 max-w-3xl mt-1">
            Módulos integrados ao motor de facturação: Gestão de Armazéns e Stock Permanente (CMP), Tesouraria Multi-Banco (BAI, BFA) com Caixa Diário, Contabilidade Geral (PGC Angolano) e Circuito Comercial (Orçamentos).
          </p>
        </div>

        {/* Indicadores Globais do ERP */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 min-w-[140px]">
            <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
              Valorização Stock
            </span>
            <span className="text-sm font-bold text-stone-900">
              {totalStockValuation.toLocaleString('pt-AO')} <span className="text-xs font-normal">AOA</span>
            </span>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 min-w-[140px]">
            <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
              Disponibilidades
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {(totalBankBalance + totalCashSession).toLocaleString('pt-AO')} <span className="text-xs font-normal">AOA</span>
            </span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold underline ml-4 cursor-pointer">
            Fechar
          </button>
        </div>
      )}

      {/* Sub-navegação do Módulo ERP */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setSubModule('inventory')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            subModule === 'inventory'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Armazéns &amp; Stocks ({stockItems.length})</span>
        </button>

        <button
          onClick={() => setSubModule('treasury')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            subModule === 'treasury'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tesouraria, Caixa &amp; Bancos</span>
        </button>

        <button
          onClick={() => setSubModule('accounting')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            subModule === 'accounting'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Contabilidade Geral (PGC Angolano)</span>
        </button>

        <button
          onClick={() => setSubModule('commercial')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            subModule === 'commercial'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Circuito Comercial ({commercialDocs.length})</span>
        </button>
      </div>

      {/* Sub-modulo: Armazéns e Stock Permanente */}
      {subModule === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold">Armazém Central Activo</span>
              <h3 className="text-base font-bold text-stone-900 mt-1">{warehouses[0]?.name}</h3>
              <p className="text-xs text-stone-500 mt-0.5">{warehouses[0]?.location}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Armazém Principal Vinculado
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold">Regime de Custo de Stock</span>
              <h3 className="text-base font-bold text-stone-900 mt-1">Custo Médio Ponderado (CMP)</h3>
              <p className="text-xs text-stone-500 mt-0.5">Calculado atomicamente em cada entrada e recepção</p>
              <div className="mt-3 text-xs text-stone-600 font-mono">
                Formula: (Q_ant * C_ant + Q_ent * C_ent) / Q_total
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold">Controlo de Ruptura de Stock</span>
              <h3 className="text-base font-bold text-stone-900 mt-1">Prevenção em Tempo Real</h3>
              <p className="text-xs text-stone-500 mt-0.5">Facturas não debitam além do stock disponível</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                <Layers className="w-3.5 h-3.5" /> Auditoria Contínua
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Mapa de Existências e Inventário Permanente</h3>
              <span className="text-xs text-stone-500">{stockItems.length} artigos em gestão de stock</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Artigo / Código</th>
                    <th className="p-3 text-right">Qtd. Actual</th>
                    <th className="p-3 text-right">Reservado</th>
                    <th className="p-3 text-right">Disponível</th>
                    <th className="p-3 text-right">Custo Médio (CMP)</th>
                    <th className="p-3 text-right">Valorização Total</th>
                    <th className="p-3 text-center">Nível Mín/Máx</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {stockItems.map((stk) => {
                    const prod = db.products.get(stk.productId);
                    const isLowStock = stk.currentQuantity <= stk.minimumStock;
                    return (
                      <tr key={stk.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 font-medium text-stone-900">
                          <div>{prod?.description || stk.productId}</div>
                          <div className="text-[11px] text-stone-400 font-mono">{prod?.code || stk.productId}</div>
                        </td>
                        <td className="p-3 text-right font-bold">{stk.currentQuantity} {prod?.unit}</td>
                        <td className="p-3 text-right text-stone-500">{stk.reservedQuantity}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">{stk.availableQuantity}</td>
                        <td className="p-3 text-right font-mono">{stk.averageCostPrice.toLocaleString('pt-AO')} AOA</td>
                        <td className="p-3 text-right font-mono font-bold">{stk.totalValuation.toLocaleString('pt-AO')} AOA</td>
                        <td className="p-3 text-center text-stone-500">{stk.minimumStock} / {stk.maximumStock}</td>
                        <td className="p-3 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" /> Repor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modulo: Tesouraria, Bancos e Caixa */}
      {subModule === 'treasury' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contas Bancárias Oficiais */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-stone-700" /> Contas Bancárias Corporativas
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Bancos nacionais angolanos habilitados para liquidação</p>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                  {bankAccounts.length} Bancos Activos
                </span>
              </div>

              <div className="space-y-3">
                {bankAccounts.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{b.bankName}</h4>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">IBAN: {b.iban}</p>
                      <p className="text-[11px] text-stone-400">SWIFT: {b.swift}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 uppercase font-semibold block">Saldo Disponível</span>
                      <span className="text-sm font-bold text-stone-900 font-mono">
                        {b.balance.toLocaleString('pt-AO')} {b.currency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caixa Diário e Sessão Actual */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-stone-700" /> Sessão de Caixa Diário
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Abertura, fundo de maneio e sangrias auditadas</p>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                  Sessão ABERTA
                </span>
              </div>

              {cashSessions[0] && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Fundo de Caixa Inicial:</span>
                      <span className="font-bold text-stone-900 font-mono">{cashSessions[0].initialCashAmount.toLocaleString('pt-AO')} AOA</span>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Vendas Dinheiro:</span>
                      <span className="font-bold text-stone-900 font-mono">{cashSessions[0].totalCashSales.toLocaleString('pt-AO')} AOA</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Vendas Multicaixa:</span>
                      <span className="font-bold text-stone-900 font-mono">{cashSessions[0].totalMulticaixaSales.toLocaleString('pt-AO')} AOA</span>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Sangrias / Saídas:</span>
                      <span className="font-bold text-rose-700 font-mono">{cashSessions[0].totalOutflows.toLocaleString('pt-AO')} AOA</span>
                    </div>
                  </div>

                  {/* Movimentos de Sangria */}
                  <div className="border-t border-stone-200 pt-3">
                    <span className="font-bold text-stone-900 block mb-2">Últimos Movimentos de Tesouraria:</span>
                    <div className="space-y-2">
                      {cashMovements.map((m) => (
                        <div key={m.id} className="p-2.5 bg-stone-50 rounded border border-stone-200 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-semibold text-stone-900">{m.description}</span>
                            <span className="text-stone-400 block font-mono">{m.date.split('T')[0]}</span>
                          </div>
                          <span className="font-bold font-mono text-rose-700">
                            - {m.amount.toLocaleString('pt-AO')} AOA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-modulo: Contabilidade Geral PGC Angolano */}
      {subModule === 'accounting' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Plano Geral de Contabilidade de Angola (PGC)
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                Lançamentos automáticos por Partida Dobrada disparados na emissão de facturas (Classes 3, 7 e 34) e pagamentos (Classes 1 e 31).
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">
              Conforme Decreto Executivo 82/01
            </span>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200">
              <h4 className="text-sm font-bold text-stone-900">Quadro de Contas PGC Estruturadas</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Código PGC</th>
                    <th className="p-3">Designação da Conta</th>
                    <th className="p-3 text-center">Classe</th>
                    <th className="p-3 text-center">Natureza</th>
                    <th className="p-3">Finalidade Contabilística</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {PGC_ANGOLANO_CHART.map((acc) => (
                    <tr key={acc.code} className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold text-stone-900">{acc.code}</td>
                      <td className="p-3 font-semibold text-stone-800">{acc.name}</td>
                      <td className="p-3 text-center">Classe {acc.class}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          acc.type === 'DEBIT' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="p-3 text-stone-600">{acc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modulo: Circuito Comercial */}
      {subModule === 'commercial' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Documentos Comerciais &amp; Propostas de Venda</h3>
                <p className="text-xs text-stone-500 mt-0.5">Orçamentos com prazos de validade e cotação de IVA</p>
              </div>
              <span className="text-xs text-stone-500">{commercialDocs.length} documentos emitidos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Nº Documento / Tipo</th>
                    <th className="p-3">Cliente / Entidade</th>
                    <th className="p-3">Data / Validade</th>
                    <th className="p-3 text-right">Subtotal Líquido</th>
                    <th className="p-3 text-right">IVA</th>
                    <th className="p-3 text-right">Total Geral</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {commercialDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-stone-50">
                      <td className="p-3 font-medium text-stone-900">
                        <div>{doc.documentNumber}</div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-stone-900">{doc.customerName}</div>
                        <div className="text-[11px] text-stone-500">NIF: {doc.customerTaxId}</div>
                      </td>
                      <td className="p-3 text-stone-600">
                        <div>{doc.date}</div>
                        {doc.validUntil && <div className="text-[11px] text-stone-400">Válido até: {doc.validUntil}</div>}
                      </td>
                      <td className="p-3 text-right font-mono">{doc.subtotal.toLocaleString('pt-AO')} AOA</td>
                      <td className="p-3 text-right font-mono text-stone-600">{doc.taxTotal.toLocaleString('pt-AO')} AOA</td>
                      <td className="p-3 text-right font-bold font-mono text-emerald-800">
                        {doc.grandTotal.toLocaleString('pt-AO')} AOA
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800">
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
