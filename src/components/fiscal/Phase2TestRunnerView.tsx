import React, { useState } from 'react';
import { Phase2TestSuite, Phase2TestResult } from '../../core/fiscal/tests/Phase2TestSuite';
import { CheckCircle2, XCircle, Play, ShieldAlert, Cpu, Clock, RefreshCw } from 'lucide-react';

export const Phase2TestRunnerView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Phase2TestResult[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
  } | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    try {
      const data = await Phase2TestSuite.runAllTests();
      setResults(data.results);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Erro ao executar testes da Fase 2:', err);
      setErrorMessage(err?.message || 'Erro inesperado ao executar a suíte de testes.');
    } finally {
      setIsRunning(false);
    }
  };

  const categoryLabels: Record<string, { label: string; color: string }> = {
    SIGNATURE: { label: 'Assinatura RSA-2048', color: 'bg-purple-100 text-purple-800' },
    CONNECTOR: { label: 'Web Services AGT', color: 'bg-blue-100 text-blue-800' },
    IDEMPOTENCY: { label: 'Idempotência Estrita', color: 'bg-emerald-100 text-emerald-800' },
    QUEUE: { label: 'Fila Assíncrona', color: 'bg-amber-100 text-amber-800' },
    CONTINGENCY: { label: 'Contingência & Backoff', color: 'bg-rose-100 text-rose-800' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <Cpu className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              SUÍTE DE TESTES RIGOROSOS — FASE 2
            </span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 mt-1">
            Validação Criptográfica &amp; Tolerância a Falhas dos Web Services AGT
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl">
            Testes automatizados cobrindo geração e rejeição de assinaturas RSA adulteradas, segregação de ambientes, idempotência em transmissões repetidas, enfileiramento assíncrono e actuação de contingência com backoff exponencial.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>A Executar Suíte de Testes...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Executar Todos os Testes da Fase 2</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl text-xs bg-rose-50 text-rose-900 border border-rose-200 flex items-center justify-between gap-3">
          <span className="font-semibold">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Resumo da Execução */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] text-stone-500 font-medium">Total de Testes</span>
            <div className="text-xl font-bold font-mono text-stone-900 mt-1">{summary.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] text-emerald-700 font-medium">Aprovados</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{summary.passed}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] text-rose-700 font-medium">Falhados</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">{summary.failed}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] text-stone-600 font-medium">Tempo de Execução</span>
            <div className="text-xl font-bold font-mono text-stone-900 mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>{summary.durationMs} ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Resultados */}
      {results ? (
        <div className="space-y-3">
          {results.map((res) => {
            const cat = categoryLabels[res.category] || {
              label: res.category,
              color: 'bg-stone-100 text-stone-800',
            };

            return (
              <div
                key={res.id}
                className={`p-4 rounded-xl border transition-all ${
                  res.passed
                    ? 'bg-white border-emerald-200/80 shadow-xs'
                    : 'bg-rose-50/40 border-rose-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    {res.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-stone-900">{res.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${cat.color}`}>
                          {cat.label}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900">{res.name}</h4>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">{res.description}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-stone-400 shrink-0 self-end sm:self-center">
                    {res.executionTimeMs} ms
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-stone-50 border border-stone-200/70">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block mb-0.5">
                      Resultado Esperado:
                    </span>
                    <span className="text-stone-800">{res.expected}</span>
                  </div>

                  <div
                    className={`p-2 rounded border ${
                      res.passed
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase block mb-0.5 opacity-70">
                      Resultado Obtido:
                    </span>
                    <span>{res.actual}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-800">Suíte de Testes Pronta para Validação</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Clique no botão acima para iniciar os testes unitários e de integração da Fase 2. Todos os requisitos fiscais e de contingência serão checados em tempo real.
          </p>
        </div>
      )}
    </div>
  );
};
