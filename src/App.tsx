import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FiscalWorkbench } from './components/fiscal/FiscalWorkbench';
import { TestRunnerView } from './components/fiscal/TestRunnerView';
import { SeriesManagerView } from './components/fiscal/SeriesManagerView';
import { TaxCatalogView } from './components/fiscal/TaxCatalogView';
import { AuditAndChainView } from './components/fiscal/AuditAndChainView';
import { AGTIntegrationView } from './components/fiscal/AGTIntegrationView';
import { Phase2TestRunnerView } from './components/fiscal/Phase2TestRunnerView';
import { SAFTExportView } from './components/fiscal/SAFTExportView';
import { Phase3TestRunnerView } from './components/fiscal/Phase3TestRunnerView';
import { ERPDashboardView } from './components/fiscal/ERPDashboardView';
import { Phase4TestRunnerView } from './components/fiscal/Phase4TestRunnerView';
import { RoadmapView } from './components/RoadmapView';
import { ArchitectureView } from './components/ArchitectureView';
import { DatabaseModelView } from './components/DatabaseModelView';
import { PublicInvoiceVerificationView } from './components/fiscal/PublicInvoiceVerificationView';
import { LicenseManagerView } from './components/admin/LicenseManagerView';
import { OperatorAppLayout } from './components/operator/OperatorAppLayout';
import { LoginForm } from './components/auth/LoginForm';
import { FirstAccessChangePasswordModal } from './components/auth/FirstAccessChangePasswordModal';
import { FiscalDatabase } from './core/fiscal/repository/FiscalDatabase';
import { User, canAccessAdminLayout } from './core/fiscal/types/user';
import { ShieldCheck, CheckCircle2, Award, FileCode, Package, Play, Shield } from 'lucide-react';

