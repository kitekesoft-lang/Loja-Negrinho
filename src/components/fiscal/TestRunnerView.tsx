import React, { useState, useEffect } from 'react';
import { FiscalTestSuite, TestSuiteSummary } from '../../core/fiscal/tests/fiscalTestSuite';
import { CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck, Clock, Layers, Filter } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [testSummary, setTestSummary] = useState<TestSuiteSummary | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const runTests = () => {
    setIsRunning(true);
    // Pequeno atraso para feedback visual
    setTimeout(() => {
      const summary = FiscalTestSuite.runAll();
      setTestSummary(summary);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    runTests();
  }, []);

  const categories = testSummary
    ? ['ALL', ...Array.from(new Set(testSummary.results.map((r) => r.category)))]
    : ['ALL'];

  const filteredResults = testSummary
    ? testSummary.results.filter(
        (r) => selectedCategory === 'ALL' || r.category === selectedCategory
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Execution bar */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              FASE 1 — SUITE DE VALIDAÇÃO
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500">Conformidade com Requisitos 1.1 a 1.19</span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 mt-1">
            Testes Automatizados do Núcleo Fiscal Angolano
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl">
            Bateria completa de validações unitárias e de integração: cálculo de impostos (IVA 14%, 7%, 5%, 0% isenções M00-M99), retenção 6.5%, validação de NIF, controle estrito de séries atómicas sem furos, encadeamento SHA-256, assinatura digital RSA-2048, Código QR Fiscal AGT, Portal Público de Validação e Autenticação com Segregação Admin A vs Admin B.
          </p>
        </div>

        <button
          id="btn-run-tests"
          onClick={runTests}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>A Executar Testes...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-amber-400" />
              <span>Reexecutar Todos os Testes</span>
            </>
          )}
        </button>
      </div>

      {/* Metric Cards */}
      {testSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs font-medium text-stone-500">Total de Casos de Teste</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{testSummary.total}</span>
              <span className="text-xs text-stone-400">testes</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500 flex items-center gap-1">
              <Layers className="w-3 h-3 text-stone-400" /> 100% de cobertura Fase 1
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <span className="text-xs font-medium text-emerald-800">Testes Aprovados</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{testSummary.passed}</span>
              <span className="text-xs text-emerald-600">({Math.round((testSummary.passed / testSummary.total) * 100)}%)</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conformidade legal estrita
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs font-medium text-stone-500">Testes Falhados</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${testSummary.failed > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
                {testSummary.failed}
              </span>
              <span className="text-xs text-stone-400">falhas</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              {testSummary.failed === 0 ? 'Nenhuma anomalia detectada' : 'Atenção aos erros'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-xs font-medium text-stone-500">Tempo de Execução Total</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{testSummary.durationMs}</span>
              <span className="text-xs text-stone-400">ms</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" /> Execução determinística local
            </div>
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
        <span className="text-xs font-medium text-stone-500 shrink-0 mr-1">Filtrar Categoria:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-stone-900 text-white'
                : 'bg-stone-200/70 hover:bg-stone-300/70 text-stone-700'
            }`}
          >
            {cat === 'ALL' ? 'Todas as Categorias' : cat}
          </button>
        ))}
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {filteredResults.map((test) => {
          const isPassed = test.status === 'PASSED';
          return (
            <div
              key={test.id + test.name}
              className={`p-4 rounded-xl border transition-all ${
                isPassed
                  ? 'bg-white border-stone-200 hover:border-emerald-300'
                  : 'bg-rose-50 border-rose-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {test.id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                        {test.category}
                      </span>
                      <span className="text-xs text-stone-400">{test.durationMs} ms</span>
                    </div>
                    <h3 className="text-sm font-semibold text-stone-900 mt-1">
                      {test.name}
                    </h3>
                  </div>
                </div>

                <div className="shrink-0 sm:self-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isPassed ? 'APROVADO' : 'FALHOU'}
                  </span>
                </div>
              </div>

              {/* Assertions / details */}
              {test.assertionDetails && test.assertionDetails.length > 0 && (
                <div className="mt-3 pl-8 space-y-1">
                  {test.assertionDetails.map((a, idx) => (
                    <div key={idx} className="text-xs text-stone-600 flex items-start gap-1.5 font-mono">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {test.errorMessage && (
                <div className="mt-3 pl-8 text-xs text-rose-700 font-mono bg-rose-100/60 p-2.5 rounded-lg border border-rose-200">
                  <strong>Erro:</strong> {test.errorMessage}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
