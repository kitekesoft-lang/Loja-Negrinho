import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { AGTTransmissionStatus, AGTEnvironment } from '../../core/fiscal/types/agt';
import { SignatureService } from '../../core/fiscal/security/SignatureService';
import {
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Shield,
  KeyRound,
  RotateCw,
  Server,
  Zap,
} from 'lucide-react';

export const AGTIntegrationView: React.FC = () => {
  const db = FiscalDatabase.getInstance();
  const queue = db.agtQueue;
  const connector = queue.getConnector();

  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, [db]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [simConfig, setSimConfig] = useState(connector.getSimulatorConfig());
  const [activeEnv, setActiveEnv] = useState<AGTEnvironment>(connector.getEnvironment());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const queueItems = queue.getAll();
  const certInfo = SignatureService.getCertificateInfo();
  const credentials = connector.getCredentials();

  // Estatísticas da Fila
  const stats = {
    total: queueItems.length,
    accepted: queueItems.filter((i) => i.status === 'ACCEPTED').length,
    queued: queueItems.filter((i) => i.status === 'QUEUED' || i.status === 'IN_FLIGHT').length,
    contingency: queueItems.filter((i) => i.status === 'FAILED_CONTINGENCY').length,
    rejected: queueItems.filter((i) => i.status === 'REJECTED').length,
  };

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await queue.processQueue();
      if (res.processed === 0) {
        setFeedback({ type: 'success', message: 'Fila vazia ou sem documentos pendentes para envio.' });
      } else {
        setFeedback({
          type: res.failed > 0 ? 'error' : 'success',
          message: `Processamento concluído: ${res.succeeded} aceite(s) pela AGT, ${res.failed} em contingência/rejeição.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Falha ao processar fila.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryItem = async (id: string) => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const item = await queue.retryItem(id);
      if (item.status === 'ACCEPTED') {
        setFeedback({
          type: 'success',
          message: `Documento ${item.documentNumber} transmitido com sucesso! Recibo: ${item.response?.receiptNumber}`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: `Tentativa falhou para ${item.documentNumber}: ${item.lastError}`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Falha ao reenviar item.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchEnvironment = (env: AGTEnvironment) => {
    setActiveEnv(env);
    connector.setEnvironment(env);
    setFeedback({
      type: 'success',
      message: `Ambiente de comunicação alterado para ${env} (${connector.getCredentials().apiBaseUrl}).`,
    });
  };

  const handleUpdateSimulator = (updates: Partial<typeof simConfig>) => {
    const updated = { ...simConfig, ...updates };
    setSimConfig(updated);
    connector.updateSimulatorConfig(updated);
  };

  const selectedItem = queueItems.find((i) => i.id === selectedQueueId) || queueItems[0];

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo AGT */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <Server className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              FASE 2 — INTEGRAÇÃO AGT &amp; WEB SERVICES
            </span>
            <span className="text-stone-400">|</span>
            <span className="text-xs font-mono text-stone-600">Portaria n.º 292/18 AGT</span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 mt-1">
            Gestão de Transmissão Oficial e Fila de Contingência
          </h2>
          <p className="text-xs text-stone-500 max-w-3xl">
            Comunicação desacoplada entre o motor de facturação e os Web Services da AGT. Assinatura digital RSA-2048/SHA-256, garantia de idempotência, persistência de recibos e tolerância a falhas de rede com backoff exponencial.
          </p>
        </div>

        {/* Environment Selector */}
        <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 shrink-0">
          <span className="text-xs font-medium text-stone-700">Ambiente AGT:</span>
          <button
            onClick={() => handleSwitchEnvironment('HOMOLOGATION')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeEnv === 'HOMOLOGATION'
                ? 'bg-amber-400 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            Homologação
          </button>
          <button
            onClick={() => handleSwitchEnvironment('PRODUCTION')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeEnv === 'PRODUCTION'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            Produção
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 font-medium">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Total na Fila</span>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-emerald-700 font-medium">Aceites pela AGT</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{stats.accepted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-amber-700 font-medium">Pendentes / Em Voo</span>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">{stats.queued}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-rose-700 font-medium">Modo Contingência</span>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">{stats.contingency}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-600 font-medium">Rejeitados</span>
          <div className="text-xl font-bold font-mono text-stone-600 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* 3. Sub-Painéis: Segurança & Certificados RSA + Simulador de Rede e Contingência */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel do Certificado Digital RSA */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Certificado Digital &amp; Assinatura RSA-2048</span>
            </div>
            <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
              Chave Privada em HSM / KMS
            </span>
          </div>

          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Emissor Raiz:</span>
              <strong className="text-stone-800">{certInfo.issuer}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">N.º Série do Certificado:</span>
              <span className="font-mono font-bold text-stone-800">{certInfo.serialNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Algoritmo Normativo:</span>
              <span className="font-mono text-stone-800">{certInfo.algorithm}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Impressão Digital Chave Pública:</span>
              <span className="font-mono text-[11px] text-stone-700 truncate max-w-[200px]" title={certInfo.fingerprint}>
                {certInfo.fingerprint}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Validade do Certificado:</span>
              <span className="font-mono text-emerald-700 font-bold">Válido até 31/12/2028</span>
            </div>
          </div>
        </div>

        {/* Simulador de Contingência e Condições de Rede */}
        <div className="lg:col-span-6 bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-100">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Simulador de Cenários &amp; Testes de Contingência</span>
            </div>
            <span className="text-[10px] font-mono bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
              Ambiente de Testes AGT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-800/60 border border-stone-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={simConfig.simulateTimeout}
                onChange={(e) => handleUpdateSimulator({ simulateTimeout: e.target.checked })}
                className="rounded text-amber-500"
              />
              <span>Simular Timeout de Rede (504)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-800/60 border border-stone-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={simConfig.simulateInvalidSignature}
                onChange={(e) =>
                  handleUpdateSimulator({ simulateInvalidSignature: e.target.checked })
                }
                className="rounded text-amber-500"
              />
              <span>Simular Assinatura Inválida</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-800/60 border border-stone-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={simConfig.simulateDuplicateSubmission}
                onChange={(e) =>
                  handleUpdateSimulator({ simulateDuplicateSubmission: e.target.checked })
                }
                className="rounded text-amber-500"
              />
              <span>Simular Rejeição por Duplicação</span>
            </label>

            <div className="p-2 rounded-lg bg-stone-800/60 border border-stone-700/60 flex items-center justify-between">
              <span className="text-stone-300">Latência:</span>
              <select
                value={simConfig.networkLatencyMs}
                onChange={(e) =>
                  handleUpdateSimulator({ networkLatencyMs: parseInt(e.target.value, 10) })
                }
                className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs font-mono text-stone-200"
              >
                <option value="50">50 ms (Rápido)</option>
                <option value="300">300 ms (Normal)</option>
                <option value="1200">1.2 s (Lento)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Fila de Transmissão AGT */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Itens na Fila de Transmissão para os Web Services</span>
            </h3>
            <p className="text-xs text-stone-500">
              Cada factura é assinada e encapsulada com IdempotencyKey única para garantir que nunca seja cobrada duas vezes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleProcessQueue}
              disabled={isProcessing || stats.queued + stats.contingency === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Processando Fila...' : 'Processar Fila Pendente'}</span>
            </button>
          </div>
        </div>

        {queueItems.length === 0 ? (
          <div className="p-10 text-center text-stone-500 space-y-2">
            <Clock className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-xs font-medium text-stone-700">A fila de transmissão está vazia.</p>
            <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
              Ao emitir novas facturas na Bancada Fiscal ou ao executar os testes da Fase 2, os documentos são automaticamente enfileirados e assinados aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <th className="py-2.5 px-3">Item / Documento</th>
                  <th className="py-2.5 px-3">Idempotency Key</th>
                  <th className="py-2.5 px-3 text-right">Total Líquido</th>
                  <th className="py-2.5 px-3 text-center">Tentativas</th>
                  <th className="py-2.5 px-3 text-center">Estado AGT</th>
                  <th className="py-2.5 px-3">Recibo Oficial / Erro</th>
                  <th className="py-2.5 px-3 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {queueItems.map((item) => {
                  const isAccepted = item.status === 'ACCEPTED';
                  const isContingency = item.status === 'FAILED_CONTINGENCY';
                  const isSelected = item.id === selectedItem?.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedQueueId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/50' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-stone-900">{item.documentNumber}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{item.id}</div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 truncate max-w-[160px]" title={item.idempotencyKey}>
                        {item.idempotencyKey}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                        {item.payload.netTotal.toLocaleString('pt-AO')} AOA
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px]">
                          {item.attempts}/{item.maxAttempts}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAccepted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isContingency
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        {item.response ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-emerald-800 text-[11px]">
                              {item.response.receiptNumber}
                            </span>
                            <div className="text-[10px] text-stone-500 truncate" title={item.response.responseDescription}>
                              {item.response.responseDescription}
                            </div>
                          </div>
                        ) : item.lastError ? (
                          <span className="text-rose-700 text-[11px] truncate block" title={item.lastError}>
                            {item.lastError}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">Aguardando envio...</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {(!isAccepted || isContingency) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryItem(item.id);
                            }}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3 text-amber-400" />
                            <span>Reenviar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detalhe do Item Seleccionado na Fila (Comprovativo AGT e Assinatura Digital) */}
        {selectedItem && (
          <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Metadados Oficiais de Transmissão AGT — {selectedItem.documentNumber}
              </span>
              <span className="font-mono text-[10px] text-stone-500">ID: {selectedItem.id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-stone-500">Algoritmo de Assinatura:</span>{' '}
                  <strong className="text-stone-800">{selectedItem.payload.signature.algorithm}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Data/Hora da Assinatura:</span>{' '}
                  <span>{selectedItem.payload.signature.signedAt}</span>
                </div>
                <div className="break-all">
                  <span className="text-stone-500">Assinatura Digital (RSA Base64):</span>
                  <div className="p-1.5 bg-white border border-stone-200 rounded text-[10px] text-stone-700 mt-0.5">
                    {selectedItem.payload.signature.signatureBase64}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-stone-500">Hash SHA-256 do Documento:</span>{' '}
                  <span className="break-all text-stone-700">{selectedItem.payload.hash}</span>
                </div>
                {selectedItem.response && (
                  <>
                    <div>
                      <span className="text-stone-500">Selo Digital Tributário AGT:</span>{' '}
                      <strong className="text-emerald-700">{selectedItem.response.digitalSeal}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">URL Validador Oficial:</span>{' '}
                      <a
                        href={selectedItem.response.qrCodeVerificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline flex items-center gap-1 text-[10px]"
                      >
                        Consultar no Portal AGT <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}
                {selectedItem.nextRetryAt && (
                  <div className="text-amber-800 bg-amber-100/60 p-2 rounded">
                    Próxima tentativa programada (Backoff Exponencial):{' '}
                    <strong>{selectedItem.nextRetryAt.replace('T', ' ').slice(0, 19)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
