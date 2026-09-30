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
import { InstallAndSyncModal } from '../common/InstallAndSyncModal';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
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
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [installModalTab, setInstallModalTab] = useState<'INSTALLER' | 'STORAGE'>('INSTALLER');

  // 10 Módulos fiéis ao layout de referência
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
  ];

  return (
    <div id="minha-loja-layout" className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      {/* 1. SIDEBAR AZUL ESCURO / MARINHO COM IDENTIDADE "MINHA LOJA" */}
      <aside className="w-64 bg-[#081b3d] text-white flex flex-col justify-between shrink-0 shadow-lg select-none z-20">
        <div className="overflow-y-auto">
          {/* Nome e Marca "Minha Loja" conforme mockup */}
          <div className="p-4 border-b border-white/10 bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm tracking-tight text-white leading-tight truncate">
                  Minha Loja
                </div>
                <div className="text-[10px] text-blue-300 font-semibold tracking-wide">
                  Sistema de Gestão &amp; POS
                </div>
              </div>
            </div>
          </div>

          {/* Navegação dos 10 Módulos */}
          <nav className="p-3 space-y-0.5 mt-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Barra Lateral */}
        <div className="p-3 border-t border-white/5 space-y-1.5 shrink-0 bg-[#061530]">
          {/* Validação de QR & Fecho de Caixa rápidos */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setActiveNav('caixa')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeNav === 'caixa'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
              title="Abrir conferência de caixa"
            >
              <DollarSign className="w-3 h-3 text-amber-400" />
              <span>Caixa Diário</span>
            </button>
            <button
              onClick={() => setActiveNav('validar')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeNav === 'validar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
              title="Validação pública de fatura com QR Code"
            >
              <QrCode className="w-3 h-3 text-emerald-400" />
              <span>Validar QR</span>
            </button>
          </div>

          {/* Botão de Consola Técnica Admin se for Admin */}
          {currentUser.role === 'ADMIN' && onOpenAdminMode && (
            <button
              onClick={onOpenAdminMode}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-[11px] font-bold border border-amber-400/30 transition-all cursor-pointer"
              title="Voltar à Consola Técnica com as 4 Fases"
            >
              <Shield className="w-3 h-3" />
              <span>Consola Técnica Admin</span>
            </button>
          )}

          {/* Botão de Instalação e Armazenamento no Sidebar */}
          <button
            onClick={() => {
              setInstallModalTab('INSTALLER');
              setShowInstallModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-300" />
            <span>Instalar no PC / Telemóvel</span>
          </button>

          <div
            onClick={() => {
              setInstallModalTab('STORAGE');
              setShowInstallModal(true);
            }}
            className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
            title="Clique para gerir sincronização e cópias de segurança"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
                }`}
              ></span>
              <span className="text-[11px] font-medium text-slate-200">
                {isOnline ? 'Sistema online (Nuvem)' : 'Sistema offline (Local)'}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL COM HEADER BRANCO SUPERIOR E CONTEÚDO SCROLLÁVEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Branco */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 z-10">
          {/* Barra de Pesquisa Geral */}
          <div className="relative w-full max-w-md">
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
              onClick={() => {
                setInstallModalTab('INSTALLER');
                setShowInstallModal(true);
              }}
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
    </div>
  );
};
