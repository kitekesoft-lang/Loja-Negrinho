import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
} from 'lucide-react';

interface OperatorCashViewProps {
  currentUser: User;
}

export const OperatorCashView: React.FC<OperatorCashViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  const [outflowAmount, setOutflowAmount] = useState<number>(5000);
  const [outflowReason, setOutflowReason] = useState<string>('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  const activeSession = Array.from(db.cashSessions.values()).find((s) => s.status === 'OPEN');
  const movements = Array.from(db.cashMovements.values());

  const handleCreateOutflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) {
      setMsg({ type: 'error', text: 'Não existe nenhuma sessão de caixa aberta no momento.' });
      return;
    }
    if (outflowAmount <= 0) {
      setMsg({ type: 'error', text: 'Indique um valor válido para a sangria.' });
      return;
    }

    const currentCashBalance = activeSession.initialCashAmount + activeSession.totalCashSales - activeSession.totalOutflows;
    if (outflowAmount > currentCashBalance) {
      setMsg({ type: 'error', text: 'O valor da sangria excede o montante em dinheiro existente na gaveta.' });
      return;
    }

    const newMovId = `MOV-${Date.now().toString(36)}`;
    const newMov = {
      id: newMovId,
      sessionId: activeSession.id,
      companyId: activeSession.companyId || 'COMP-001',
      type: 'OUTFLOW_BLEED' as const,
      paymentMethod: 'CASH' as const,
      amount: outflowAmount,
      description: outflowReason || 'Sangria de Caixa / Depósito de Segurança',
      date: new Date().toISOString(),
      userId: currentUser.id,
    };

    activeSession.totalOutflows += outflowAmount;
    db.cashMovements.set(newMov.id, newMov);

    setMsg({
      type: 'success',
      text: `Sangria de ${outflowAmount.toLocaleString('pt-AO')} AOA registada com sucesso. Saldo actualizado!`,
    });
    setOutflowReason('');
  };

  const cashInDrawer = activeSession
    ? activeSession.initialCashAmount + activeSession.totalCashSales - activeSession.totalOutflows
    : 0;

  return (
    <div id="operator-cash-view" className="space-y-5">
      {/* Top Banner da Sessão de Caixa */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Gestão de Caixa &amp; Gaveta</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Sessão Activa
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Terminal: POS-01 • Operador Responsável: <strong>{currentUser.name}</strong>
            </p>
          </div>
        </div>

        <div className="text-right bg-stone-50 p-3 rounded-xl border border-stone-200">
          <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
            Dinheiro Físico na Gaveta
          </span>
          <span className="text-lg font-bold text-emerald-700 font-mono">
            {cashInDrawer.toLocaleString('pt-AO')} <span className="text-xs font-normal">AOA</span>
          </span>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold underline ml-4 cursor-pointer">
            Fechar
          </button>
        </div>
      )}

      {/* Cartões de Indicadores do Caixa */}
      {activeSession && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block">Fundo de Maneio Inicial</span>
            <span className="text-base font-bold text-stone-900 font-mono mt-1 block">
              {activeSession.initialCashAmount.toLocaleString('pt-AO')} AOA
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block">Vendas em Numerário</span>
            <span className="text-base font-bold text-emerald-700 font-mono mt-1 block">
              + {activeSession.totalCashSales.toLocaleString('pt-AO')} AOA
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block">Vendas Multicaixa (TPA)</span>
            <span className="text-base font-bold text-blue-700 font-mono mt-1 block">
              {activeSession.totalMulticaixaSales.toLocaleString('pt-AO')} AOA
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block">Total de Sangrias / Saídas</span>
            <span className="text-base font-bold text-rose-700 font-mono mt-1 block">
              - {activeSession.totalOutflows.toLocaleString('pt-AO')} AOA
            </span>
          </div>
        </div>
      )}

      {/* Grid: Registar Sangria e Lista de Movimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Formulário de Sangria Rápida */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-200 pb-3">
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-rose-600" /> Registar Sangria / Saída de Caixa
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Retirada de numerário da gaveta para cofre de segurança ou despesa miúda
            </p>
          </div>

          <form onSubmit={handleCreateOutflow} className="space-y-3 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Montante a Retirar (AOA)</label>
              <input
                type="number"
                min={100}
                step={500}
                value={outflowAmount}
                onChange={(e) => setOutflowAmount(Number(e.target.value))}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono text-sm focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Motivo da Saída</label>
              <input
                type="text"
                placeholder="Ex: Depósito para cofre de segurança"
                value={outflowReason}
                onChange={(e) => setOutflowReason(e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Confirmar Retirada
            </button>
          </form>
        </div>

        {/* Histórico de Movimentos da Sessão */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-900">Movimentos de Sangria e Ajustes</h3>
            <span className="text-[11px] text-stone-500">{movements.length} movimentos registados</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Descrição / Motivo</th>
                  <th className="p-3 text-right">Montante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-stone-400">
                      Nenhum movimento de sangria registado nesta sessão.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono text-stone-600">{m.date.split('T')[0]}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                          {m.type}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-stone-900">{m.description}</td>
                      <td className="p-3 text-right font-bold font-mono text-rose-700">
                        - {m.amount.toLocaleString('pt-AO')} AOA
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
