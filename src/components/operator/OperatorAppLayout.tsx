import React, { useState } from 'react';
import { User, canAccessAdminLayout } from '../../core/fiscal/types/user';
import { OperatorDashboardView } from './OperatorDashboardView';
import { QuickPOSView } from './QuickPOSView';
import { OperatorProductsView } from './OperatorProductsView';
import { OperatorStockView } from './OperatorStockView';
import { OperatorCustomersView } from './OperatorCustomersView';
import { OperatorSuppliersView } from './OperatorSuppliersView';
import { OperatorPurchasesView } from './OperatorPurchasesView';
import { OperatorReportsView } from './OperatorReportsView';
import { OperatorUsersView } from './OperatorUsersView';
import { OperatorSettingsView } from './OperatorSettingsView';
import { OperatorCashView } from './OperatorCashView';
import { PublicInvoiceVerificationView } from '../fiscal/PublicInvoiceVerificationView';
import { LicenseManagerView } from '../admin/LicenseManagerView';
import { InstallAndSyncModal } from '../common/InstallAndSyncModal';
import { AndroidInstallGuideModal } from '../common/AndroidInstallGuideModal';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { LicenseService } from '../../core/fiscal/security/LicenseService';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingBag,
  BarChart3,
  UserCheck,
  Settings,
  KeyRound,
  Search,
  Bell,
  ChevronDown,
  Shield,
  LogOut,
  QrCode,
  Store,
  DollarSign,
  Download,
  Cloud,
  Wifi,
  WifiOff,
  ChevronRight,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface OperatorAppLayoutProps {
  currentUser: User;
  onSwitchUser?: (userId: string) => void;
  allUsers?: User[];
  onOpenAdminMode?: () => void;
  onLogout?: () => void;
  isLoginSuspended?: boolean;
  onReenableLogin?: () => void;
}

