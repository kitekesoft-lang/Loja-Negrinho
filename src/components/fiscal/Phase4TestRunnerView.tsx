import React, { useState } from 'react';
import { Phase4TestSuite, Phase4SuiteSummary } from '../../core/fiscal/tests/Phase4TestSuite';
import { Play, CheckCircle2, XCircle, Clock, ShieldCheck, Award, RefreshCw, Layers } from 'lucide-react';

export const Phase4TestRunnerView: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<Phase4SuiteSummary | null>(null);

  const handleRunTests = async () => {
    setRunning(true);
    try {
      const result = await Phase4TestSuite.runAllTests();
      setSuiteResult(result);
    } catch (err) {
      console.error('Erro na execução dos testes da Fase 4:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div id="phase4-test-runner-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              FASE 4 — ERP EMPRESARIAL INTEGRADO
            </span>
            <span className="text-xs text-stone-500 font-mono">Bateria de Homologação</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Validação Automatizada dos Módulos ERP (Fase 4)
          </h2>
          <p className="text-xs text-stone-600 max-w-2xl mt-1">
            Conjunto de testes exaustivos para o ecossistema ERP: Circuito de Compras e Recepção em Armazém, Cálculo Dinâmico de CMP, Prevenção de Ruptura de Stock, Sessões e Sangrias de Caixa, Partidas Dobradas PGC e Documentos Comerciais.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>A Executar Testes ERP...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Executar Bateria Fase 4</span>
            </>
          )}
        </button>
      </div>

      {/* Resumo da Execução */}
      {suiteResult && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block">Total de Cenários</span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block">
              {suiteResult.summary.total}
            </span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <span className="text-xs text-emerald-700 font-semibold block">Aprovados</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">
              {suiteResult.summary.passed}
            </span>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm">
            <span className="text-xs text-rose-700 font-semibold block">Falhas</span>
            <span className="text-2xl font-bold text-rose-800 mt-1 block">
              {suiteResult.summary.failed}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block">Tempo Total</span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block font-mono">
              {suiteResult.summary.durationMs} <span className="text-xs font-normal">ms</span>
            </span>
          </div>
        </div>
      )}

      {/* Lista de Testes */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Resultados da Bateria de Testes ERP</h3>
          <span className="text-xs text-stone-500">
            {suiteResult ? `${suiteResult.results.length} testes concluídos` : 'Carregue no botão acima para iniciar'}
          </span>
        </div>

        {!suiteResult ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            <Layers className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            Nenhuma execução realizada nesta sessão. Carregue em "Executar Bateria Fase 4" para auditar os módulos ERP.
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {suiteResult.results.map((test) => (
              <div key={test.id} className="p-4 hover:bg-stone-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {test.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-stone-900">{test.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                          {test.category}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900">{test.name}</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{test.description}</p>
                      
                      <div className="mt-2 text-xs space-y-1 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <div className="text-stone-600">
                          <strong className="text-stone-700">Esperado:</strong> {test.expected}
                        </div>
                        <div className={test.passed ? 'text-emerald-800' : 'text-rose-800 font-bold'}>
                          <strong className="text-stone-700">Obtido:</strong> {test.actual}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[11px] text-stone-400 font-mono">
                      {test.executionTimeMs} ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
