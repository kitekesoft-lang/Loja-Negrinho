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
import { OperatorRestaurantView } from './OperatorRestaurantView';
import { OperatorServiceOrdersView } from './OperatorServiceOrdersView';
import { OperatorPayrollView } from './OperatorPayrollView';
import { OperatorSaftImporterView } from './OperatorSaftImporterView';
import { PublicInvoiceVerificationView } from '../fiscal/PublicInvoiceVerificationView';
import { LicenseManagerView } from '../admin/LicenseManagerView';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingBag,
  BarChart3,
  UserCheck,
  Settings,
  KeyRound,
  UtensilsCrossed,
  Wrench,
  WalletCards,
  FileUp,
  Search,
  ChevronDown,
  Shield,
  LogOut,
  Store,
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

  const isOnlyAdminA = canAccessAdminLayout(currentUser);
  const db = FiscalDatabase.getInstance();
  const company = Array.from(db.companies.values())[0];
  const establishmentName = company?.tradeName || company?.name || 'Minha Loja';

  // Módulos do Sistema ERP & POS (incluindo Restauração, OS, RH e Importador SAF-T)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendas', label: 'Vendas (POS)', icon: ShoppingCart },
    { id: 'caixa', label: 'Caixa Diário', icon: DollarSign },
    { id: 'restaurante', label: 'Restauração & Mesas', icon: UtensilsCrossed },
    { id: 'os', label: 'Ordens de Serviço', icon: Wrench },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'compras', label: 'Compras', icon: ShoppingBag },
    { id: 'salarios', label: 'RH & Salários', icon: WalletCards },
    { id: 'saft-import', label: 'Importar SAF-T', icon: FileUp },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'utilizadores', label: 'Utilizadores', icon: UserCheck },
    { id: 'definicoes', label: 'Configurações', icon: Settings },
    ...(isOnlyAdminA
      ? [{ id: 'licenca', label: 'Licenciamento', icon: KeyRound, isSpecial: true }]
      : []),
  ];

  return (
    <div id="minha-loja-layout" className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      {/* 1. SIDEBAR AZUL ESCURO / MARINHO ULTRA COMPACTO FIXO SEM DESLIZAMENTO */}
      <aside
        style={{ width: '64px', maxWidth: '5cm' }}
        className="w-[64px] max-w-[5cm] bg-[#061224] text-white flex flex-col items-center justify-start shrink-0 shadow-2xl select-none z-30 py-3 relative border-r border-sky-950/70"
      >
        {/* Navegação Vertical de Módulos (Ícones Alinhados ao Centro, Sem Deslizamentos) */}
        <div className="w-full flex-1 flex flex-col items-center space-y-1.5 overflow-y-auto no-scrollbar py-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <div key={item.id} className="relative flex items-center justify-center w-full px-2">
                {/* Linha indicadora azul claro no item ativo */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-r shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                )}

                <button
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50 ring-2 ring-blue-400/40'
                      : 'text-slate-400 hover:text-sky-300 hover:bg-white/10'
                  }`}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL COM HEADER BRANCO SUPERIOR E CONTEÚDO SCROLLÁVEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Branco: Apenas Nome/Logo, Pesquisa, Utilizador Logado e Botão de Logout */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-4">
          {/* 1. Nome e Logo do Estabelecimento */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 leading-tight block">
                {establishmentName}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold tracking-wide capitalize block">
                {menuItems.find((m) => m.id === activeNav)?.label || activeNav}
              </span>
            </div>
          </div>

          {/* 2. Campo de Pesquisa Geral */}
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

          {/* 3. Utilizador Logado e Botão de Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Perfil do Utilizador Logado */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-left"
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

                <ChevronDown className="w-4 h-4 text-slate-400" />
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

                  {/* Alternador Rápido de Utilizador */}
                  {allUsers && allUsers.length > 0 && onSwitchUser && (
                    <div className="p-2 border-b border-slate-100">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5 px-2">
                        Alternar Operador
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
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>Reativar Exigência de Login</span>
                      </button>
                    </div>
                  )}

                  {/* Botão de Terminar Sessão no Menu */}
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

            {/* Botão de Logout Direto */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Terminar Sessão"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
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
            {activeNav === 'restaurante' && (
              <OperatorRestaurantView
                currentUser={currentUser}
                onNavigateToPOS={() => setActiveNav('vendas')}
              />
            )}
            {activeNav === 'os' && <OperatorServiceOrdersView currentUser={currentUser} />}
            {activeNav === 'produtos' && <OperatorProductsView currentUser={currentUser} />}
            {activeNav === 'stock' && <OperatorStockView currentUser={currentUser} />}
            {activeNav === 'clientes' && <OperatorCustomersView currentUser={currentUser} />}
            {activeNav === 'fornecedores' && <OperatorSuppliersView currentUser={currentUser} />}
            {activeNav === 'compras' && <OperatorPurchasesView currentUser={currentUser} />}
            {activeNav === 'salarios' && <OperatorPayrollView currentUser={currentUser} />}
            {activeNav === 'saft-import' && <OperatorSaftImporterView currentUser={currentUser} />}
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
    </div>
  );
};
