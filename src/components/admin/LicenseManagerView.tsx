import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User, canAccessAdminLayout } from '../../core/fiscal/types/user';
import { LicenseInfo, LicensePlan, LicenseStatus, LICENSE_PLAN_PRESETS } from '../../core/fiscal/types/license';
import { LicenseService } from '../../core/fiscal/security/LicenseService';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RefreshCw,
  PlusCircle,
  FileCheck,
  Sparkles,
  Lock,
  Unlock,
  Building2,
  UserCheck,
  Hash,
  Award,
  Layers,
  HelpCircle,
  PauseCircle,
  PlayCircle,
  Zap,
} from 'lucide-react';

interface LicenseManagerViewProps {
  currentUser: User;
  onNavigateTab?: (tab: string) => void;
}

export const LicenseManagerView: React.FC<LicenseManagerViewProps> = ({ currentUser, onNavigateTab }) => {
  const db = FiscalDatabase.getInstance();
  const company = Array.from(db.companies.values())[0];

  const [license, setLicense] = useState<LicenseInfo>(() => db.getLicense());
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Estados de formulário de ajuste manual
  const [customDays, setCustomDays] = useState<number>(30);
  const [manualExpDate, setManualExpDate] = useState<string>(license.expirationDate);
  const [adminNotes, setAdminNotes] = useState<string>(license.notes || '');

  // Validação de acesso exclusivo ao Administrador A
  const isAuthorizedAdminA = canAccessAdminLayout(currentUser);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      const current = db.getLicense();
      setLicense(current);
      setManualExpDate(current.expirationDate);
    });
    return unsub;
  }, [db]);

  const daysRemaining = LicenseService.getDaysRemaining(license.expirationDate);
  const dynamicStatus = LicenseService.evaluateStatus(license);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCopyKey = () => {
    try {
      navigator.clipboard.writeText(license.licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
      showFeedback('Chave de licença copiada para a área de transferência!', 'success');
    } catch {
      showFeedback(`Chave: ${license.licenseKey}`, 'info');
    }
  };

  // 1. Mudar Plano (DEMO, SEMESTRAL ou ANUAL)
  const handleChangePlan = (newPlan: LicensePlan, specificDays?: number) => {
    try {
      const updated = LicenseService.setLicensePlan(license, newPlan, currentUser, specificDays);
      db.updateLicense(updated);
      setLicense(updated);
      showFeedback(
        `Plano de Licença alterado para ${LICENSE_PLAN_PRESETS[newPlan].name} com sucesso! Duração definida para ${updated.durationDays} dias.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback(msg, 'error');
    }
  };

  // 2. Prorrogar Validade (+X Dias)
  const handleExtendDays = (days: number) => {
    try {
      const updated = LicenseService.extendLicense(license, days, currentUser);
      db.updateLicense(updated);
      setLicense(updated);
      showFeedback(`Licença prorrogada em +${days} dias! Nova validade: ${updated.expirationDate}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback(msg, 'error');
    }
  };

  // 3. Definir Data de Expiração Manual
  const handleSaveManualDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualExpDate) {
      showFeedback('Por favor, selecione uma data de expiração válida.', 'error');
      return;
    }

    try {
      const todayStr = LicenseService.formatDate(new Date());
      const newDuration = LicenseService.getDaysRemaining(manualExpDate);

      const updated: LicenseInfo = {
        ...license,
        status: newDuration < 0 ? 'EXPIRED' : 'ACTIVE',
        expirationDate: manualExpDate,
        durationDays: Math.max(1, newDuration),
        signatureChecksum: LicenseService.generateChecksum(license.licenseKey, manualExpDate, license.plan),
        assignedByUserId: currentUser.id,
        assignedByUserName: currentUser.name,
        lastValidatedAt: new Date().toISOString(),
        notes: adminNotes || `Data de expiração ajustada manualmente para ${manualExpDate} por ${currentUser.name}.`,
      };

      db.updateLicense(updated);
      setLicense(updated);
      showFeedback(`Data de expiração atualizada com sucesso para ${manualExpDate}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback(msg, 'error');
    }
  };

  // 4. Alternar Estado (Activa / Suspensa / Expirada)
  const handleToggleStatus = (newStatus: LicenseStatus) => {
    try {
      const updated = LicenseService.setLicenseStatus(license, newStatus, currentUser);
      db.updateLicense(updated);
      setLicense(updated);
      showFeedback(`Estado da licença alterado para "${newStatus}".`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback(msg, 'error');
    }
  };

  // 5. Regenerar Chave Criptográfica
  const handleRegenerateKey = () => {
    if (!confirm('Deseja regenerar a chave da licença? A assinatura de integridade será recalculada.')) {
      return;
    }
    try {
      const newKey = LicenseService.generateLicenseKey(license.plan, company?.taxId || license.issuedToNif);
      const newChecksum = LicenseService.generateChecksum(newKey, license.expirationDate, license.plan);
      const updated: LicenseInfo = {
        ...license,
        licenseKey: newKey,
        signatureChecksum: newChecksum,
        lastValidatedAt: new Date().toISOString(),
        notes: `Chave criptográfica renovada pelo Administrador A em ${LicenseService.formatDate(new Date())}.`,
      };
      db.updateLicense(updated);
      setLicense(updated);
      showFeedback('Nova chave de licença gerada e assinada com sucesso!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback(msg, 'error');
    }
  };

  // Se o utilizador NÃO for o Administrador A, bloqueia o acesso com aviso de segurança
  if (!isAuthorizedAdminA) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
              Acesso Exclusivo Restrito
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Módulo de Licenciamento — Administrador A
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              O módulo de gestão e definição de planos de licença (Demo, Semestral e Anual) é restrito exclusivamente ao <strong>Administrador A</strong> (Titular Máximo do Sistema).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
            <div>Utilizador conectado: <strong>{currentUser.name}</strong> ({currentUser.email})</div>
            <div>Perfil atual: <strong>{currentUser.role}</strong> {currentUser.adminSubtype ? `(${currentUser.adminSubtype})` : ''}</div>
            <div className="text-rose-600 font-bold">Privilégio necessário: ADMIN (ADMIN_A)</div>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
            >
              Voltar ao Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentPreset = LICENSE_PLAN_PRESETS[license.plan];

  return (
    <div id="license-manager-view" className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 rounded-3xl text-white shadow-xl border border-slate-700/60">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
              <KeyRound className="w-3.5 h-3.5 text-slate-950" />
              Exclusivo Administrador A
            </span>
            <span className="text-xs text-sky-200 font-mono">Gestão de Direitos de Uso &amp; Validade</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Módulo de Licença &amp; Subscrição
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Configure o período operacional do software. Defina com 1 clique se a licença é <strong>Demonstração (Demo)</strong>, <strong>Semestral (6 Meses)</strong> ou <strong>Anual (12 Meses)</strong> com controlo total de prazos e integridade.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRegenerateKey}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            title="Recalcular checksum criptográfico e gerar nova chave"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerar Chave</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-300'
              : 'bg-blue-50 text-blue-900 border border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Cartão de Destaque da Licença Atual */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                license.plan === 'ANUAL'
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : license.plan === 'SEMESTRAL'
                  ? 'bg-blue-600 shadow-blue-500/20'
                  : 'bg-amber-500 shadow-amber-500/20'
              }`}
            >
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    license.plan === 'ANUAL'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : license.plan === 'SEMESTRAL'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {currentPreset.name}
                </span>

                {/* Badge de Estado Operacional */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    dynamicStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : dynamicStatus === 'EXPIRING_SOON'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : dynamicStatus === 'SUSPENDED'
                      ? 'bg-slate-100 text-slate-700 border border-slate-300'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      dynamicStatus === 'ACTIVE'
                        ? 'bg-emerald-500'
                        : dynamicStatus === 'EXPIRING_SOON'
                        ? 'bg-amber-500'
                        : dynamicStatus === 'SUSPENDED'
                        ? 'bg-slate-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  {dynamicStatus === 'ACTIVE'
                    ? 'Licença Activa'
                    : dynamicStatus === 'EXPIRING_SOON'
                    ? 'A Expirar em Breve'
                    : dynamicStatus === 'SUSPENDED'
                    ? 'Licença Suspensa'
                    : 'Licença Expirada'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {currentPreset.tagline}
              </h2>
            </div>
          </div>

          {/* Contagem Regressiva e Prazo Restante */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right min-w-[200px]">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tempo Restante
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono leading-none mt-1 ${
                daysRemaining > 30
                  ? 'text-emerald-700'
                  : daysRemaining > 0
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {daysRemaining > 0 ? `${daysRemaining} Dias` : '0 Dias (Expirada)'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Válida até: <strong>{license.expirationDate}</strong>
            </div>
          </div>
        </div>

        {/* Chave de Licença & Detalhes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Caixa da Chave Oficial */}
          <div className="lg:col-span-2 p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Chave da Licença Oficial (Key)
              </span>
              <span className="text-[10px] font-mono text-slate-400">ID: {license.id}</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm font-bold text-amber-300 select-all break-all">
              <span>{license.licenseKey}</span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="shrink-0 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Copiar chave"
              >
                {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[10.5px] text-slate-400 flex items-center justify-between font-mono">
              <span>Checksum: {license.signatureChecksum}</span>
              <span>Hardware: {license.hardwareFingerprint || 'AGT-TERM-AO-2026-X81'}</span>
            </div>
          </div>

          {/* Empresa & NIF */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              Entidade Licenciada
            </span>
            <div className="font-extrabold text-slate-900 text-sm truncate">
              {company?.tradeName || license.issuedToCompany}
            </div>
            <div className="text-xs text-slate-600 font-mono">
              NIF: <strong>{company?.taxId || license.issuedToNif}</strong>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Regime Geral AGT
            </div>
          </div>

          {/* Emissor & Responsável */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-600" />
              Administrador Autorizador
            </span>
            <div className="font-extrabold text-slate-900 text-sm truncate">
              {license.assignedByUserName}
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Activada em: <strong>{license.activationDate}</strong>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold pt-1">
              Autenticado pelo Administrador A
            </div>
          </div>
        </div>
      </div>

      {/* 3. SELETOR DOS 3 PLANOS (DEMO, SEMESTRAL E ANUAL) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Definição de Plano de Licença
            </h3>
            <p className="text-xs text-slate-500">
              Clique no plano desejado para aplicar a duração correspondente instantaneamente.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            3 Planos Oficiais Disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* PLANO 1: DEMO */}
          <div
            className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
              license.plan === 'DEMO'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400 shadow-md'
                : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/20 shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  Plano Demo
                </span>
                <span className="text-xs font-mono font-bold text-amber-700">15 a 30 Dias</span>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Demonstração (Demo)</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ideal para avaliação rápida, demonstração a novos operadores e testes antes da contratação formal.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-amber-200/60">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Emissão POS com Assinatura AGT</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Cálculo automático de troco e talão</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Até 2 utilizadores simultâneos</span>
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChangePlan('DEMO', 15)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    license.plan === 'DEMO' && license.durationDays === 15
                      ? 'bg-amber-500 text-white font-black'
                      : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  Demo 15 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleChangePlan('DEMO', 30)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    license.plan === 'DEMO' && license.durationDays === 30
                      ? 'bg-amber-500 text-white font-black'
                      : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  Demo 30 Dias
                </button>
              </div>
              {license.plan === 'DEMO' && (
                <div className="text-center text-[10.5px] font-bold text-amber-700">
                  ✓ Plano actualmente ativo
                </div>
              )}
            </div>
          </div>

          {/* PLANO 2: SEMESTRAL */}
          <div
            className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
              license.plan === 'SEMESTRAL'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500 shadow-md'
                : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/20 shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
                  Plano Semestral
                </span>
                <span className="text-xs font-mono font-bold text-blue-700">180 Dias (6 Meses)</span>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Semestral Oficial</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Subscrição de 6 meses para lojas de conveniência, mini mercados e estabelecimentos em crescimento.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-blue-200/60">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Gestão completa de stocks (CMP)</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Exportação oficial do SAF-T (AO)</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Até 5 utilizadores e 2 terminais</span>
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-2">
              <button
                type="button"
                onClick={() => handleChangePlan('SEMESTRAL', 180)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  license.plan === 'SEMESTRAL'
                    ? 'bg-blue-600 text-white font-black shadow-md'
                    : 'bg-white hover:bg-blue-100 text-blue-900 border border-blue-300'
                }`}
              >
                {license.plan === 'SEMESTRAL' ? '✓ Plano Semestral Ativo' : 'Ativar Plano Semestral (180 Dias)'}
              </button>
            </div>
          </div>

          {/* PLANO 3: ANUAL (RECOMENDADO) */}
          <div
            className={`rounded-3xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
              license.plan === 'ANUAL'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500 shadow-md'
                : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/20 shadow-xs'
            }`}
          >
            {/* Faixa Recomendada */}
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                Corporativo
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Plano Anual
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">365 Dias (1 Ano)</span>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Anual Completo</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Solução definitiva para o ano fiscal AGT com todos os módulos, ERP, utilizadores ilimitados e suporte total.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-emerald-200/60">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Acesso irrestrito a todos os módulos</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Utilizadores e armazéns ilimitados</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sincronização Cloud &amp; Offline PWA</span>
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-2">
              <button
                type="button"
                onClick={() => handleChangePlan('ANUAL', 365)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  license.plan === 'ANUAL'
                    ? 'bg-emerald-600 text-white font-black shadow-md'
                    : 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {license.plan === 'ANUAL' ? '✓ Plano Anual Ativo' : 'Ativar Plano Anual (365 Dias)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRORROGAÇÃO RÁPIDA & AJUSTE DE VALIDADE MANUAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prorrogação Rápida em Dias */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Prorrogação Rápida de Dias
              </h3>
              <p className="text-xs text-slate-500">
                Some dias adicionais à validade atual sem alterar o plano base.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => handleExtendDays(7)}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors cursor-pointer text-center font-mono"
            >
              +7 Dias
            </button>
            <button
              type="button"
              onClick={() => handleExtendDays(15)}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors cursor-pointer text-center font-mono"
            >
              +15 Dias
            </button>
            <button
              type="button"
              onClick={() => handleExtendDays(30)}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors cursor-pointer text-center font-mono"
            >
              +30 Dias
            </button>
            <button
              type="button"
              onClick={() => handleExtendDays(90)}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors cursor-pointer text-center font-mono"
            >
              +90 Dias
            </button>
            <button
              type="button"
              onClick={() => handleExtendDays(180)}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors cursor-pointer text-center font-mono"
            >
              +180 Dias
            </button>
            <button
              type="button"
              onClick={() => handleExtendDays(365)}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors cursor-pointer text-center font-mono"
            >
              +365 Dias
            </button>
          </div>

          {/* Controlo de Estado Administrativo */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Controlo de Bloqueio &amp; Estado:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleToggleStatus('ACTIVE')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  license.status === 'ACTIVE'
                    ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Activar</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus('SUSPENDED')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  license.status === 'SUSPENDED'
                    ? 'bg-amber-600 text-white font-extrabold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Suspender</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus('EXPIRED')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  license.status === 'EXPIRED'
                    ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ajuste Fino de Data de Expiração */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Ajuste Manual de Data de Validade
            </h3>
            <p className="text-xs text-slate-500">
              Escolha uma data específica no calendário para a expiração da licença.
            </p>
          </div>

          <form onSubmit={handleSaveManualDate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Data de Expiração:</label>
                <input
                  type="date"
                  value={manualExpDate}
                  onChange={(e) => setManualExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Data de Ativação:</label>
                <input
                  type="date"
                  value={license.activationDate}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Notas Administrativas:</label>
              <input
                type="text"
                placeholder="Ex: Licença concedida conforme contrato N.º 2026/04..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Salvar Alterações de Validade</span>
            </button>
          </form>
        </div>
      </div>

      {/* 5. Quadro de Conformidade e Recursos Liberados */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-extrabold text-slate-900 text-sm">
              Recursos Autorizados na Licença Atual ({currentPreset.name})
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Validação Criptográfica AGT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {currentPreset.features.map((feature, idx) => (
            <div
              key={idx}
              className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2 shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
