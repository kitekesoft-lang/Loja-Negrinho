import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { DocumentSeries, FiscalDocumentTypeCode } from '../../core/fiscal/types/series';
import { DocumentSeriesEngine } from '../../core/fiscal/engines/DocumentSeriesEngine';
import { AuditService } from '../../core/fiscal/security/AuditService';
import { Hash, Plus, Lock, Unlock, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const SeriesManagerView: React.FC = () => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, [db]);

  const seriesList = Array.from(db.series.values());
  const establishments = Array.from(db.establishments.values());

  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false);
  const [docType, setDocType] = useState<FiscalDocumentTypeCode>('FT');
  const [seriesCode, setSeriesCode] = useState<string>('B2026');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [establishmentId, setEstablishmentId] = useState<string>(establishments[0]?.id || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateSeries = (e: React.FormEvent) => {
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
      description: `Abertura da nova série fiscal ${newSeries.documentTypeCode} ${newSeries.seriesCode}/${newSeries.fiscalYear}`,
      newState: newSeries,
    });
    db.notify();

    setFeedback({
      type: 'success',
      message: `Série fiscal ${newSeries.documentTypeCode} ${newSeries.seriesCode} criada com sucesso!`,
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

        <button
          onClick={() => setShowNewSeriesForm(!showNewSeriesForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{showNewSeriesForm ? 'Cancelar' : 'Nova Série Fiscal'}</span>
        </button>
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
