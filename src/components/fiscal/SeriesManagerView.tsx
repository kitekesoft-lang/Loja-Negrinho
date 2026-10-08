import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { DocumentSeries, FiscalDocumentTypeCode } from '../../core/fiscal/types/series';
import { DocumentSeriesEngine } from '../../core/fiscal/engines/DocumentSeriesEngine';
import { AuditService } from '../../core/fiscal/security/AuditService';
import {
  Hash,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  KeyRound,
  Server,
  Zap,
  RotateCw,
  FileCheck,
} from 'lucide-react';

export const SeriesManagerView: React.FC = () => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, [db]);

  const seriesList = Array.from(db.series.values());
  const establishments = Array.from(db.establishments.values());
  const homologationConfig = db.getHomologationConfig();
  const isHomologated = homologationConfig.status === 'HOMOLOGATED';

  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [communicationKeyInput, setCommunicationKeyInput] = useState(homologationConfig.communicationKey || '');
  const [certNumberInput, setCertNumberInput] = useState(
    homologationConfig.softwareCertificateNumber !== '0/AGT/2026'
      ? homologationConfig.softwareCertificateNumber
      : 'CERT-AGT-2026/089'
  );
  const [isActivating, setIsActivating] = useState(false);

  const [docType, setDocType] = useState<FiscalDocumentTypeCode>('FT');
  const [seriesCode, setSeriesCode] = useState<string>('B2026');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [establishmentId, setEstablishmentId] = useState<string>(establishments[0]?.id || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleActivateHomologation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivating(true);
    setFeedback(null);
    try {
      const res = await db.activateAGTHomologation(communicationKeyInput, certNumberInput);
      setFeedback({ type: 'success', message: res.message });
      setShowKeyModal(false);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao validar chave de comunicação junto da AGT.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivateHomologation = () => {
    db.deactivateAGTHomologation();
    setFeedback({
      type: 'success',
      message: 'Homologação desativada. O sistema voltou ao modo autónomo de geração de séries próprias.',
    });
  };

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const code = seriesCode.trim().toUpperCase();
    if (!code) {
      setFeedback({ type: 'error', message: 'O código da série não pode ser vazio.' });
      return;
    }

    // Verificar se já existe série igual para mesmo tipo, ano e estabelecimento
    const exists = seriesList.some(
      (s) =>
        s.documentTypeCode === docType &&
        s.seriesCode === code &&
        s.fiscalYear === fiscalYear &&
        s.establishmentId === establishmentId
    );

    if (exists) {
      setFeedback({
        type: 'error',
        message: `Já existe uma série ${docType} ${code} registada para o exercício de ${fiscalYear} neste estabelecimento.`,
      });
      return;
    }

    // Exigência do Decreto: se em modo homologado, a série depende da validação/geração da AGT
    let agtValidationCode = `LOCAL-AUTONOMOUS-${fiscalYear}-${code}`;
    let isAgtApproved = true;
    let seriesOrigin: 'LOCAL_AUTONOMOUS' | 'AGT_AUTHORIZED' = 'LOCAL_AUTONOMOUS';

    if (isHomologated) {
      seriesOrigin = 'AGT_AUTHORIZED';
      try {
        const connector = db.agtQueue.getConnector();
        const est = establishments.find((e) => e.id === establishmentId);
        const authRes = await connector.requestSeriesAuthorization(
          {
            documentTypeCode: docType,
            seriesCode: code,
            fiscalYear,
            companyTaxId: '5417082341',
            establishmentCode: est?.code || 'SEDE',
            initialSequence: 1,
          },
          homologationConfig.communicationKey
        );
        agtValidationCode = authRes.agtValidationCode;
        isAgtApproved = true;
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Falha na autorização de série pela AGT: ${err?.message || 'Erro de comunicação.'}`,
        });
        return;
      }
    }

    const newSeries: DocumentSeries = {
      id: `SER-${docType}-${code}-${Date.now().toString(36)}`,
      companyId: 'COMP-001',
      establishmentId,
      documentTypeCode: docType,
      seriesCode: code,
      fiscalYear,
      currentSequence: 0,
      isActive: true,
      isClosed: false,
      seriesOrigin,
      isAgtApproved,
      agtValidationCode,
      agtRegisteredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.series.set(newSeries.id, newSeries);
    AuditService.logEvent({
      companyId: 'COMP-001',
      user: { id: 'USR-ADMIN', name: 'Administrador do Sistema', role: 'ADMIN' },
      entityType: 'SERIES',
      entityId: newSeries.id,
      operation: 'SERIES_OPEN',
      description: `Abertura de nova série fiscal ${newSeries.documentTypeCode} ${newSeries.seriesCode}/${newSeries.fiscalYear} (${isHomologated ? 'Autorizada pela AGT: ' + agtValidationCode : 'Geração Autónoma Local'})`,
      newState: newSeries,
    });
    db.notify();

    setFeedback({
      type: 'success',
      message: isHomologated
        ? `Série ${newSeries.documentTypeCode} ${newSeries.seriesCode} autorizada pela AGT com código [${agtValidationCode}] e criada com sucesso!`
        : `Série fiscal ${newSeries.documentTypeCode} ${newSeries.seriesCode} gerada autonomamente com sucesso (Conforme Decreto AGT)!`,
    });
    setShowNewSeriesForm(false);
  };

  const handleToggleCloseSeries = (series: DocumentSeries) => {
    const isNowClosed = !series.isClosed;
    series.isClosed = isNowClosed;
    series.updatedAt = new Date().toISOString();

    AuditService.logEvent({
      companyId: 'COMP-001',
      user: { id: 'USR-ADMIN', name: 'Administrador do Sistema', role: 'ADMIN' },
      entityType: 'SERIES',
      entityId: series.id,
      operation: isNowClosed ? 'SERIES_CLOSE' : 'UPDATE',
      description: `${isNowClosed ? 'Encerramento' : 'Reabertura'} da série ${series.documentTypeCode} ${series.seriesCode} no sequencial #${series.currentSequence}`,
      newState: series,
    });

    db.notify();
    setFeedback({
      type: 'success',
      message: `Série ${series.documentTypeCode} ${series.seriesCode} ${isNowClosed ? 'encerrada para novas emissões' : 'reaberta'}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-800">
              <Hash className="w-3.5 h-3.5 mr-1 text-amber-600" />
              1.8 SÉRIES DOCUMENTAIS E NUMERAÇÃO ATÓMICA
            </span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 mt-1">
            Gestão e Monitorização de Séries Fiscais
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl">
            Controlo rigoroso anti-furos, numeração sequencial atómica ininterrupta, prevenção de colisões em concorrência e isolamento por estabelecimento e tipo documental.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowKeyModal(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isHomologated
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isHomologated ? 'Chave AGT Ativa' : 'Homologar & Inserir Chave AGT'}</span>
          </button>

          <button
            onClick={() => setShowNewSeriesForm(!showNewSeriesForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{showNewSeriesForm ? 'Cancelar' : 'Nova Série Fiscal'}</span>
          </button>
        </div>
      </div>

      {/* Painel Oficial de Transição de Séries Conforme Decreto Executivo AGT */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs ${
          isHomologated
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isHomologated ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isHomologated ? <Shield className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">
                {isHomologated
                  ? 'FASE 2: SISTEMA HOMOLOGADO — SÉRIES DEPENDENTES DA AGT'
                  : 'FASE 1: GERAÇÃO DE SÉRIES PRÓPRIAS (PRÉ-HOMOLOGAÇÃO / MODO AUTÓNOMO)'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isHomologated
                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                    : 'bg-blue-200 text-blue-900 border border-blue-300'
                }`}
              >
                {isHomologated ? 'Homologado Oficial' : 'Autónomo / Pré-Certificação'}
              </span>
            </div>
            <p className="mt-1 text-slate-600 max-w-3xl leading-relaxed">
              {isHomologated ? (
                <>
                  O software está certificado e opera com a Chave de Comunicação com a AGT ativa (Certificado:{' '}
                  <strong>{homologationConfig.softwareCertificateNumber}</strong>). Conforme o Decreto Executivo,
                  todas as novas séries dependem da autorização e registo expresso junto da AGT.
                </>
              ) : (
                <>
                  Conforme a regulamentação da AGT para a fase inicial pré-homologação, o sistema gera as suas próprias
                  séries documentais respeitando a sintaxe e numeração contínua. Menção obrigatória nos documentos:{' '}
                  <strong>Processado por programa validado n.º 0/AGT/2026</strong>.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {isHomologated ? (
            <button
              onClick={handleDeactivateHomologation}
              className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Voltar ao Modo Autónomo
            </button>
          ) : (
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Inserir Chave &amp; Homologar</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal para Inserção da Chave de Comunicação AGT */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Chave de Comunicação com a AGT</h3>
                  <p className="text-[11px] text-slate-500">
                    Ativa a transição para séries dependentes e homologadas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleActivateHomologation} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed text-[11px]">
                <strong>Atenção:</strong> Ao inserir a Chave de Comunicação atribuída pela AGT, o sistema passará a
                depender estritamente da autorização das séries pelo Web Service da autoridade tributária, e os documentos
                emitidos passarão a exibir o número oficial de homologação.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chave de Comunicação / Token AGT:
                </label>
                <input
                  type="text"
                  value={communicationKeyInput}
                  onChange={(e) => setCommunicationKeyInput(e.target.value)}
                  placeholder="Ex: AGT-KEY-2026-LIVE-9948271"
                  required
                  className="w-full font-mono text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Número de Certificado de Homologação AGT:
                </label>
                <input
                  type="text"
                  value={certNumberInput}
                  onChange={(e) => setCertNumberInput(e.target.value)}
                  placeholder="Ex: CERT-AGT-2026/089"
                  required
                  className="w-full font-mono text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isActivating}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isActivating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  <span>{isActivating ? 'Validando na AGT...' : 'Ativar Homologação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* New Series Form */}
      {showNewSeriesForm && (
        <form
          onSubmit={handleCreateSeries}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md space-y-4 animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Configuração de Nova Série Documental</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Tipo de Documento:
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as FiscalDocumentTypeCode)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-medium"
              >
                <option value="FT">FT — Factura</option>
                <option value="FR">FR — Factura/Recibo</option>
                <option value="RC">RC — Recibo</option>
                <option value="NC">NC — Nota de Crédito</option>
                <option value="ND">ND — Nota de Débito</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Código da Série (ex: A2026, LJ01):
              </label>
              <input
                type="text"
                value={seriesCode}
                onChange={(e) => setSeriesCode(e.target.value.toUpperCase())}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Exercício Fiscal:</label>
              <input
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(parseInt(e.target.value, 10) || 2026)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Estabelecimento:</label>
              <select
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2"
              >
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.code} — {est.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowNewSeriesForm(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow"
            >
              Criar Série Fiscal
            </button>
          </div>
        </form>
      )}

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seriesList.map((series) => {
          const est = establishments.find((e) => e.id === series.establishmentId);
          const nextPreview = DocumentSeriesEngine.formatDocumentNumber(
            series.documentTypeCode,
            series.seriesCode,
            series.currentSequence + 1
          );

          return (
            <div
              key={series.id}
              className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                series.isClosed ? 'border-stone-300 opacity-80' : 'border-stone-200 hover:border-amber-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold font-mono bg-stone-900 text-amber-400">
                    {series.documentTypeCode} {series.seriesCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {series.seriesOrigin === 'AGT_AUTHORIZED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        AGT Autorizada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        Local / Autónoma
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        series.isClosed
                          ? 'bg-rose-100 text-rose-800'
                          : series.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {series.isClosed ? 'ENCERRADA' : series.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estabelecimento:</span>
                    <strong className="text-stone-800">{est?.code || 'SEDE'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Exercício Fiscal:</span>
                    <strong className="font-mono text-stone-800">{series.fiscalYear}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Sequência Actual:</span>
                    <span className="font-mono font-bold text-stone-900">
                      #{series.currentSequence}
                    </span>
                  </div>
                  {series.agtValidationCode && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">Código AGT:</span>
                      <span className="font-mono font-semibold text-emerald-800 truncate max-w-[170px]" title={series.agtValidationCode}>
                        {series.agtValidationCode}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-100">
                    <span className="text-stone-500">Próximo Documento:</span>
                    <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {series.isClosed ? 'Série Encerrada' : nextPreview}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">Protegido por Lock Atómico</span>
                <button
                  onClick={() => handleToggleCloseSeries(series)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    series.isClosed
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {series.isClosed ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> Reabrir Série
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Encerrar Série
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
