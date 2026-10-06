import React, { useState } from 'react';
import { User } from '../../core/fiscal/types/user';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import {
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrderStatus,
} from '../../core/fiscal/types/serviceOrder';
import { InvoiceEngine } from '../../core/fiscal/engines/InvoiceEngine';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  User as UserIcon,
  Smartphone,
  Laptop,
  Car,
  Package,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface OperatorServiceOrdersViewProps {
  currentUser: User;
}

export const OperatorServiceOrdersView: React.FC<OperatorServiceOrdersViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Ordem de Serviço selecionada para visualizar/editar
  const [activeOrder, setActiveOrder] = useState<ServiceOrder | null>(null);

  // Modal para criar nova Ordem de Serviço
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newEquipmentType, setNewEquipmentType] = useState('Computador Portátil');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newAccessories, setNewAccessories] = useState('');
  const [newReportedFault, setNewReportedFault] = useState('');
  const [newTechnician, setNewTechnician] = useState('Bernardo Silva (Técnico TI)');

  // Modal de adicionar peça ou mão de obra na OS ativa
  const [itemType, setItemType] = useState<'PART' | 'LABOR'>('PART');
  const [itemProductId, setItemProductId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState(0);

  // Modal de Impressão da Ficha de Assistência Técnica
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Feedback de faturação concluída
  const [invoicedFeedback, setInvoicedFeedback] = useState<string | null>(null);

  const orders = Array.from(db.serviceOrders.values());
  const customers = Array.from(db.customers.values());
  const products = Array.from(db.products.values());

  // Métricas
  const totalOrders = orders.length;
  const inProgressOrders = orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'DIAGNOSIS').length;
  const readyOrders = orders.filter((o) => o.status === 'READY').length;
  const invoicedOrders = orders.filter((o) => o.status === 'DELIVERED_INVOICED').length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  // Filtragem
  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'ALL' && o.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCust = o.customerName.toLowerCase().includes(q) || o.customerPhone?.includes(q);
      const matchEquip = `${o.equipment.brand} ${o.equipment.model} ${o.equipment.serialNumber || ''}`.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchEquip) return false;
    }
    return true;
  });

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Rascunho</span>;
      case 'DIAGNOSIS':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Em Diagnóstico</span>;
      case 'AWAITING_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Aguarda Aprovação</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Em Reparação</span>;
      case 'READY':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-black animate-pulse">Pronta p/ Entrega</span>;
      case 'DELIVERED_INVOICED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-white">Entregue & Faturada</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Cancelada</span>;
    }
  };

  // Criar Nova Ordem de Serviço
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newCustomerId) || customers[0];

    const nextSeq = orders.length + 1;
    const year = new Date().getFullYear();
    const orderNumber = `OS-${year}/${String(nextSeq).padStart(4, '0')}`;

    const newOrder: ServiceOrder = {
      id: `OS-${Date.now()}`,
      orderNumber,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone || '923 000 000',
      customerNif: cust.taxId,
      equipment: {
        type: newEquipmentType,
        brand: newBrand,
        model: newModel,
        serialNumber: newSerialNumber.trim() || undefined,
        accessories: newAccessories.trim() || undefined,
        reportedFault: newReportedFault,
      },
      status: 'DIAGNOSIS',
      assignedTechnician: newTechnician,
      items: [],
      partsSubtotal: 0,
      laborSubtotal: 0,
      totalAmount: 0,
      warrantyPeriodDays: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.updateServiceOrder(newOrder);
    setShowNewOrderModal(false);
    setActiveOrder(newOrder);
    setNewBrand('');
    setNewModel('');
    setNewSerialNumber('');
    setNewAccessories('');
    setNewReportedFault('');
    forceUpdate();
  };

  // Adicionar item ou mão de obra na OS
  const handleAddItemToOrder = () => {
    if (!activeOrder) return;
    let description = itemDescription;
    let price = itemUnitPrice;

    if (itemType === 'PART' && itemProductId) {
      const p = products.find((prod) => prod.id === itemProductId);
      if (p) {
        description = p.description;
        if (!price) price = p.standardPrice;
      }
    }

    if (!description || price <= 0) return;

    const newItem: ServiceOrderItem = {
      id: `OS-ITM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: itemType,
      productId: itemType === 'PART' ? itemProductId : undefined,
      description,
      quantity: itemQuantity,
      unitPrice: price,
      total: price * itemQuantity,
      taxRate: 14,
    };

    const newItems = [...activeOrder.items, newItem];
    const partsSub = newItems.filter((i) => i.type === 'PART').reduce((acc, i) => acc + i.total, 0);
    const laborSub = newItems.filter((i) => i.type === 'LABOR').reduce((acc, i) => acc + i.total, 0);

    const updated: ServiceOrder = {
      ...activeOrder,
      items: newItems,
      partsSubtotal: partsSub,
      laborSubtotal: laborSub,
      totalAmount: partsSub + laborSub,
      updatedAt: new Date().toISOString(),
    };

    db.updateServiceOrder(updated);
    setActiveOrder(updated);
    setItemDescription('');
    setItemProductId('');
    setItemUnitPrice(0);
    setItemQuantity(1);
    forceUpdate();
  };

  // Alterar estado da OS
  const handleChangeStatus = (newStatus: ServiceOrderStatus) => {
    if (!activeOrder) return;
    const updated: ServiceOrder = {
      ...activeOrder,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    db.updateServiceOrder(updated);
    setActiveOrder(updated);
    forceUpdate();
  };

  // Faturar Ordem de Serviço (Emissão Automática no Motor Fiscal AGT)
  const handleInvoiceServiceOrder = () => {
    if (!activeOrder || activeOrder.status === 'DELIVERED_INVOICED') return;

    const company = db.companies.get('COMP-001')!;
    const series = db.series.get('SER-FR-2026') || db.series.get('SER-FT-2026')!;
    const customer = db.customers.get(activeOrder.customerId) || db.customers.get('CLI-FINAL')!;

    // Transforma itens da OS em linhas fiscais de fatura
    const invoiceLines = activeOrder.items.map((item) => ({
      productId: item.productId || 'PRD-FORMACAO',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      description: `[${activeOrder.orderNumber}] ${item.description}`,
    }));

    // Se a OS não tinha itens cadastrados, gera uma linha com o total global
    if (invoiceLines.length === 0) {
      invoiceLines.push({
        productId: 'PRD-FORMACAO',
        quantity: 1,
        unitPrice: activeOrder.totalAmount > 0 ? activeOrder.totalAmount : 15000,
        description: `Prestação de Serviços Técnicos ref. ${activeOrder.orderNumber}`,
      });
    }

    try {
      const issuedDoc = InvoiceEngine.issueFiscalDocument(
        {
          company,
          establishmentId: 'EST-001',
          series,
          documentTypeCode: 'FR',
          customer,
          lines: invoiceLines,
          issuedByUser: currentUser,
          previousDocumentHash: db.getLastHashForSeries(series.id),
        },
        {
          products: db.products,
          taxConfigs: db.taxConfigurations,
        }
      );

      db.documents.set(issuedDoc.id, issuedDoc);

      const updated: ServiceOrder = {
        ...activeOrder,
        status: 'DELIVERED_INVOICED',
        invoicedDocumentNumber: issuedDoc.documentNumber,
        updatedAt: new Date().toISOString(),
      };

      db.updateServiceOrder(updated);
      setActiveOrder(updated);
      setInvoicedFeedback(`Fatura-Recibo ${issuedDoc.documentNumber} emitida com sucesso com assinatura digital AGT e QR Code!`);
      forceUpdate();
    } catch (err: any) {
      alert(`Erro na emissão fiscal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo de Ordens de Serviço */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Ordens de Serviço & Assistência Técnica
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Oficina & TI
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Fichas de reparação, controlo de peças e mão-de-obra com conversão direta em Factura Fiscal AGT
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (customers.length > 0) setNewCustomerId(customers[0].id);
              setShowNewOrderModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ordem de Serviço</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Feedback de Faturação Concluída */}
      {invoicedFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{invoicedFeedback}</span>
          </div>
          <button onClick={() => setInvoicedFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* 3. Cartões de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total de OS</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalOrders}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Histórico de reparações</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Em Reparação</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{inProgressOrders}</div>
          <span className="text-[11px] text-blue-500 mt-0.5 block">Em diagnóstico / bancada</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Prontas p/ Entrega</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{readyOrders}</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Aguardando levantamento</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs bg-slate-50">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Entregues & Faturadas</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{invoicedOrders}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Com documento fiscal emitido</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Faturamento Global</span>
          <div className="text-2xl font-black text-blue-800 mt-1 font-mono">
            {totalRevenue.toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
          </div>
          <span className="text-[11px] text-blue-600 mt-0.5 block">Peças + Mão de Obra</span>
        </div>
      </div>

      {/* 4. Barra de Filtro e Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todas as OS' },
            { id: 'IN_PROGRESS', label: 'Em Reparação' },
            { id: 'READY', label: 'Prontas' },
            { id: 'DELIVERED_INVOICED', label: 'Faturadas' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id as ServiceOrderStatus | 'ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nº OS, cliente, equipamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 5. Tabela / Lista de Ordens de Serviço */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">N.º da Ordem</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Equipamento</th>
                <th className="py-3 px-4">Avaria Relatada</th>
                <th className="py-3 px-4">Técnico</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setActiveOrder(order)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-black text-blue-700">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.customerPhone || order.customerNif}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">
                        {order.equipment.brand} {order.equipment.model}
                      </div>
                      <div className="text-[10px] text-slate-500">{order.equipment.type}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {order.equipment.reportedFault}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {order.assignedTechnician || 'Geral'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {order.totalAmount.toLocaleString('pt-AO')} Kz
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveOrder(order)}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Abrir Ficha
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma ordem de serviço encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Gaveta Lateral / Ficha Técnica Detalhada da OS */}
      {activeOrder && (
        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header da Gaveta */}
          <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-600 font-bold text-sm flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </span>
              <div>
                <h2 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  {activeOrder.orderNumber}
                  {getStatusBadge(activeOrder.status)}
                </h2>
                <span className="text-xs text-slate-300">
                  Cliente: {activeOrder.customerName} ({activeOrder.customerNif})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Imprimir Ficha de Entrada"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo da Ficha Técnica */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Dados do Equipamento */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Equipamento em Assistência</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tipo:</span>
                  <span className="font-bold">{activeOrder.equipment.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Marca / Modelo:</span>
                  <span className="font-bold">{activeOrder.equipment.brand} {activeOrder.equipment.model}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Nº de Série:</span>
                  <span className="font-mono">{activeOrder.equipment.serialNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Acessórios deixados:</span>
                  <span>{activeOrder.equipment.accessories || 'Nenhum'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[10px] text-slate-400 block">Avaria Relatada:</span>
                <p className="text-slate-800 font-medium italic mt-0.5">"{activeOrder.equipment.reportedFault}"</p>
              </div>

              {activeOrder.equipment.technicalDiagnosis && (
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-[10px] text-blue-600 font-bold block">Diagnóstico Técnico:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{activeOrder.equipment.technicalDiagnosis}</p>
                </div>
              )}
            </div>

            {/* Alternar Estado da OS */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Atualizar Estado da Reparação</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'DIAGNOSIS', label: 'Em Diagnóstico' },
                  { id: 'IN_PROGRESS', label: 'Em Reparação' },
                  { id: 'READY', label: 'Pronta p/ Entrega' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleChangeStatus(st.id as ServiceOrderStatus)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeOrder.status === st.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Peças e Mão de Obra */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Peças & Mão de Obra Aplicadas
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {activeOrder.totalAmount.toLocaleString('pt-AO')} Kz
                </span>
              </div>

              {/* Form de Inserção Rápida */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setItemType('PART')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      itemType === 'PART' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Peça / Componente
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('LABOR')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      itemType === 'LABOR' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Mão de Obra / Serviço
                  </button>
                </div>

                {itemType === 'PART' ? (
                  <select
                    value={itemProductId}
                    onChange={(e) => {
                      setItemProductId(e.target.value);
                      const prd = products.find((p) => p.id === e.target.value);
                      if (prd) {
                        setItemDescription(prd.description);
                        setItemUnitPrice(prd.standardPrice);
                      }
                    }}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Selecione peça do inventário...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.description} — {p.standardPrice.toLocaleString('pt-AO')} Kz ({p.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Descrição do serviço (ex: Limpeza, Soldadura, Calibração)"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg"
                  />
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block">QTD</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-bold text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold block">Preço Unitário (Kz)</label>
                    <input
                      type="number"
                      min={0}
                      value={itemUnitPrice}
                      onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToOrder}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  + Lançar na Folha da OS
                </button>
              </div>

              {/* Lista dos Itens da OS */}
              <div className="space-y-1.5">
                {activeOrder.items.map((item) => (
                  <div key={item.id} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">
                        <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-slate-100 text-slate-600 mr-1.5">
                          {item.type === 'PART' ? 'PEÇA' : 'SERVIÇO'}
                        </span>
                        {item.description}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity} un × {item.unitPrice.toLocaleString('pt-AO')} Kz
                      </div>
                    </div>
                    <span className="font-bold font-mono text-slate-900">
                      {item.total.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rodapé de Ações & Faturação Fiscal */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
              <span>Total da Assistência:</span>
              <span className="text-xl font-black text-blue-700 font-mono">
                {activeOrder.totalAmount.toLocaleString('pt-AO')} Kz
              </span>
            </div>

            {activeOrder.invoicedDocumentNumber ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between">
                <span>Faturado no documento: {activeOrder.invoicedDocumentNumber}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInvoiceServiceOrder}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Emitir Factura-Recibo (FR) Certificada AGT</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. Modal de Criação de Nova Ordem de Serviço */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              Abrir Nova Ordem de Serviço (Ficha Técnica)
            </h3>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cliente Solicitante</label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-200 rounded-xl font-medium text-slate-900 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — NIF: {c.taxId} ({c.phone || 'Sem telefone'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Equipamento</label>
                  <select
                    value={newEquipmentType}
                    onChange={(e) => setNewEquipmentType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-900"
                  >
                    <option value="Computador Portátil">Computador Portátil</option>
                    <option value="Computador Desktop">Computador Desktop</option>
                    <option value="Impressora Fiscal">Impressora Fiscal / Térmica</option>
                    <option value="Terminal POS">Terminal POS</option>
                    <option value="Smartphone / Tablet">Smartphone / Tablet</option>
                    <option value="Viatura / Motor">Viatura / Motor</option>
                    <option value="Outro Equipamento">Outro Equipamento</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Ex: HP, Epson, Toyota, Apple"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: ProBook 450, TM-T20III"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nº de Série / Chassis</label>
                  <input
                    type="text"
                    placeholder="Ex: 5CD12984XJ"
                    value={newSerialNumber}
                    onChange={(e) => setNewSerialNumber(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Acessórios Entregues com o Equipamento</label>
                <input
                  type="text"
                  placeholder="Ex: Carregador original, Bolsa, Cabo de energia, Chave"
                  value={newAccessories}
                  onChange={(e) => setNewAccessories(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Avaria Relatada pelo Cliente</label>
                <textarea
                  rows={2}
                  placeholder="Descreva o sintoma relatado pelo cliente..."
                  value={newReportedFault}
                  onChange={(e) => setNewReportedFault(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Técnico Atribuído</label>
                <input
                  type="text"
                  value={newTechnician}
                  onChange={(e) => setNewTechnician(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Gravar & Gerar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal de Impressão da Ficha de Entrada */}
      {showPrintModal && activeOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 font-sans text-xs space-y-4">
            <div className="text-center pb-3 border-b border-slate-200">
              <h4 className="font-black text-sm uppercase tracking-wide">COMPROVATIVO DE ENTRADA PARA ASSISTÊNCIA</h4>
              <p className="text-[11px] font-bold text-blue-700 font-mono mt-1">{activeOrder.orderNumber}</p>
              <p className="text-[10px] text-slate-500">Data de Entrada: {new Date(activeOrder.createdAt).toLocaleString('pt-AO')}</p>
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div><span className="font-bold">Cliente:</span> {activeOrder.customerName} ({activeOrder.customerNif})</div>
              <div><span className="font-bold">Contacto:</span> {activeOrder.customerPhone || '923 000 000'}</div>
              <div><span className="font-bold">Equipamento:</span> {activeOrder.equipment.brand} {activeOrder.equipment.model}</div>
              <div><span className="font-bold">N.º Série:</span> {activeOrder.equipment.serialNumber || 'N/A'}</div>
              <div><span className="font-bold">Acessórios:</span> {activeOrder.equipment.accessories || 'Nenhum'}</div>
              <div><span className="font-bold">Avaria:</span> {activeOrder.equipment.reportedFault}</div>
            </div>

            <div className="text-[10px] text-slate-500 italic p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              Termos: O levantamento do equipamento só será autorizado mediante apresentação deste canhoto original. Garantia legal de reparação de 90 dias nos termos do Código Comercial Angolano.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar Comprovativo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
