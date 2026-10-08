import React, { useState, useRef, useEffect } from 'react';
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
import { OperatorPayrollView } from './OperatorPayrollView';
import { PublicInvoiceVerificationView } from '../fiscal/PublicInvoiceVerificationView';
import { LicenseManagerView } from '../admin/LicenseManagerView';
import { ReceiptPreviewModal } from '../common/ReceiptPreviewModal';
import { ProductVisual } from '../common/ProductVisual';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { Product } from '../../core/fiscal/types/product';
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
  WalletCards,
  Search,
  ChevronDown,
  Shield,
  LogOut,
  Store,
  X,
  FileText,
  Tag,
  ArrowRight,
  ExternalLink,
  Eye,
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
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<'TODOS' | 'PRODUTOS' | 'FATURAS' | 'CLIENTES'>('TODOS');
  const [selectedDocPreview, setSelectedDocPreview] = useState<FiscalDocument | null>(null);
  const [selectedProductPreview, setSelectedProductPreview] = useState<Product | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isOnlyAdminA = canAccessAdminLayout(currentUser);
  const db = FiscalDatabase.getInstance();
  const company = Array.from(db.companies.values())[0];
  const establishmentName = company?.tradeName || company?.name || 'Minha Loja';

  // Fechar dropdown de pesquisa ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Motor de Pesquisa Global em Tempo Real
  const query = globalSearch.trim().toLowerCase();

  const matchedProducts = query
    ? Array.from(db.products.values()).filter(
        (p) =>
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.code && p.code.toLowerCase().includes(query)) ||
          (p.barcode && p.barcode.toLowerCase().includes(query)) ||
          (p.categoryId && p.categoryId.toLowerCase().includes(query))
      )
    : [];

  const matchedDocs = query
    ? Array.from(db.documents.values()).filter(
        (d) =>
          (d.documentNumber && d.documentNumber.toLowerCase().includes(query)) ||
          (d.customerName && d.customerName.toLowerCase().includes(query)) ||
          (d.customerTaxId && d.customerTaxId.toLowerCase().includes(query)) ||
          (d.notes && d.notes.toLowerCase().includes(query))
      )
    : [];

  const matchedCustomers = query
    ? Array.from(db.customers.values()).filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.taxId && c.taxId.toLowerCase().includes(query)) ||
          (c.phone && c.phone.toLowerCase().includes(query))
      )
    : [];

  const totalResults = matchedProducts.length + matchedDocs.length + matchedCustomers.length;
  const isSearchDropdownOpen = searchFocused && query.length > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedProducts.length > 0) {
      setActiveNav('produtos');
      setSearchFocused(false);
    } else if (matchedDocs.length > 0) {
      setSelectedDocPreview(matchedDocs[0]);
      setSearchFocused(false);
    } else if (matchedCustomers.length > 0) {
      setActiveNav('clientes');
      setSearchFocused(false);
    }
  };

  // Módulos do Sistema ERP & POS (sem Restauração, OS e SAF-T import conforme solicitado)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendas', label: 'Vendas (POS)', icon: ShoppingCart },
    { id: 'caixa', label: 'Caixa Diário', icon: DollarSign },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'compras', label: 'Compras', icon: ShoppingBag },
    { id: 'salarios', label: 'RH & Salários', icon: WalletCards },
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

          {/* 2. Campo de Pesquisa Geral com Resultados em Tempo Real */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar produtos, código de barras, clientes, faturas..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchFocused(false);
                  }
                }}
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {globalSearch.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearch('');
                    setSearchFocused(false);
                  }}
                  className="absolute right-3 p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* PAINEL DE RESULTADOS EM TEMPO REAL (SPOTLIGHT DROPDOWN) */}
            {isSearchDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-98 duration-100 max-h-[480px] flex flex-col">
                {/* Cabeçalho do Dropdown com Filtros */}
                <div className="p-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSearchFilter('TODOS')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        searchFilter === 'TODOS'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      Todos ({totalResults})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchFilter('PRODUTOS')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        searchFilter === 'PRODUTOS'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      Produtos ({matchedProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchFilter('FATURAS')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        searchFilter === 'FATURAS'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      Faturas ({matchedDocs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchFilter('CLIENTES')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        searchFilter === 'CLIENTES'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      Clientes ({matchedCustomers.length})
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchFocused(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                    title="Fechar (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de Resultados */}
                <div className="overflow-y-auto p-2 space-y-3 divide-y divide-slate-100 flex-1">
                  {totalResults === 0 ? (
                    <div className="py-8 px-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Nenhum resultado encontrado para &quot;{globalSearch}&quot;
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Tente pesquisar pelo nome do produto, código de barras, número da fatura (ex: FR 2026/1) ou nome do cliente.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* SECÇÃO PRODUTOS */}
                      {(searchFilter === 'TODOS' || searchFilter === 'PRODUTOS') && matchedProducts.length > 0 && (
                        <div className="pt-1.5 first:pt-0 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                            Produtos ({matchedProducts.length})
                          </span>
                          <div className="space-y-1">
                            {matchedProducts.map((p) => {
                              const stockQty = db.stockItems.get(p.id)?.currentQuantity ?? 20;
                              return (
                                <div
                                  key={p.id}
                                  className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all flex items-center justify-between gap-3 group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="shrink-0">
                                      <ProductVisual codeOrName={p.description || p.code} size="sm" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-slate-900 truncate">
                                        {p.description}
                                      </div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                                        <span>Cód: {p.code}</span>
                                        {p.barcode && <span>• {p.barcode}</span>}
                                        <span className={stockQty <= 5 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                                          • {stockQty} em stock
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-extrabold text-xs text-slate-900 font-mono">
                                      {p.standardPrice.toLocaleString('pt-AO')} Kz
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveNav('vendas');
                                        setSearchFocused(false);
                                      }}
                                      className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                      title="Vender no POS"
                                    >
                                      Vender (POS)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveNav('produtos');
                                        setSearchFocused(false);
                                      }}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                      title="Ver no catálogo de produtos"
                                    >
                                      Ver Catálogo
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* SECÇÃO FATURAS / DOCUMENTOS */}
                      {(searchFilter === 'TODOS' || searchFilter === 'FATURAS') && matchedDocs.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                            Faturas &amp; Documentos Fiscais ({matchedDocs.length})
                          </span>
                          <div className="space-y-1">
                            {matchedDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                      <span>{doc.documentNumber}</span>
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                        {doc.documentTypeCode}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      <span>{doc.customerName || 'Consumidor Final'}</span>
                                      <span className="mx-1">•</span>
                                      <span>{new Date(doc.systemEntryDate).toLocaleDateString('pt-AO')}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-extrabold text-xs text-emerald-800 font-mono">
                                    {doc.netTotal.toLocaleString('pt-AO')} Kz
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDocPreview(doc);
                                      setSearchFocused(false);
                                    }}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    title="Visualizar fatura e QR Code"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Ver Fatura</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SECÇÃO CLIENTES */}
                      {(searchFilter === 'TODOS' || searchFilter === 'CLIENTES') && matchedCustomers.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                            Clientes ({matchedCustomers.length})
                          </span>
                          <div className="space-y-1">
                            {matchedCustomers.map((cust) => (
                              <div
                                key={cust.id}
                                className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                    <Users className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-slate-900 truncate">
                                      {cust.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                                      <span>NIF: {cust.taxId}</span>
                                      {cust.phone && <span>• Tel: {cust.phone}</span>}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveNav('clientes');
                                    setSearchFocused(false);
                                  }}
                                  className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Ver Cliente
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Rodapé com Dica de Ação Rápida */}
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-center gap-2 shrink-0">
                  <span>Pressione <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9px]">Enter</kbd> para abrir ou <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9px]">Esc</kbd> para fechar</span>
                </div>
              </div>
            )}
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

        {/* Conteúdo Dinâmico dos Módulos */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1550px] mx-auto w-full">
            {activeNav === 'dashboard' && (
              <OperatorDashboardView
                currentUser={currentUser}
                onNavigateTab={(tab) => setActiveNav(tab)}
              />
            )}
            {activeNav === 'vendas' && <QuickPOSView currentUser={currentUser} />}
            {activeNav === 'produtos' && (
              <OperatorProductsView
                currentUser={currentUser}
                initialSearch={activeNav === 'produtos' ? globalSearch : ''}
              />
            )}
            {activeNav === 'stock' && <OperatorStockView currentUser={currentUser} />}
            {activeNav === 'clientes' && <OperatorCustomersView currentUser={currentUser} />}
            {activeNav === 'fornecedores' && <OperatorSuppliersView currentUser={currentUser} />}
            {activeNav === 'compras' && <OperatorPurchasesView currentUser={currentUser} />}
            {activeNav === 'salarios' && <OperatorPayrollView currentUser={currentUser} />}
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

      {/* Modal de Pré-visualização e Impressão de Factura / Recibo acionado pela Pesquisa */}
      {selectedDocPreview && company && (
        <ReceiptPreviewModal
          document={selectedDocPreview}
          company={company}
          initialMode="thermal"
          onClose={() => setSelectedDocPreview(null)}
        />
      )}
    </div>
  );
};
