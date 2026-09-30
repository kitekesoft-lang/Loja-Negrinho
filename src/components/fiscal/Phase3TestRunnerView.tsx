import React, { useState } from 'react';
import { Phase3TestSuite, Phase3TestResult } from '../../core/fiscal/tests/Phase3TestSuite';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  FileCode,
  Clock,
  Award,
} from 'lucide-react';

export const Phase3TestRunnerView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Phase3TestResult[] | null>(null);
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
      const data = await Phase3TestSuite.runAllTests();
      setResults(data.results);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Erro ao executar testes da Fase 3:', err);
      setErrorMessage(err?.message || 'Erro inesperado ao executar a suíte de testes.');
    } finally {
      setIsRunning(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'EXTRACTION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VALIDATION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'XML_STRUCTURE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'RECTIFICATION':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REPRODUCIBILITY':
        return 'bg-stone-100 text-stone-800 border-stone-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
              <Award className="w-3.5 h-3.5 mr-1 text-amber-700" /> SUÍTE DE TESTES AUTOMATIZADOS
            </span>
            <span className="text-stone-400 text-xs">|</span>
            <span className="text-stone-500 text-xs font-mono">FASE 3: SAF-T(AO) &amp; XSD</span>
          </div>
          <h2 className="text-lg font-bold text-stone-900">
            Validação de Extracção, Builders Desacoplados e Conformidade XSD
          </h2>
          <p className="text-xs text-stone-500 max-w-3xl leading-relaxed">
            Testes automatizados cobrindo a integridade dos cabeçalhos, integridade referencial de clientes/artigos em MasterFiles, serialização XML em conformidade com o namespace oficial da AGT e detecção proactiva de divergências aritméticas.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isRunning ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-stone-950" />
          )}
          <span>{isRunning ? 'A Executar Testes...' : 'Executar Todos os Testes da Fase 3'}</span>
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
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Total de Testes</span>
            <span className="text-xl font-bold text-stone-900">{summary.total}</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Aprovados</span>
            <span className="text-xl font-bold text-emerald-700">{summary.passed}</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Falhados</span>
            <span className={`text-xl font-bold ${summary.failed > 0 ? 'text-rose-700' : 'text-stone-400'}`}>
              {summary.failed}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Tempo Total</span>
            <span className="text-xl font-bold text-stone-900 font-mono">{summary.durationMs}ms</span>
          </div>
        </div>
      )}

      {/* Lista de Resultados dos Testes */}
      {results ? (
        <div className="space-y-3">
          {results.map((test) => (
            <div
              key={test.id}
              className={`p-4 rounded-xl border bg-white shadow-2xs transition-all ${
                test.passed ? 'border-stone-200' : 'border-rose-300 ring-1 ring-rose-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {test.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-mono text-xs font-bold text-stone-500">[{test.id}]</span>
                  <h3 className="font-bold text-stone-900 text-sm">{test.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadge(
                      test.category
                    )}`}
                  >
                    {test.category}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-mono text-stone-400">
                    <Clock className="w-3 h-3 mr-1" /> {test.executionTimeMs}ms
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 mb-3 ml-7">{test.description}</p>

              <div className="ml-7 bg-stone-50 p-3 rounded-lg border border-stone-200/80 font-mono text-xs space-y-1">
                <div className="text-stone-500">
                  <strong className="text-stone-700">Esperado:</strong> {test.expected}
                </div>
                <div className={test.passed ? 'text-emerald-700' : 'text-rose-700 font-bold'}>
                  <strong className="text-stone-700">Obtido:</strong> {test.actual}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-700">Nenhum teste executado ainda</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
            Clique no botão acima para iniciar a validação de ponta a ponta do motor SAF-T(AO).
          </p>
        </div>
      )}
    </div>
  );
};