export const OperatorAppLayout: React.FC<OperatorAppLayoutProps> = ({
  currentUser,
  onSwitchUser,
  allUsers,
  onOpenAdminMode,
  onLogout,
  isLoginSuspended,
  onReenableLogin,
}) => {
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const { isOnline } = useNetworkStatus();
  const { isInstalled, isAndroid, isIOS, isInstallable, promptInstall } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showAndroidGuideModal, setShowAndroidGuideModal] = useState<boolean>(false);
  const [installModalTab, setInstallModalTab] = useState<'INSTALLER' | 'STORAGE' | 'NETLIFY'>('INSTALLER');

  const handleOpenInstall = async () => {
    if (isAndroid || isIOS) {
      if (isInstallable) {
        const res = await promptInstall();
        if (res === 'accepted') return;
      }
      setShowAndroidGuideModal(true);
      return;
    }
    setInstallModalTab('INSTALLER');
    setShowInstallModal(true);
  };

  const isOnlyAdminA = canAccessAdminLayout(currentUser);
  const db = FiscalDatabase.getInstance();
  const currentLicense = db.getLicense();
  const licenseDaysLeft = LicenseService.getDaysRemaining(currentLicense.expirationDate);

  // 10 Módulos fiéis ao layout de referência + Licenciamento (exclusivo Administrador A)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'compras', label: 'Compras', icon: ShoppingBag },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'utilizadores', label: 'Utilizadores', icon: UserCheck },
    { id: 'definicoes', label: 'Configurações', icon: Settings },
    ...(isOnlyAdminA
      ? [{ id: 'licenca', label: 'Licenciamento', icon: KeyRound, isSpecial: true }]
      : []),
  ];

  return (
    <div id="minha-loja-layout" className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      {/* 1. SIDEBAR AZUL ESCURO / MARINHO ULTRA COMPACTO CONFORME IMAGEM DE REFERÊNCIA (< 5 CM) */}
      <aside
        style={{ width: '64px', maxWidth: '5cm' }}
        className="w-[64px] max-w-[5cm] bg-[#061224] text-white flex flex-col items-center justify-between shrink-0 shadow-2xl select-none z-30 py-3 relative border-r border-sky-950/70 overflow-visible"
      >
        {/* Navegação Vertical de Módulos (Ícones Alinhados ao Centro) */}
        <div className="w-full flex flex-col items-center space-y-2 overflow-visible">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <div key={item.id} className="relative group flex items-center justify-center w-full px-2">
                {/* Linha indicadora azul claro no item ativo */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-r shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                )}

                <button
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50 ring-2 ring-blue-400/40'
                      : 'text-slate-400 hover:text-sky-300 hover:bg-white/10'
                  }`}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </button>

                {/* FAIXA QUE SE ESTENDE COM O NOME EM AZUL CLARO AO PASSAR O CURSOR */}
                <div
                  onClick={() => setActiveNav(item.id)}
                  className="absolute left-[58px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 ease-out origin-left -translate-x-2 group-hover:translate-x-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#071630]/98 backdrop-blur-md border border-sky-400/50 rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.8)] whitespace-nowrap min-w-[130px]">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,1)]"></span>
                    <span className="text-sky-300 font-extrabold text-xs tracking-wider uppercase drop-shadow-xs">
                      {item.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-sky-400 ml-auto" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé da Barra Lateral com Ações Compactas */}
        <div className="w-full flex flex-col items-center space-y-2 pt-3 border-t border-white/10 shrink-0 px-2 overflow-visible">
          {/* Caixa Diário */}
          <div className="relative group flex items-center justify-center w-full">
            <button
              type="button"
              onClick={() => setActiveNav('caixa')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                activeNav === 'caixa'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/15'
              }`}
              aria-label="Caixa Diário"
            >
              <DollarSign className="w-4 h-4" />
            </button>
            <div
              onClick={() => setActiveNav('caixa')}
              className="absolute left-[58px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 ease-out origin-left -translate-x-2 group-hover:translate-x-0 cursor-pointer"
            >
              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#071630]/98 backdrop-blur-md border border-amber-400/50 rounded-xl shadow-2xl whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-sky-300 font-extrabold text-xs tracking-wider uppercase">
                  Caixa Diário
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-sky-400 ml-auto" />
              </div>
            </div>
          </div>

          {/* Validar QR */}
          <div className="relative group flex items-center justify-center w-full">
            <button
              type="button"
              onClick={() => setActiveNav('validar')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                activeNav === 'validar'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/15'
              }`}
              aria-label="Validar Fatura QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <div
              onClick={() => setActiveNav('validar')}
              className="absolute left-[58px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 ease-out origin-left -translate-x-2 group-hover:translate-x-0 cursor-pointer"
            >
              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#071630]/98 backdrop-blur-md border border-emerald-400/50 rounded-xl shadow-2xl whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-sky-300 font-extrabold text-xs tracking-wider uppercase">
                  Validar Fatura QR
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-sky-400 ml-auto" />
              </div>
            </div>
          </div>

          {/* Instalar App / Central de Instalação */}
          <div className="relative group flex items-center justify-center w-full">
            <button
              type="button"
              onClick={handleOpenInstall}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all cursor-pointer"
              aria-label="Instalar Aplicação"
            >
              <Download className="w-4 h-4" />
            </button>
            <div
              onClick={handleOpenInstall}
              className="absolute left-[58px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 ease-out origin-left -translate-x-2 group-hover:translate-x-0 cursor-pointer"
            >
              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#071630]/98 backdrop-blur-md border border-sky-400/50 rounded-xl shadow-2xl whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span className="text-sky-300 font-extrabold text-xs tracking-wider uppercase">
                  Instalar Aplicação
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-sky-400 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL COM HEADER BRANCO SUPERIOR E CONTEÚDO SCROLLÁVEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Branco */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-3">
          {/* Identidade "Minha Loja" e Módulo Ativo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900 leading-tight flex items-center gap-1.5">
                <span>Minha Loja</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded-md">POS</span>
              </div>
              <div className="text-[10px] text-blue-600 font-semibold tracking-wide capitalize">
                {menuItems.find((m) => m.id === activeNav)?.label || activeNav}
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa Geral */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar produtos, código de barras, clientes, faturas..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Notificações, Status de Rede e Perfil do Utilizador */}
          <div className="flex items-center gap-3">
            {/* Status de Armazenamento Local / Nuvem */}
            <button
              onClick={() => {
                setInstallModalTab('STORAGE');
                setShowInstallModal(true);
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title={
                isOnline
                  ? 'Conexão Online: Armazenamento local e nuvem sincronizados'
                  : 'Modo Offline: Armazenamento local ativo no dispositivo'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
              ></span>
              <span>{isOnline ? 'Nuvem Activa' : 'Offline (Local)'}</span>
            </button>

            {/* Botão de Instalador Windows & Android */}
            <button
              onClick={handleOpenInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Instalar no Windows ou Android"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar App</span>
              <span className="md:hidden">Instalar</span>
            </button>
            {/* Status de Acesso Livre (Login Suspenso) */}
            {isLoginSuspended && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="font-semibold text-[11px]">Acesso Livre (Login Suspenso)</span>
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

            {/* Ícone de Sino com badge de notificação */}
            <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            {/* Badge de Licença do Sistema */}
            <button
              type="button"
              onClick={() => {
                if (isOnlyAdminA) {
                  setActiveNav('licenca');
                }
              }}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                currentLicense.plan === 'ANUAL'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                  : currentLicense.plan === 'SEMESTRAL'
                  ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 shadow-2xs'
                  : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 shadow-2xs'
              }`}
              title={isOnlyAdminA ? 'Clique para gerir o plano de licença no módulo do Administrador A' : 'Licença do Sistema'}
            >
              <KeyRound className="w-3.5 h-3.5 text-current shrink-0" />
              <span>
                {currentLicense.plan === 'ANUAL'
                  ? 'Licença Anual'
                  : currentLicense.plan === 'SEMESTRAL'
                  ? 'Licença Semestral'
                  : 'Licença Demo'}
                {licenseDaysLeft > 0 ? ` (${licenseDaysLeft}d)` : ' (Expirada)'}
              </span>
            </button>

            {/* Separador vertical sutil */}
            <div className="h-6 w-px bg-slate-200"></div>

            {/* Perfil do Utilizador (Avatar, Nome, Cargo + Dropdown) */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-left"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-200 to-rose-200 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden shadow-xs">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>

                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{currentUser.role}</div>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>

              {/* Menu Dropdown de Perfil & Sessão */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                      Sessão Autenticada
                    </span>
                    <div className="font-bold text-slate-900 text-sm leading-snug">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {currentUser.email}
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {currentUser.adminSubtype === 'ADMIN_A'
                        ? 'Administrador A (Acesso Total)'
                        : currentUser.adminSubtype === 'ADMIN_B'
                        ? 'Administrador B (Operações)'
                        : currentUser.role}
                    </div>
                  </div>

                  {/* Alternador Rápido de Utilizador (Teste Livre) */}
                  {allUsers && allUsers.length > 0 && onSwitchUser && (
                    <div className="p-2 border-b border-slate-100">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5 px-2">
                        Alternar Operador (Teste Livre)
                      </span>
                      <div className="space-y-0.5 max-h-36 overflow-y-auto">
                        {allUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u.id);
                              setUserMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              u.id === currentUser.id
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acesso exclusivo ao Módulo Licença: Apenas Administrador A */}
                  {isOnlyAdminA && (
                    <div className="p-2 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveNav('licenca');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-slate-950" />
                        <span>Módulo Licença (Admin A)</span>
                      </button>
                    </div>
                  )}

                  {/* Acesso exclusivo ao Layout Técnico Admin: Apenas Administrador A */}
                  {canAccessAdminLayout(currentUser) && onOpenAdminMode && (
                    <div className="p-2 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenAdminMode();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Consola Técnica Admin</span>
                      </button>
                    </div>
                  )}

                  {/* Opção de Reativar Exigência de Login */}
                  {isLoginSuspended && onReenableLogin && (
                    <div className="p-2 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onReenableLogin();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Reativar exigência de credenciais para pessoas de fora"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>Reativar Exigência de Login</span>
                      </button>
                    </div>
                  )}

                  {/* Botão de Terminar Sessão */}
                  {onLogout && (
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Terminar Sessão</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botão Directo de Terminar Sessão no Topo */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Terminar Sessão"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Banner de Instalação Mobile quando aberto no telemóvel e não instalado como standalone */}
        {!isInstalled && (
          <div className="md:hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-3.5 py-2 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Smartphone className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Instalar App Móvel no Telemóvel (Offline)</span>
            </div>
            <button
              type="button"
              onClick={handleOpenInstall}
              className="px-3 py-1 bg-white text-blue-800 hover:bg-sky-50 rounded-lg text-[11px] font-black shadow-xs cursor-pointer transition-colors"
            >
              Instalar Agora
            </button>
          </div>
        )}

        {/* Conteúdo Dinâmico dos 10 Módulos */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1550px] mx-auto w-full">
            {activeNav === 'dashboard' && (
              <OperatorDashboardView
                currentUser={currentUser}
                onNavigateTab={(tab) => setActiveNav(tab)}
              />
            )}
            {activeNav === 'vendas' && <QuickPOSView currentUser={currentUser} />}
            {activeNav === 'produtos' && <OperatorProductsView currentUser={currentUser} />}
            {activeNav === 'stock' && <OperatorStockView currentUser={currentUser} />}
            {activeNav === 'clientes' && <OperatorCustomersView currentUser={currentUser} />}
            {activeNav === 'fornecedores' && <OperatorSuppliersView currentUser={currentUser} />}
            {activeNav === 'compras' && <OperatorPurchasesView currentUser={currentUser} />}
            {activeNav === 'relatorios' && <OperatorReportsView currentUser={currentUser} />}
            {activeNav === 'utilizadores' && (
              <OperatorUsersView currentUser={currentUser} onSwitchUser={onSwitchUser} />
            )}
            {activeNav === 'definicoes' && <OperatorSettingsView currentUser={currentUser} />}
            {activeNav === 'licenca' && isOnlyAdminA && (
              <LicenseManagerView
                currentUser={currentUser}
                onNavigateTab={(tab) => setActiveNav(tab)}
              />
            )}

            {/* Vias Auxiliares */}
            {activeNav === 'caixa' && <OperatorCashView currentUser={currentUser} />}
            {activeNav === 'validar' && (
              <PublicInvoiceVerificationView onBackToApp={() => setActiveNav('dashboard')} />
            )}
          </div>
        </main>
      </div>

      {/* Modal de Instalação e Armazenamento Local / Nuvem */}
      <InstallAndSyncModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        initialTab={installModalTab}
      />

      {/* Modal Guiado de Instalação Móvel (Android / iOS) */}
      <AndroidInstallGuideModal
        isOpen={showAndroidGuideModal}
        onClose={() => setShowAndroidGuideModal(false)}
      />
    </div>
  );
};