export default function App() {
  const db = FiscalDatabase.getInstance();
  const allUsers = Array.from(db.users.values());

  // Estado de Exigência de Login (Suspenso por orientação do utilizador até autorização):
  // false = acesso livre e imediato sem credenciais (Modo Preparatório)
  // true = formulário de login obrigatório com credenciais
  const [requireLogin, setRequireLogin] = useState<boolean>(false);

  // Utilizador ativo: inicia diretamente como Administrador A ('USR-ADMIN') para acesso total imediato
  const [currentUserId, setCurrentUserId] = useState<string | null>('USR-ADMIN');

  // Utilizador em processo obrigatório de alteração de palavra-passe no primeiro acesso
  const [pendingPasswordChangeUser, setPendingPasswordChangeUser] = useState<User | null>(null);

  // Modo de visualização: 'ADMIN' (Consola Técnica) ou 'OPERATOR' (Layout de Utilizadores / Operações)
  const [adminViewMode, setAdminViewMode] = useState<'ADMIN' | 'OPERATOR'>('OPERATOR');
  const [activeTab, setActiveTab] = useState<string>('erp');

  // Deteta se o utilizador abriu o link ao ler um Código QR no telemóvel
  const [isPublicVerificationMode, setIsPublicVerificationMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('validar') || params.has('token') || params.has('verify') || params.has('qr');
  });

  const handleLoginSuccess = (user: User, mustChangePassword: boolean) => {
    if (requireLogin && (mustChangePassword || user.mustChangePassword || user.password === 'chave123')) {
      setPendingPasswordChangeUser(user);
    } else {
      setCurrentUserId(user.id);
      if (canAccessAdminLayout(user)) {
        setAdminViewMode('ADMIN');
      } else {
        setAdminViewMode('OPERATOR');
      }
    }
  };

  const handlePasswordChanged = (updatedUser: User) => {
    setPendingPasswordChangeUser(null);
    setCurrentUserId(updatedUser.id);
    if (canAccessAdminLayout(updatedUser)) {
      setAdminViewMode('ADMIN');
    } else {
      setAdminViewMode('OPERATOR');
    }
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setPendingPasswordChangeUser(null);
    setAdminViewMode('OPERATOR');
  };

  const handleReenableLogin = () => {
    setRequireLogin(true);
    setCurrentUserId(null);
    setPendingPasswordChangeUser(null);
  };

  // Se veio de leitura direta do QR Code (por telemóvel ou link público), abre o Portal de Validação
  if (isPublicVerificationMode) {
    return (
      <PublicInvoiceVerificationView
        onBackToApp={() => {
          setIsPublicVerificationMode(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  // Se o utilizador necessita de alterar a palavra-passe no primeiro acesso
  // (Apenas exigido quando requireLogin for true, não bloqueando o proprietário durante a preparação)
  if (pendingPasswordChangeUser && requireLogin) {
    return (
      <FirstAccessChangePasswordModal
        user={pendingPasswordChangeUser}
        onPasswordChanged={handlePasswordChanged}
        onLogout={handleLogout}
      />
    );
  }

  // Se não houver utilizador ativo (ex: se clicou em Terminar Sessão ou se requireLogin estiver ativo)
  if (!currentUserId) {
    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        onDirectAccess={() => {
          setCurrentUserId('USR-ADMIN');
          setAdminViewMode('OPERATOR');
        }}
        isSuspended={!requireLogin}
      />
    );
  }

  const currentUser = db.users.get(currentUserId) || db.users.get('USR-ADMIN')!;
  const isOnlyAdminA = canAccessAdminLayout(currentUser);

  // O administrador A é o ÚNICO que tem acesso aos dois layouts.
  // O Administrador B e os restantes utilizadores têm acesso APENAS ao layout de utilizadores.
  if (!isOnlyAdminA || adminViewMode === 'OPERATOR') {
    return (
      <OperatorAppLayout
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={(userId) => setCurrentUserId(userId)}
        onOpenAdminMode={isOnlyAdminA ? () => setAdminViewMode('ADMIN') : undefined}
        onLogout={handleLogout}
        isLoginSuspended={!requireLogin}
        onReenableLogin={handleReenableLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={(userId) => setCurrentUserId(userId)}
        onOpenOperatorMode={() => setAdminViewMode('OPERATOR')}
        onLogout={handleLogout}
        isLoginSuspended={!requireLogin}
        onReenableLogin={handleReenableLogin}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Callout Banner - 4 Fases Concluídas (Exclusivo da Consola do Administrador) */}
        <section
          id="status-banner"
          className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-stone-950">
                <CheckCircle2 className="w-3 h-3 mr-1 text-stone-950" /> 4 FASES CONCLUÍDAS — ECOSSISTEMA ERP FISCAL 100% OPERACIONAL
              </span>
              <span className="text-stone-500 text-xs">|</span>
              <span className="text-stone-300 text-xs font-mono">Portaria n.º 292/18 AGT &amp; PGC Angolano</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-100">
              Consola Técnica &amp; Auditoria Integral do Administrador
            </h2>
            <p className="text-xs text-stone-400 max-w-3xl leading-relaxed">
              Visão técnica detalhada restrita ao Administrador: <strong>Núcleo Fiscal Imutável</strong> (RSA-2048), <strong>Transmissão Assíncrona AGT</strong>, <strong>Extracção SAF-T(AO) Oficial</strong> e <strong>Módulos ERP</strong> (Armazéns/Stocks com CMP, Tesouraria Multi-Banco BAI/BFA, Caixa Diário e Partidas Dobradas PGC).
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
            <button
              onClick={() => setAdminViewMode('OPERATOR')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-stone-950 hover:bg-amber-300 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Package className="w-3.5 h-3.5 text-stone-950" />
              <span>Ver Layout dos Operadores</span>
            </button>
            <button
              onClick={() => setActiveTab('erp-tests')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Testes ERP (Fase 4)</span>
            </button>
          </div>
        </section>

        {/* Dynamic Tab Content */}
        {activeTab === 'license' && <LicenseManagerView currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'erp' && <ERPDashboardView />}
        {activeTab === 'verify' && <PublicInvoiceVerificationView onBackToApp={() => setActiveTab('erp')} />}
        {activeTab === 'erp-tests' && <Phase4TestRunnerView />}
        {activeTab === 'workbench' && <FiscalWorkbench />}
        {activeTab === 'saft' && <SAFTExportView />}
        {activeTab === 'saft-tests' && <Phase3TestRunnerView />}
        {activeTab === 'agt' && <AGTIntegrationView />}
        {activeTab === 'agt-tests' && <Phase2TestRunnerView />}
        {activeTab === 'tests' && <TestRunnerView />}
        {activeTab === 'series' && <SeriesManagerView />}
        {activeTab === 'catalog' && <TaxCatalogView />}
        {activeTab === 'audit' && <AuditAndChainView />}
        {activeTab === 'roadmap' && <RoadmapView />}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'database' && <DatabaseModelView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistema Fiscal Angolano em Conformidade Estrita com as Normas da AGT &amp; SAF-T(AO)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Consola de Gestão do Administrador</span>
            <span className="text-stone-300">•</span>
            <span>Versão 1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
