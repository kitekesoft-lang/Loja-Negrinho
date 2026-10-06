import React, { useState } from 'react';
import { User } from '../../core/fiscal/types/user';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { RestaurantTable, RestaurantOrderItem, FloorZone, TableStatus } from '../../core/fiscal/types/restaurant';
import {
  UtensilsCrossed,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Receipt,
  Users,
  Send,
  Trash2,
  Printer,
  ChevronRight,
  ArrowRightLeft,
  Coffee,
  Beer,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';

interface OperatorRestaurantViewProps {
  currentUser: User;
  onNavigateToPOS?: (tableData?: { tableName: string; amount: number; items: RestaurantOrderItem[] }) => void;
}

export const OperatorRestaurantView: React.FC<OperatorRestaurantViewProps> = ({ currentUser, onNavigateToPOS }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  const [selectedZone, setSelectedZone] = useState<FloorZone | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Mesa seleccionada para gerir comanda / pedido
  const [activeTable, setActiveTable] = useState<RestaurantTable | null>(null);

  // Estados para adicionar item à comanda da mesa
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Modal para criar nova mesa
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState(9);
  const [newTableName, setNewTableName] = useState('Mesa 09');
  const [newTableZone, setNewTableZone] = useState<FloorZone>('SALAO_PRINCIPAL');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Modal de transferência de mesa
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTableId, setTargetTableId] = useState('');

  // Ticket de cozinha impresso
  const [showKitchenTicket, setShowKitchenTicket] = useState(false);

  const tables = Array.from(db.tables.values());
  const products = Array.from(db.products.values());

  // Métricas
  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
  const billRequestedTables = tables.filter((t) => t.status === 'BILL_REQUESTED').length;
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE').length;
  const reservedTables = tables.filter((t) => t.status === 'RESERVED').length;
  const totalOpenRevenue = tables.reduce((acc, t) => acc + (t.subtotal || 0), 0);

  // Filtragem
  const filteredTables = tables.filter((t) => {
    if (selectedZone !== 'ALL' && t.zone !== selectedZone) return false;
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q) || String(t.number).includes(q);
      const matchCustomer = t.customerName?.toLowerCase().includes(q);
      const matchWaiter = t.waiterName?.toLowerCase().includes(q);
      if (!matchName && !matchCustomer && !matchWaiter) return false;
    }
    return true;
  });

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Livre
          </span>
        );
      case 'OCCUPIED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Ocupada
          </span>
        );
      case 'BILL_REQUESTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
            <Receipt className="w-3 h-3 text-amber-600" />
            Conta Pedida
          </span>
        );
      case 'RESERVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-600" />
            Reservada
          </span>
        );
    }
  };

  const getZoneLabel = (zone: FloorZone) => {
    switch (zone) {
      case 'SALAO_PRINCIPAL':
        return 'Salão Principal';
      case 'ESPLANADA':
        return 'Esplanada';
      case 'SALA_VIP':
        return 'Sala VIP';
      case 'BALCAO':
        return 'Balcão';
    }
  };

  // Abrir ou Ocupar Mesa
  const handleOpenTable = (table: RestaurantTable) => {
    const updated: RestaurantTable = {
      ...table,
      status: 'OCCUPIED',
      waiterName: currentUser.name,
      openedAt: new Date().toISOString(),
      items: table.items || [],
      subtotal: table.subtotal || 0,
    };
    db.updateTable(updated);
    setActiveTable(updated);
    forceUpdate();
  };

  // Adicionar item à comanda
  const handleAddItemToTable = () => {
    if (!activeTable) return;
    const prd = products.find((p) => p.id === selectedProductId);
    if (!prd) return;

    const newItem: RestaurantOrderItem = {
      id: `ORD-ITM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: prd.id,
      productName: prd.description,
      quantity: itemQuantity,
      unitPrice: prd.standardPrice,
      total: prd.standardPrice * itemQuantity,
      notes: itemNotes.trim() || undefined,
      status: 'PENDING',
      addedAt: new Date().toISOString(),
    };

    const newItems = [...(activeTable.items || []), newItem];
    const newSubtotal = newItems.reduce((acc, i) => acc + i.total, 0);

    const updated: RestaurantTable = {
      ...activeTable,
      items: newItems,
      subtotal: newSubtotal,
      status: activeTable.status === 'AVAILABLE' ? 'OCCUPIED' : activeTable.status,
    };

    db.updateTable(updated);
    setActiveTable(updated);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemNotes('');
    forceUpdate();
  };

  // Remover item da comanda
  const handleRemoveItem = (itemId: string) => {
    if (!activeTable) return;
    const newItems = activeTable.items.filter((i) => i.id !== itemId);
    const newSubtotal = newItems.reduce((acc, i) => acc + i.total, 0);

    const updated: RestaurantTable = {
      ...activeTable,
      items: newItems,
      subtotal: newSubtotal,
    };

    db.updateTable(updated);
    setActiveTable(updated);
    forceUpdate();
  };

  // Enviar pedidos para cozinha
  const handleSendToKitchen = () => {
    if (!activeTable) return;
    const updatedItems = activeTable.items.map((i) =>
      i.status === 'PENDING' ? { ...i, status: 'SENT_TO_KITCHEN' as const } : i
    );
    const updated: RestaurantTable = {
      ...activeTable,
      items: updatedItems,
    };
    db.updateTable(updated);
    setActiveTable(updated);
    setShowKitchenTicket(true);
    forceUpdate();
  };

  // Pedir conta
  const handleRequestBill = () => {
    if (!activeTable) return;
    const updated: RestaurantTable = {
      ...activeTable,
      status: 'BILL_REQUESTED',
    };
    db.updateTable(updated);
    setActiveTable(updated);
    forceUpdate();
  };

  // Liberar mesa / Concluir pagamento
  const handleClearTable = () => {
    if (!activeTable) return;
    const updated: RestaurantTable = {
      ...activeTable,
      status: 'AVAILABLE',
      customerName: undefined,
      customerNif: undefined,
      openedAt: undefined,
      items: [],
      subtotal: 0,
    };
    db.updateTable(updated);
    setActiveTable(null);
    forceUpdate();
  };

  // Criar nova mesa
  const handleCreateNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    const newTable: RestaurantTable = {
      id: `TBL-${String(newTableNumber).padStart(2, '0')}`,
      number: Number(newTableNumber),
      name: newTableName,
      zone: newTableZone,
      capacity: Number(newTableCapacity),
      status: 'AVAILABLE',
      items: [],
      subtotal: 0,
    };
    db.updateTable(newTable);
    setShowNewTableModal(false);
    forceUpdate();
  };

  // Transferir mesa
  const handleTransferTable = () => {
    if (!activeTable || !targetTableId) return;
    const target = db.tables.get(targetTableId);
    if (!target) return;

    // Atualiza a mesa de destino com os itens da mesa atual
    const updatedTarget: RestaurantTable = {
      ...target,
      status: 'OCCUPIED',
      waiterName: activeTable.waiterName,
      customerName: activeTable.customerName,
      customerNif: activeTable.customerNif,
      openedAt: activeTable.openedAt || new Date().toISOString(),
      items: [...target.items, ...activeTable.items],
      subtotal: target.subtotal + activeTable.subtotal,
    };

    // Libera a mesa de origem
    const clearedSource: RestaurantTable = {
      ...activeTable,
      status: 'AVAILABLE',
      customerName: undefined,
      customerNif: undefined,
      openedAt: undefined,
      items: [],
      subtotal: 0,
    };

    db.updateTable(updatedTarget);
    db.updateTable(clearedSource);
    setShowTransferModal(false);
    setActiveTable(updatedTarget);
    forceUpdate();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo Restauração */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Restauração & Gestão de Mesas
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  AGT Módulo POS
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Controlo em tempo real de salas, esplanadas, pedidos de cozinha/copa e fecho fiscal de contas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setNewTableNumber(tables.length + 1);
              setNewTableName(`Mesa ${String(tables.length + 1).padStart(2, '0')}`);
              setShowNewTableModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Mesa</span>
          </button>
        </div>
      </div>

      {/* 2. Cartões de Métricas em Tempo Real */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Mesas</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalTables}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{availableTables} livres no momento</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Mesas Ocupadas</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{occupiedTables}</div>
          <span className="text-[11px] text-blue-500 mt-0.5 block">Com pedidos em consumo</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Conta Pedida</span>
          <div className="text-2xl font-black text-amber-800 mt-1">{billRequestedTables}</div>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Prontas para faturar</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs bg-purple-50/20">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Reservas</span>
          <div className="text-2xl font-black text-purple-700 mt-1">{reservedTables}</div>
          <span className="text-[11px] text-purple-500 mt-0.5 block">Aguardando clientes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Consumo Aberto</span>
          <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">
            {totalOpenRevenue.toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Receita pendente em sala</span>
        </div>
      </div>

      {/* 3. Barra de Filtros por Sala / Esplanada e Estado */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Filtro por Zona */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todas as Zonas' },
            { id: 'SALAO_PRINCIPAL', label: 'Salão Principal' },
            { id: 'ESPLANADA', label: 'Esplanada' },
            { id: 'SALA_VIP', label: 'Sala VIP' },
            { id: 'BALCAO', label: 'Balcão Bar' },
          ].map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id as FloorZone | 'ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedZone === z.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Filtro por Estado e Pesquisa */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TableStatus | 'ALL')}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Estados</option>
            <option value="AVAILABLE">Apenas Livres</option>
            <option value="OCCUPIED">Apenas Ocupadas</option>
            <option value="BILL_REQUESTED">Conta Solicitada</option>
            <option value="RESERVED">Reservadas</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar mesa, cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Planta Visual de Mesas (Grelha de Mesas Interativas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isSelected = activeTable?.id === table.id;
          const isOccupied = table.status === 'OCCUPIED' || table.status === 'BILL_REQUESTED';

          return (
            <div
              key={table.id}
              onClick={() => setActiveTable(table)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-md bg-blue-50/30'
                  : table.status === 'OCCUPIED'
                  ? 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-sm'
                  : table.status === 'BILL_REQUESTED'
                  ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400 hover:shadow-sm ring-1 ring-amber-300/60'
                  : table.status === 'RESERVED'
                  ? 'border-purple-200 bg-purple-50/10 hover:border-purple-300'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              {/* Topo do Card de Mesa */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {table.number}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{table.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {getZoneLabel(table.zone)} • {table.capacity} lugares
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(table.status)}
                </div>

                {/* Dados da Ocupação */}
                {isOccupied && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Atendente:</span>
                      <span className="font-bold text-slate-700">{table.waiterName || 'Não atribuído'}</span>
                    </div>

                    {table.customerName && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Cliente:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[120px]">{table.customerName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Itens lançados:</span>
                      <span className="font-bold text-slate-800">{table.items?.length || 0} produtos</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé com Valor e Ação Rápida */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subtotal</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {(table.subtotal || 0).toLocaleString('pt-AO')} <span className="text-[11px]">Kz</span>
                  </span>
                </div>

                {table.status === 'AVAILABLE' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTable(table);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Ocupar Mesa
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTable(table);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <span>Ver Comanda</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Gaveta Lateral / Painel da Comanda da Mesa Selecionada */}
      {activeTable && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header da Gaveta */}
          <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-500 font-bold text-sm flex items-center justify-center">
                {activeTable.number}
              </span>
              <div>
                <h2 className="font-bold text-sm tracking-wide">{activeTable.name}</h2>
                <span className="text-xs text-slate-300">
                  {getZoneLabel(activeTable.zone)} • Atendente: {activeTable.waiterName || currentUser.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTable(null)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo da Comanda */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Lançamento Rápido de Produtos */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Lançar Produto na Comanda
              </span>

              <div className="space-y-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="">Selecione um artigo / refeição / bebida...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.description} — {p.standardPrice.toLocaleString('pt-AO')} Kz ({p.code})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">QTD</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Notas Cozinha / Bar</label>
                    <input
                      type="text"
                      placeholder="Ex: Sem cebola, Bem fresco"
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedProductId}
                  onClick={handleAddItemToTable}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar à Mesa</span>
                </button>
              </div>
            </div>

            {/* Lista de Itens Já Pedidos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span>Itens da Comanda ({activeTable.items?.length || 0})</span>
                <span>Subtotal: {activeTable.subtotal.toLocaleString('pt-AO')} Kz</span>
              </div>

              {activeTable.items && activeTable.items.length > 0 ? (
                <div className="space-y-2">
                  {activeTable.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{item.productName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              item.status === 'SENT_TO_KITCHEN'
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'SERVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status === 'SENT_TO_KITCHEN'
                              ? 'Cozinha'
                              : item.status === 'SERVED'
                              ? 'Servido'
                              : 'Pendente'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.quantity} un × {item.unitPrice.toLocaleString('pt-AO')} Kz ={' '}
                          <span className="font-bold text-slate-800">{item.total.toLocaleString('pt-AO')} Kz</span>
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded inline-block">
                            Obs: {item.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Coffee className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs">Nenhum produto lançado nesta mesa ainda.</p>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé com Ações da Comanda */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-900 text-base">
              <span>Total da Conta:</span>
              <span className="text-xl font-black text-blue-700 font-mono">
                {activeTable.subtotal.toLocaleString('pt-AO')} Kz
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendToKitchen}
                disabled={!activeTable.items || activeTable.items.length === 0}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Pedir Cozinha</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                disabled={!activeTable.items || activeTable.items.length === 0}
                className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                <span>Mudar Mesa</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleRequestBill}
                disabled={!activeTable.items || activeTable.items.length === 0}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-950" />
                <span>Pedir Conta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPOS) {
                    onNavigateToPOS({
                      tableName: activeTable.name,
                      amount: activeTable.subtotal,
                      items: activeTable.items,
                    });
                  }
                  handleClearTable();
                }}
                disabled={!activeTable.items || activeTable.items.length === 0}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Faturar no POS</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearTable}
              className="w-full text-center text-[11px] text-slate-400 hover:text-rose-600 font-bold py-1 cursor-pointer transition-colors"
            >
              Liberar Mesa sem Consumo
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal de Criação de Mesa */}
      {showNewTableModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-blue-600" />
              Adicionar Nova Mesa
            </h3>

            <form onSubmit={handleCreateNewTable} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Número da Mesa</label>
                  <input
                    type="number"
                    min={1}
                    value={newTableNumber}
                    onChange={(e) => {
                      setNewTableNumber(Number(e.target.value));
                      setNewTableName(`Mesa ${String(e.target.value).padStart(2, '0')}`);
                    }}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Capacidade (Lugares)</label>
                  <input
                    type="number"
                    min={1}
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome / Designação</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Zona / Localização</label>
                <select
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value as FloorZone)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white"
                >
                  <option value="SALAO_PRINCIPAL">Salão Principal</option>
                  <option value="ESPLANADA">Esplanada</option>
                  <option value="SALA_VIP">Sala VIP</option>
                  <option value="BALCAO">Balcão Bar</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTableModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Criar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal de Transferência de Mesa */}
      {showTransferModal && activeTable && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              Transferir da {activeTable.name} para:
            </h3>

            <div className="space-y-3 my-4">
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
              >
                <option value="">Selecione a mesa de destino...</option>
                {tables
                  .filter((t) => t.id !== activeTable.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({getZoneLabel(t.zone)}) — {t.status === 'AVAILABLE' ? 'Livre' : 'Ocupada (Juntar)'}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!targetTableId}
                onClick={handleTransferTable}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal de Pré-visualização do Ticket de Cozinha */}
      {showKitchenTicket && activeTable && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 font-mono text-xs text-slate-800">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="font-black text-sm uppercase">COMANDA DE COZINHA / BAR</h4>
              <p className="text-[10px] text-slate-500">{new Date().toLocaleString('pt-AO')}</p>
              <p className="font-bold text-xs mt-1">
                {activeTable.name} ({getZoneLabel(activeTable.zone)})
              </p>
              <p className="text-[10px] text-slate-500">Operador: {currentUser.name}</p>
            </div>

            <div className="py-3 space-y-2 border-b border-dashed border-slate-300">
              {activeTable.items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span className="font-bold">
                      {i.quantity}× {i.productName}
                    </span>
                    {i.notes && <div className="text-[10px] text-amber-700 italic">Obs: {i.notes}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 text-center space-y-2">
              <p className="text-[10px] text-slate-400">Enviado automaticamente para impressora de pedidos</p>
              <button
                type="button"
                onClick={() => setShowKitchenTicket(false)}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
