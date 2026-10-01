import React from 'react';
import { User } from '../core/fiscal/types/user';
import { KitekeLogo } from './common/KitekeLogo';
import {
  Receipt,
  CheckCircle2,
  Hash,
  Percent,
  Activity,
  Layers,
  ShieldCheck,
  FileCheck,
  Server,
  FileCode,
  Package,
  Award,
  QrCode,
  LogOut,
  KeyRound,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: User;
  onSwitchUser?: (userId: string) => void;
  allUsers?: User[];
  onOpenOperatorMode?: () => void;
  onLogout?: () => void;
  isLoginSuspended?: boolean;
  onReenableLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onSwitchUser,
  allUsers,
  onOpenOperatorMode,
  onLogout,
  isLoginSuspended,
  onReenableLogin,
}) => {
  const tabs = [
    { id: 'license', label: 'Módulo Licença (Admin A)', icon: KeyRound },
    { id: 'erp', label: 'Módulo ERP (Fase 4)', icon: Package },
    { id: 'verify', label: 'Portal Validação (QR)', icon: QrCode },
    { id: 'erp-tests', label: 'Testes ERP (Fase 4)', icon: Award },
    { id: 'workbench', label: 'Bancada Fiscal (Emissão)', icon: Receipt },
    { id: 'saft', label: 'SAF-T (AO) Extracção', icon: FileCode },
    { id: 'saft-tests', label: 'Testes SAF-T (Fase 3)', icon: CheckCircle2 },
    { id: 'agt', label: 'Integração AGT (Fase 2)', icon: Server },
    { id: 'agt-tests', label: 'Testes AGT (Fase 2)', icon: CheckCircle2 },
    { id: 'tests', label: 'Testes Núcleo (Fase 1)', icon: FileCheck },
    { id: 'series', label: 'Séries & Sequências', icon: Hash },
    { id: 'catalog', label: 'Tax Engine & Clientes', icon: Percent },
    { id: 'audit', label: 'Auditoria & Hashes', icon: Activity },
    { id: 'roadmap', label: 'Roteiro das 4 Fases', icon: Layers },
    { id: 'architecture', label: 'Arquitectura & Camadas', icon: ShieldCheck },
    { id: 'database', label: 'Modelo de Dados (ERD)', icon: FileCheck },
  ];

  return (
    <header id="app-header" className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <KitekeLogo variant="wordmark" size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-stone-300 hidden sm:inline">•</span>
                <span className="text-sm font-bold text-stone-800">Consola Fiscal &amp; ERP</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  MODO TÉCNICO (ADMINISTRADOR)
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Visão Completa de Auditoria, Motores Fiscais, Certificação RSA-2048, AGT, SAF-T (AO) e ERP Integrado
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status de Acesso Livre (Login Suspenso) */}
            {isLoginSuspended && (
              <div className="flex items-center gap-2 bg-blue-50 py-1.5 px-3 rounded-xl border border-blue-200 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-semibold text-blue-900">Acesso Livre (Login Suspenso)</span>
                {onReenableLogin && (
                  <button
                    onClick={onReenableLogin}
                    className="ml-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    title="Reativar exigência de login quando autorizar disponibilização a pessoas de fora"
                  >
                    Reativar Login
                  </button>
                )}
              </div>
            )}

            {/* Alternador Rápido de Utilizador para Testar Perfis */}
            {allUsers && allUsers.length > 0 && onSwitchUser && (
              <select
                value={currentUser?.id || ''}
                onChange={(e) => onSwitchUser(e.target.value)}
                className="bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                title="Trocar operador ativo para testar permissões"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name.split(' ')[0]} ({u.role})
                  </option>
                ))}
              </select>
            )}

            {/* Botão de Trocar para Layout Operacional ComércioPro */}
            {onOpenOperatorMode && (
              <button
                onClick={onOpenOperatorMode}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Abrir Layout ComércioPro (Utilizadores / Operadores)"
              >
                <Package className="w-3.5 h-3.5 text-white" />
                <span>Layout ComércioPro (Utilizadores)</span>
              </button>
            )}

            {/* Identificação do Utilizador Autenticado */}
            {currentUser && (
              <div className="flex items-center gap-2 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-200 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-stone-900">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  {currentUser.adminSubtype === 'ADMIN_A' ? 'Admin A' : currentUser.role}
                </span>
              </div>
            )}

            {/* Botão de Terminar Sessão */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-200"
                title="Terminar Sessão Segura"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span>Terminar Sessão</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
