import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User } from '../../core/fiscal/types/user';
import { Product } from '../../core/fiscal/types/product';
import { ProductVisual } from '../common/ProductVisual';
import { BarcodeVisual } from '../common/BarcodeVisual';
import {
  generateNextProductId,
  generateNextBarcode,
} from '../../core/fiscal/utils/productCodeGenerator';
import {
  Search,
  Plus,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Barcode,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Tag,
} from 'lucide-react';

interface OperatorProductsViewProps {
  currentUser: User;
  initialSearch?: string;
}

export const OperatorProductsView: React.FC<OperatorProductsViewProps> = ({ initialSearch }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  const [searchQuery, setSearchQuery] = useState(initialSearch || '');

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);

  // Form de novo produto com ID e Código de Barras gerados automaticamente
  const [formId, setFormId] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Alimentação');
  const [formPrice, setFormPrice] = useState(5000);
  const [formStock, setFormStock] = useState(20);
  const [formMinStock, setFormMinStock] = useState(5);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  // Lista viva de produtos a partir da base de dados fiscal
  const allDbProducts = Array.from(db.products.values());
  const stockItems = Array.from(db.stockItems.values());

  // Mapear categoria amigável
  const getCategoryLabel = (p: Product): string => {
    if (p.categoryId === 'CAT-BASICA') return 'Alimentação';
    if (p.categoryId === 'CAT-LACTICINIOS') return 'Bebidas/Lácteos';
    if (p.categoryId === 'CAT-BEBIDAS') return 'Bebidas';
    if (p.categoryId === 'CAT-PADARIA') return 'Padaria';
    if (p.categoryId === 'CAT-HIGIENE') return 'Limpeza';
    if (p.categoryId === 'CAT-FRESCOS') return 'Frescos';
    if (p.categoryId === 'CAT-SNACKS') return 'Alimentação';
    return 'Alimentação';
  };

  // Mapear todos os produtos para a tabela com status de estoque real
  const allDisplayItems = allDbProducts.map((p) => {
    const liveStock = stockItems.find((s) => s.productId === p.id);
    const currQty = liveStock ? liveStock.currentQuantity : 10;
    const minQty = liveStock ? liveStock.minimumStock : 5;
    const isLow = currQty <= minQty;

    return {
      id: p.id,
      code: p.code || p.id,
      barcode: p.barcode || `56010010000${p.id.slice(-2)}`,
      name: p.description,
      category: getCategoryLabel(p),
      price: p.standardPrice,
      stock: currQty,
      minStock: minQty,
      status: isLow ? 'Baixo' : 'OK',
    };
  });

  // Filtragem da tabela: aceita busca por ID, Código, Nome ou Código de Barras
  const filtered = allDisplayItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.barcode.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    const matchCategory =
      selectedCategory === 'TODAS' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchStatus =
      selectedStatus === 'TODOS' ||
      item.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchSearch && matchCategory && matchStatus;
  });

  // Abrir modal de criação com ID e Código de Barras gerados automaticamente
  const handleOpenAddModal = () => {
    const nextId = generateNextProductId(allDbProducts);
    const nextBarcode = generateNextBarcode(allDbProducts);
    setFormId(nextId);
    setFormBarcode(nextBarcode);
    setFormName('');
    setFormCategory('Alimentação');
    setFormPrice(4000);
    setFormStock(20);
    setFormMinStock(5);
    setShowAddModal(true);
  };

  // Regenerar novo ID sequencial
  const handleRegenerateId = () => {
    const nextId = generateNextProductId(allDbProducts);
    setFormId(nextId);
  };

  // Regenerar novo código de barras EAN-13
  const handleRegenerateBarcode = () => {
    const nextBarcode = generateNextBarcode(allDbProducts);
    setFormBarcode(nextBarcode);
  };

  // Copiar para clipboard com feedback
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Salvar novo produto
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) return;

    const company = Array.from(db.companies.values())[0];
    const cleanId = formId.trim() || generateNextProductId(allDbProducts);
    const cleanBarcode = formBarcode.trim() || generateNextBarcode(allDbProducts);

    // Mapear categoria para ID de categoria fiscal
    const categoryMapping: Record<string, string> = {
      'Alimentação': 'CAT-BASICA',
      'Bebidas': 'CAT-BEBIDAS',
      'Bebidas/Lácteos': 'CAT-LACTICINIOS',
      'Padaria': 'CAT-PADARIA',
      'Limpeza': 'CAT-HIGIENE',
    };

    const newProd: Product = {
      id: cleanId,
      companyId: company?.id || 'COMP-001',
      code: cleanId,
      barcode: cleanBarcode,
      description: formName.trim(),
      type: 'PRODUCT',
      unit: 'UN',
      categoryId: categoryMapping[formCategory] || 'CAT-BASICA',
      standardPrice: Number(formPrice),
      taxConfigurationId: 'TAX-IVA07',
      withholdingTaxApplicable: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Guardar produto na base de dados
    db.products.set(newProd.id, newProd);

    // Registar estoque inicial
    const mainWarehouse = Array.from(db.warehouses.values())[0];
    const warehouseId = mainWarehouse ? mainWarehouse.id : 'WAR-001';
    const stockId = `STK-${newProd.id}`;

    db.stockItems.set(stockId, {
      id: stockId,
      warehouseId,
      productId: newProd.id,
      currentQuantity: Number(formStock),
      reservedQuantity: 0,
      availableQuantity: Number(formStock),
      averageCostPrice: Math.round(Number(formPrice) * 0.7),
      totalValuation: Number(formStock) * Math.round(Number(formPrice) * 0.7),
      minimumStock: Number(formMinStock),
      maximumStock: Number(formStock) * 4,
      lastMovementDate: new Date().toISOString(),
    });

    // Registar movimento de entrada
    const movId = `MOV-${Date.now().toString(36)}`;
    db.stockMovements.set(movId, {
      id: movId,
      warehouseId,
      productId: newProd.id,
      movementType: 'ENTRY_PURCHASE',
      quantity: Number(formStock),
      unitCost: Math.round(Number(formPrice) * 0.7),
      totalCost: Number(formStock) * Math.round(Number(formPrice) * 0.7),
      documentReference: 'CADASTRO-INICIAL',
      notes: `Entrada inicial do produto ${newProd.description} (ID: ${newProd.id})`,
      date: new Date().toISOString(),
      userId: 'USR-ADMIN-A',
    });

    // Notificar os listeners reactivos para actualizar o POS e outras abas
    db.notify();

    setShowAddModal(false);
    setSuccessBanner(
      `Produto "${newProd.description}" criado com sucesso! ID: ${newProd.id} (pesquisa) • Código de Barras: ${newProd.barcode} (leitor).`
    );
    setTimeout(() => setSuccessBanner(null), 5000);
    setTick((t) => t + 1);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente eliminar o produto "${name}"?`)) {
      db.products.delete(id);
      db.notify();
      setTick((t) => t + 1);
    }
  };

  return (
    <div id="operator-products-view" className="space-y-4">
      {/* Banner de Sucesso */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Barra de Ações Superior */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Pesquisa + Filtros */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por ID, Código, Nome ou Código de Barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Categoria</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Bebidas/Lácteos">Bebidas/Lácteos</option>
                <option value="Padaria">Padaria</option>
                <option value="Limpeza">Limpeza</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Status</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos</option>
                <option value="OK">OK</option>
                <option value="Baixo">Baixo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botão Adicionar Produto */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar produto</span>
        </button>
      </div>

      {/* 2. Tabela de Produtos com ID e Código de Barras visíveis */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Foto</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>ID (Pesquisa)</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Código de Barras (Scanner)</span>
                  </div>
                </th>
                <th className="py-3 px-4">Nome do Artigo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-center">Estoque</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 text-center">
                    <ProductVisual codeOrName={item.name || item.code} size="sm" />
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200/60">
                      {item.id}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-700 font-medium text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {item.barcode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.barcode, item.id)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        title="Copiar código de barras"
                      >
                        {copiedText === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{item.category}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-900">
                    {item.price.toLocaleString('pt-AO')} Kz
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">{item.stock}</td>
                  <td className="py-2.5 px-4 text-center">
                    {item.status === 'OK' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#dcfce7] text-[#15803d]">
                        OK
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                        Baixo
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingProduct(item)}
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1"
                        title="Ver ficha completa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                        title="Eliminar produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum produto encontrado para o critério &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Mostrando X de Y + Paginação */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>Mostrando 1 a {filtered.length} de {allDisplayItems.length} produtos</div>

          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </button>
            <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Produto com ID e Código de Barras Gerados Automaticamente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Adicionar Novo Produto</h3>
                <p className="text-[11px] text-slate-500">
                  O sistema gerou automaticamente o ID para busca e o Código de Barras para leitura no scanner.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Bloco 1: ID Gerado para o Campo de Pesquisa */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-blue-900 font-bold flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span>ID do Produto (Usável na Pesquisa)</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    Gerado Automaticamente
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    className="flex-1 p-2.5 bg-white border border-blue-300 rounded-xl font-mono font-bold text-blue-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Ex: P009"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateId}
                    className="p-2.5 bg-white border border-blue-200 hover:bg-blue-100/50 text-blue-700 rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Regenerar ID sequencial"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Novo ID</span>
                  </button>
                </div>
                <p className="text-[10.5px] text-blue-800/80">
                  O operador pode digitar este ID (ex: <strong>{formId}</strong>) diretamente na barra de pesquisa de vendas para adicionar o item ao carrinho.
                </p>
              </div>

              {/* Bloco 2: Código de Barras Gerado para o Leitor */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-emerald-950 font-bold flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-emerald-600" />
                    <span>Código de Barras EAN-13 (Leitor de Scanner)</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    EAN-13 Válido
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-emerald-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="5601001000096"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateBarcode}
                    className="p-2.5 bg-white border border-emerald-200 hover:bg-emerald-100/50 text-emerald-800 rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Regenerar código de barras"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Gerar</span>
                  </button>
                </div>

                {/* Pré-visualização Vetorial das Barras */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                  <BarcodeVisual barcode={formBarcode} width={180} height={52} />
                  <div className="text-[10.5px] text-emerald-900/80 sm:text-right">
                    Pode usar este código gerado para imprimir etiquetas ou apontar o leitor físico directamente na embalagem do artigo.
                  </div>
                </div>
              </div>

              {/* Bloco 3: Dados Gerais do Produto */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Nome do Artigo / Descrição:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Arroz Tio Lucas 1kg ou Sumo Ceres 1L"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Categoria:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Alimentação">Alimentação (Cesta Básica)</option>
                    <option value="Bebidas">Bebidas & Sumos</option>
                    <option value="Bebidas/Lácteos">Lácteos & Frios</option>
                    <option value="Padaria">Padaria & Pastelaria</option>
                    <option value="Limpeza">Higiene & Limpeza</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Preço de Venda (Kz):
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Estoque Inicial:</label>
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Estoque Mínimo:</label>
                  <input
                    type="number"
                    min={1}
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Guardar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar Produto com ID e Código de Barras em Destaque */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Ficha do Artigo</h3>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <ProductVisual codeOrName={viewingProduct.name || viewingProduct.code} size="lg" />
            </div>

            {/* Código de Barras Vetorial */}
            <div className="flex flex-col items-center justify-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <BarcodeVisual barcode={viewingProduct.barcode} width={190} height={56} />
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                Scanner / Leitor de Caixa
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Nome:</span>
                <span className="font-bold text-slate-900">{viewingProduct.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5 items-center">
                <span className="text-slate-500 font-medium">ID (Pesquisa):</span>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {viewingProduct.id}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5 items-center">
                <span className="text-slate-500 font-medium">Código de Barras:</span>
                <span className="font-mono text-slate-900 font-bold">{viewingProduct.barcode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Categoria:</span>
                <span className="text-slate-900">{viewingProduct.category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Preço de Venda:</span>
                <span className="font-bold text-slate-900">
                  {viewingProduct.price.toLocaleString('pt-AO')} Kz
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Estoque Actual:</span>
                <span className="font-bold text-slate-900">{viewingProduct.stock} unidades</span>
              </div>
            </div>

            <button
              onClick={() => setViewingProduct(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
