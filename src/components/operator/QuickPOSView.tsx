import React, { useState, useEffect, useRef } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { InvoiceEngine } from '../../core/fiscal/engines/InvoiceEngine';
import { PaymentEngine } from '../../core/fiscal/engines/PaymentEngine';
import { Product } from '../../core/fiscal/types/product';
import { FiscalDocument } from '../../core/fiscal/types/document';
import { User } from '../../core/fiscal/types/user';
import { ProductVisual } from '../common/ProductVisual';
import { ReceiptPreviewModal } from '../common/ReceiptPreviewModal';
import {
  Search,
  Barcode,
  Trash2,
  Pencil,
  CheckCircle2,
  Plus,
  Minus,
  AlertCircle,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  X,
  Coins,
  Banknote,
  Calculator,
} from 'lucide-react';

interface QuickPOSViewProps {
  currentUser: User;
}

export const QuickPOSView: React.FC<QuickPOSViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  // Referência do input principal de pesquisa e leitura de código de barras para foco automático imediato
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [scanAlert, setScanAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estado do Modal de Seleção de Quantidade
  const [quantityModalProduct, setQuantityModalProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Carrinho inicial pré-carregado
  const [cart, setCart] = useState<
    Array<{
      product: Product;
      quantity: number;
    }>
  >(() => {
    const prodArroz = db.products.get('P001') || {
      id: 'P001',
      code: 'P001',
      barcode: '5601001000001',
      description: 'Arroz',
      standardPrice: 5000,
      unit: 'UN',
      categoryId: 'CAT-BASICA',
      taxConfigurationId: 'TAX-IVA07',
    } as Product;

    const prodAcucar = db.products.get('P002') || {
      id: 'P002',
      code: 'P002',
      barcode: '5601001000002',
      description: 'Açúcar',
      standardPrice: 5000,
      unit: 'UN',
      categoryId: 'CAT-BASICA',
      taxConfigurationId: 'TAX-IVA07',
    } as Product;

    const prodOleo = db.products.get('P003') || {
      id: 'P003',
      code: 'P003',
      barcode: '5601001000003',
      description: 'Óleo',
      standardPrice: 8500,
      unit: 'UN',
      categoryId: 'CAT-BASICA',
      taxConfigurationId: 'TAX-IVA07',
    } as Product;

    return [
      { product: prodArroz, quantity: 2 },
      { product: prodAcucar, quantity: 1 },
      { product: prodOleo, quantity: 1 },
    ];
  });

  const [paymentMethod, setPaymentMethod] = useState<'DINHEIRO' | 'MULTICAIXA' | 'CARTAO' | 'TRANSFERENCIA'>('DINHEIRO');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempDiscount, setTempDiscount] = useState<number>(0);
  const [amountReceivedInput, setAmountReceivedInput] = useState<string>('');

  // Estados fiscais
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastIssuedDoc, setLastIssuedDoc] = useState<FiscalDocument | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // BIP sonoro profissional de leitor de código de barras via Web Audio API
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, audioCtx.currentTime); // 920Hz (Bip clássico de scanner POS)
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Ignorar caso políticas de áudio restrinjam antes do primeiro clique
    }
  };

  // Re-render quando houver mudanças no DB
  useEffect(() => {
    const unsub = db.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, [db]);

  // AUTO-ATIVAR O LEITOR DE CÓDIGO DE BARRAS / PESQUISA AO ABRIR A NOVA VENDA
  useEffect(() => {
    // Foco imediato no campo de pesquisa / leitor de código de barras
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Lista viva de produtos do catálogo da Minha Loja a partir da base de dados fiscal
  const allDbProducts = Array.from(db.products.values());
  const defaultSeeds: Product[] = [
    { id: 'P001', code: 'P001', barcode: '5601001000001', description: 'Arroz', standardPrice: 5000, categoryId: 'CAT-BASICA' } as Product,
    { id: 'P002', code: 'P002', barcode: '5601001000002', description: 'Açúcar', standardPrice: 5000, categoryId: 'CAT-BASICA' } as Product,
    { id: 'P003', code: 'P003', barcode: '5601001000003', description: 'Óleo', standardPrice: 8500, categoryId: 'CAT-BASICA' } as Product,
    { id: 'P007', code: 'P007', barcode: '5601001000007', description: 'Farinha', standardPrice: 4000, categoryId: 'CAT-BASICA' } as Product,
    { id: 'P004', code: 'P004', barcode: '5601001000004', description: 'Leite', standardPrice: 2500, categoryId: 'CAT-LACTICINIOS' } as Product,
    { id: 'P005', code: 'P005', barcode: '5601001000005', description: 'Refrigerante', standardPrice: 3000, categoryId: 'CAT-BEBIDAS' } as Product,
    { id: 'P006', code: 'P006', barcode: '5601001000006', description: 'Pão', standardPrice: 2500, categoryId: 'CAT-PADARIA' } as Product,
    { id: 'P008', code: 'P008', barcode: '5601001000008', description: 'Detergente', standardPrice: 2000, categoryId: 'CAT-HIGIENE' } as Product,
  ];

  const posProducts = allDbProducts.length > 0 ? allDbProducts : defaultSeeds;

  // Adicionar produto ao carrinho com quantidade definida
  const addToCart = (product: Product, qty: number = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is { product: Product; quantity: number } => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setDiscountAmount(0);
      setAmountReceivedInput('');
      searchInputRef.current?.focus();
      setScanAlert({ message: 'Carrinho de compras esvaziado.', type: 'success' });
      setTimeout(() => setScanAlert(null), 3000);
    }
  };

  // ABRIR O SELETOR DE QUANTIDADE ANTES DE ADICIONAR AO CARRINHO
  const openQuantitySelector = (product: Product, defaultQty: number = 1) => {
    setQuantityModalProduct(product);
    setSelectedQuantity(defaultQty);
    // Tocar bip suave indicando identificação do produto
    playScanBeep();
    // Foco e seleção automática do campo de quantidade
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    }, 60);
  };

  // CONFIRMAR ADIÇÃO AO CARRINHO COM A QUANTIDADE ESCOLHIDA
  const confirmAddWithQuantity = () => {
    if (!quantityModalProduct) return;
    const finalQty = Math.max(1, Math.round(Number(selectedQuantity) || 1));

    addToCart(quantityModalProduct, finalQty);

    setScanAlert({
      message: `"${quantityModalProduct.description}" adicionado (${finalQty} un) • Total: ${(
        quantityModalProduct.standardPrice * finalQty
      ).toLocaleString('pt-AO')} Kz`,
      type: 'success',
    });

    setQuantityModalProduct(null);
    setSelectedQuantity(1);
    setSearchQuery('');

    // Re-focar no leitor / campo de pesquisa imediatamente
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);

    setTimeout(() => {
      setScanAlert(null);
    }, 3500);
  };

  // CANCELAR SELEÇÃO DE QUANTIDADE
  const cancelQuantitySelector = () => {
    setQuantityModalProduct(null);
    setSelectedQuantity(1);
    setSearchQuery('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);
  };

  // PROCESSAR LEITURA DE CÓDIGO DE BARRAS OU BUSCA POR CÓDIGO / ID / NOME
  const handleProcessBarcode = (codeToScan: string) => {
    const raw = codeToScan.trim();
    if (!raw) return;

    const allDbProducts = Array.from(db.products.values());
    const candidates = allDbProducts.length > 0 ? allDbProducts : posProducts;
    const target = raw.toLowerCase();

    // 1. Procurar correspondência exata por código de barras, ID ou código
    let matched = candidates.find((p) => {
      const b = (p.barcode || '').trim().toLowerCase();
      const c = (p.code || '').trim().toLowerCase();
      const id = (p.id || '').trim().toLowerCase();
      return b === target || c === target || id === target;
    });

    // 2. Se não encontrou exacto, procurar por nome / descrição (exacto ou parcial)
    if (!matched) {
      matched =
        candidates.find((p) => (p.description || '').toLowerCase() === target) ||
        candidates.find((p) => (p.description || '').toLowerCase().startsWith(target)) ||
        candidates.find((p) => (p.description || '').toLowerCase().includes(target));
    }

    if (matched) {
      // Abre o seletor de quantidade antes de adicionar ao carrinho
      openQuantitySelector(matched, 1);
      setSearchQuery('');
    } else {
      setScanAlert({
        message: `Artigo ou código de barras "${raw}" não encontrado no catálogo.`,
        type: 'error',
      });
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setTimeout(() => {
        setScanAlert(null);
      }, 3500);
    }
  };

  // PROCESSAR PESQUISA / LEITURA VIA FORMULÁRIO DE BUSCA
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleProcessBarcode(searchQuery);
  };

  // Suporte a leitor de código de barras físico em modo HID (Buffer global de teclado)
  useEffect(() => {
    let charBuffer = '';
    let lastKeyTime = Date.now();

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // Se algum modal estiver aberto (quantidade ou desconto), não interceptar teclado
      if (showDiscountModal || quantityModalProduct) return;

      const activeEl = document.activeElement;
      if (activeEl === searchInputRef.current) {
        return;
      }

      const now = Date.now();
      // Leitores físicos enviam caracteres em alta velocidade (< 90ms entre caracteres)
      if (now - lastKeyTime > 90) {
        charBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (charBuffer.length >= 2) {
          e.preventDefault();
          handleProcessBarcode(charBuffer);
          charBuffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        charBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [showDiscountModal, quantityModalProduct, posProducts]);

  // Tecla Escape para fechar modal de quantidade
  useEffect(() => {
    if (!quantityModalProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelQuantitySelector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quantityModalProduct]);

  // Filtragem dos produtos por texto e categoria
  const filteredProducts = posProducts.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      p.description.toLowerCase().includes(q) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      p.code.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));

    const matchCategory =
      selectedCategory === 'TODOS' ||
      (selectedCategory === 'BASICA' && (p.categoryId === 'CAT-BASICA' || p.categoryId === 'Alimentação')) ||
      (selectedCategory === 'BEBIDAS' && (p.categoryId === 'CAT-BEBIDAS' || p.categoryId === 'CAT-LACTICINIOS' || p.categoryId === 'Bebidas' || p.categoryId === 'Bebidas/Lácteos')) ||
      (selectedCategory === 'PADARIA' && (p.categoryId === 'CAT-PADARIA' || p.categoryId === 'Padaria')) ||
      (selectedCategory === 'HIGIENE' && (p.categoryId === 'CAT-HIGIENE' || p.categoryId === 'Limpeza'));

    return matchQuery && matchCategory;
  });

  // Cálculos do Carrinho
  const subtotal = cart.reduce((acc, item) => acc + item.product.standardPrice * item.quantity, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);

  // Cálculo de Troco (Dinheiro vs Eletrónico)
  const isCashPayment = paymentMethod === 'DINHEIRO';
  const numericReceived = parseFloat(amountReceivedInput.replace(/[^\d.]/g, '')) || 0;
  const changeAmount = isCashPayment && numericReceived > total ? numericReceived - total : 0;
  const missingAmount = isCashPayment && numericReceived > 0 && numericReceived < total ? total - numericReceived : 0;

  // Ações de Troco e Notas
  const handleSetExactAmount = () => {
    setAmountReceivedInput(String(total));
  };

  const handleAddBanknote = (value: number) => {
    const current = parseFloat(amountReceivedInput.replace(/[^\d.]/g, '')) || 0;
    const nextVal = current + value;
    setAmountReceivedInput(String(nextVal));
  };

  const handleSetDirectBanknote = (value: number) => {
    setAmountReceivedInput(String(value));
  };

  const handleClearReceivedAmount = () => {
    setAmountReceivedInput('');
  };

  // Finalizar Venda Fiscal (AGT / RSA-2048 / FR)
  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      setScanAlert({ message: 'O carrinho está vazio. Adicione artigos antes de finalizar a venda.', type: 'error' });
      setTimeout(() => setScanAlert(null), 3500);
      return;
    }

    // Se pagar em dinheiro e o valor for insuficiente
    if (isCashPayment && numericReceived > 0 && numericReceived < total) {
      setScanAlert({
        message: `Valor entregue (${numericReceived.toLocaleString('pt-AO')} Kz) insuficiente. Faltam ${missingAmount.toLocaleString('pt-AO')} Kz para o total de ${total.toLocaleString('pt-AO')} Kz.`,
        type: 'error',
      });
      setTimeout(() => setScanAlert(null), 4000);
      return;
    }

    setIsProcessing(true);

    try {
      const company = Array.from(db.companies.values())[0];
      const customer = db.customers.get('CLI-FINAL') || Array.from(db.customers.values())[0];

      // Série Factura/Recibo (FR)
      const seriesList = Array.from(db.series.values()).filter(
        (s) => s.documentTypeCode === 'FR' && s.isActive
      );
      const series = seriesList[0] || Array.from(db.series.values())[0];

      // Motor Fiscal Angolano (Portaria 292/18)
      const newDoc = InvoiceEngine.issueFiscalDocument(
        {
          company,
          establishmentId: currentUser.establishmentId || 'EST-001',
          series,
          customer,
          documentTypeCode: 'FR',
          lines: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            discountPercentage: 0,
          })),
          issuedByUser: currentUser,
          previousDocumentHash: db.getLastHashForSeries(series.id),
        },
        { products: db.products, taxConfigs: db.taxConfigurations }
      );

      // Dados de pagamento e troco
      const finalReceived = isCashPayment ? (numericReceived || total) : total;
      const finalChange = isCashPayment ? changeAmount : 0;
      const methodLabel =
        paymentMethod === 'DINHEIRO'
          ? 'Dinheiro (Kz)'
          : paymentMethod === 'MULTICAIXA'
          ? 'Multicaixa TPA'
          : paymentMethod === 'CARTAO'
          ? 'Cartão'
          : 'Transferência';

      newDoc.amountReceived = finalReceived;
      newDoc.changeAmount = finalChange;
      newDoc.paymentMethodName = methodLabel;
      newDoc.notes = `Pagamento: ${methodLabel} | Entregue: ${finalReceived.toLocaleString('pt-AO')} Kz | Troco: ${finalChange.toLocaleString('pt-AO')} Kz`;

      // Guardar na base de dados
      db.documents.set(newDoc.id, newDoc);

      // Liquidar recibo de caixa
      const mappedMethod =
        paymentMethod === 'DINHEIRO'
          ? 'CASH'
          : paymentMethod === 'MULTICAIXA'
          ? 'MULTICAIXA'
          : paymentMethod === 'CARTAO'
          ? 'MULTICAIXA'
          : 'BANK_TRANSFER';

      const pmt = PaymentEngine.registerPayment(
        {
          companyId: company.id,
          document: newDoc,
          amount: newDoc.netTotal,
          paymentMethod: mappedMethod,
          transactionReference: `POS-${Date.now().toString().slice(-6)}`,
          user: currentUser,
        },
        []
      );
      db.payments.set(pmt.id, pmt);

      setLastIssuedDoc(newDoc);
      setShowReceiptModal(true);
      const changeMsg = finalChange > 0 ? ` • Troco a devolver: ${finalChange.toLocaleString('pt-AO')} Kz` : '';
      setFeedbackSuccess(`Venda ${newDoc.documentNumber} emitida e assinada com sucesso!${changeMsg}`);
      setCart([]);
      setDiscountAmount(0);
      setAmountReceivedInput('');

      // Re-focar no leitor para a próxima venda
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 500);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setScanAlert({ message: `Erro na emissão fiscal: ${errMsg}`, type: 'error' });
      setTimeout(() => setScanAlert(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const company = Array.from(db.companies.values())[0];

  return (
    <div id="vendas-pos-view" className="space-y-4">
      {/* Notificação de sucesso fiscal */}
      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Alerta de Leitura de Código de Barras / Pesquisa */}
      {scanAlert && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all animate-in fade-in duration-200 ${
            scanAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
              : 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            {scanAlert.type === 'success' ? (
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 fill-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{scanAlert.message}</span>
          </div>
          <button
            onClick={() => setScanAlert(null)}
            className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* LAYOUT EM 2 COLUNAS LATERAIS:
          COLUNA ESQUERDA: Leitor Ativo Automático + Pesquisa de Produtos + Catálogo de Produtos
          COLUNA DIREITA (LATERAL): Carrinho de Compras posicionado sempre ao lado */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ========================================================
            COLUNA ESQUERDA (PESQUISA + LEITOR ACTIVO + PRODUTOS)
            ======================================================== */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* BARRA DE PESQUISA POR NOME & LEITOR DE CÓDIGO DE BARRAS ACTIVO & FILTRO DE CATEGORIAS */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  placeholder="Pesquisar produto pelo nome, código, ID (Ex: P001, P009), ou ler código de barras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Buscar
                </button>
              </div>

              {/* Indicador discreto de leitor activo e pronto para ler */}
              <div
                onClick={() => searchInputRef.current?.focus()}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200/80 shrink-0 cursor-pointer select-none"
                title="Leitor de código de barras activo e pronto para ler"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Barcode className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Leitor Activo</span>
              </div>
            </form>

            {/* Categorias Rápidas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Filtrar:
              </span>
              {[
                { id: 'TODOS', label: 'Todos os Artigos' },
                { id: 'BASICA', label: 'Cesta Básica' },
                { id: 'BEBIDAS', label: 'Bebidas & Lácteos' },
                { id: 'PADARIA', label: 'Padaria' },
                { id: 'HIGIENE', label: 'Higiene & Limpeza' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. GRELHA DE PRODUTOS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Catálogo de Produtos</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({filteredProducts.length} itens disponíveis)
                </span>
              </h2>
              <span className="text-[11px] text-slate-400">Clique para selecionar quantidade</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openQuantitySelector(p, 1)}
                  className="bg-white hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center transition-all shadow-2xs hover:shadow-xs group cursor-pointer min-h-[155px] relative text-left"
                >
                  {/* Badge do ID do produto para pesquisa rápida */}
                  <span
                    className="absolute top-2 left-2 text-[9px] font-mono font-bold text-blue-700 bg-blue-50/90 border border-blue-200/80 px-1.5 py-0.5 rounded shadow-2xs"
                    title={`ID do produto (usável no campo de pesquisa): ${p.id}`}
                  >
                    {p.id}
                  </span>

                  {/* Badge de código de barras para leitor */}
                  {p.barcode && (
                    <span
                      className="absolute top-2 right-2 text-[9px] font-mono text-slate-600 bg-slate-100/90 border border-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                      title={`Código de barras para scanner: ${p.barcode}`}
                    >
                      <Barcode className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{p.barcode.slice(-4)}</span>
                    </span>
                  )}

                  <div className="flex-1 flex items-center justify-center my-1.5">
                    <ProductVisual codeOrName={p.description || p.code} size="md" />
                  </div>

                  <div className="w-full pt-1 text-center">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {p.description}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1 font-mono">
                      {p.standardPrice.toLocaleString('pt-AO')} Kz
                    </div>
                  </div>
                </button>
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200 text-xs">
                  Nenhum produto encontrado para a pesquisa &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            COLUNA DIREITA (LATERAL): CARRINHO DE COMPRAS COMPLETO
            Posicionado rigorosamente na lateral e nunca por baixo
            ======================================================== */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] shrink-0 sticky top-4 bg-white rounded-2xl border border-slate-200/90 shadow-md p-5 flex flex-col space-y-4">
          {/* Cabeçalho do Carrinho Lateral */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Carrinho de compras</span>
                <span className="bg-blue-100 text-blue-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}
                </span>
              </h2>
              <span className="text-[11px] text-slate-400">Posto POS #01 • Caixa Balcão</span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                title="Esvaziar carrinho"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Tabela / Lista dos Itens do Carrinho */}
          <div className="overflow-x-auto max-h-[290px] overflow-y-auto pr-1">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="pb-2">Produto</th>
                  <th className="pb-2 text-center w-24">Qtd.</th>
                  <th className="pb-2 text-right">Preço</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 w-7"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                      <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span>O carrinho está vazio.</span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Leia um código com o scanner ou selecione um produto.
                      </p>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-bold text-slate-800">
                        <div>{item.product.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.product.code}</div>
                      </td>

                      {/* Controles de Quantidade (+ / -) */}
                      <td className="py-2.5 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                            title="Diminuir quantidade"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-slate-800 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                            title="Aumentar quantidade"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 text-right font-medium text-slate-600 font-mono text-[11px]">
                        {item.product.standardPrice.toLocaleString('pt-AO')}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900 font-mono text-xs">
                        {(item.product.standardPrice * item.quantity).toLocaleString('pt-AO')}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          title="Remover produto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Linhas de Subtotal, Desconto e Total */}
          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900 font-mono">
                {subtotal.toLocaleString('pt-AO')} Kz
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span>Desconto</span>
                <button
                  type="button"
                  onClick={() => {
                    setTempDiscount(discountAmount);
                    setShowDiscountModal(true);
                  }}
                  className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5 rounded"
                  title="Editar desconto"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </span>
              <span className="font-medium text-slate-900 font-mono">
                {discountAmount > 0 ? `-${discountAmount.toLocaleString('pt-AO')} Kz` : '0 Kz'}
              </span>
            </div>

            {/* Total Destacado */}
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
              <div>
                <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                  Total a Pagar
                </span>
                <span className="text-[10px] text-slate-400 font-medium">IVA incluído</span>
              </div>
              <span className="text-xl font-black text-blue-900 font-mono">
                {total.toLocaleString('pt-AO')} Kz
              </span>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Forma de pagamento</span>
              <span className="text-[10px] text-slate-400">Selecione uma opção</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  paymentMethod === 'DINHEIRO'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === 'DINHEIRO'}
                  onChange={() => setPaymentMethod('DINHEIRO')}
                  className="w-3.5 h-3.5 text-blue-600"
                />
                <span>Dinheiro (Kz)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  paymentMethod === 'MULTICAIXA'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === 'MULTICAIXA'}
                  onChange={() => setPaymentMethod('MULTICAIXA')}
                  className="w-3.5 h-3.5 text-blue-600"
                />
                <span>Multicaixa TPA</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  paymentMethod === 'CARTAO'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === 'CARTAO'}
                  onChange={() => setPaymentMethod('CARTAO')}
                  className="w-3.5 h-3.5 text-blue-600"
                />
                <span>Cartão</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  paymentMethod === 'TRANSFERENCIA'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === 'TRANSFERENCIA'}
                  onChange={() => setPaymentMethod('TRANSFERENCIA')}
                  className="w-3.5 h-3.5 text-blue-600"
                />
                <span>Transferência</span>
              </label>
            </div>
          </div>

          {/* PAINEL DE CÁLCULO DE TROCO (DINHEIRO OU MULTICAIXA) */}
          {paymentMethod === 'DINHEIRO' ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Cálculo de Troco</span>
                </span>
                {amountReceivedInput && (
                  <button
                    type="button"
                    onClick={handleClearReceivedAmount}
                    className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer font-bold"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Campo de Entrada de Valor Entregue */}
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-slate-600 flex justify-between">
                  <span>Valor Entregue pelo Cliente:</span>
                  <span className="font-mono text-slate-400">Moeda: Kwanza (AOA)</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={`Ex: ${total > 0 ? (total + (total % 1000 === 0 ? 1000 : 500)).toLocaleString('pt-AO') : '5.000'}`}
                    value={amountReceivedInput}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^\d]/g, '');
                      setAmountReceivedInput(clean);
                    }}
                    className="w-full pl-3 pr-20 py-2 bg-white border-2 border-blue-400/80 focus:border-blue-600 focus:outline-none rounded-xl text-base font-extrabold font-mono text-slate-900 placeholder:text-slate-300 shadow-2xs transition-all"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSetExactAmount}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[10px] font-black tracking-wide cursor-pointer transition-colors"
                      title="Definir valor exato sem troco"
                    >
                      Exato
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões de Notas Rápidas do Kwanza */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Notas Rápidas em Kwanzas:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetDirectBanknote(500)}
                    className="py-1 px-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[10.5px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs font-mono"
                  >
                    500 Kz
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDirectBanknote(1000)}
                    className="py-1 px-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[10.5px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs font-mono"
                  >
                    1.000 Kz
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDirectBanknote(2000)}
                    className="py-1 px-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[10.5px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs font-mono"
                  >
                    2.000 Kz
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDirectBanknote(5000)}
                    className="py-1 px-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[10.5px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs font-mono"
                  >
                    5.000 Kz
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDirectBanknote(10000)}
                    className="py-1 px-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[10.5px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs font-mono"
                  >
                    10.000 Kz
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDirectBanknote(20000)}
                    className="py-1 px-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[10.5px] font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs font-mono"
                  >
                    20.000 Kz
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBanknote(5000)}
                    className="py-1 px-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[10.5px] font-extrabold text-blue-800 transition-colors cursor-pointer shadow-2xs font-mono"
                    title="Adicionar mais 5.000 Kz ao montante entregue"
                  >
                    +5.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBanknote(10000)}
                    className="py-1 px-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[10.5px] font-extrabold text-blue-800 transition-colors cursor-pointer shadow-2xs font-mono"
                    title="Adicionar mais 10.000 Kz ao montante entregue"
                  >
                    +10.000
                  </button>
                </div>
              </div>

              {/* Apresentação do Troco / Situação */}
              {numericReceived > total ? (
                <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-md space-y-0.5 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5" />
                      Troco a Devolver
                    </span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">
                      Dinheiro
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                      {changeAmount.toLocaleString('pt-AO')} Kz
                    </span>
                    <div className="text-[10.5px] text-emerald-100 font-mono text-right">
                      <div>Entregue: {numericReceived.toLocaleString('pt-AO')} Kz</div>
                      <div>Total: {total.toLocaleString('pt-AO')} Kz</div>
                    </div>
                  </div>
                </div>
              ) : numericReceived === total && numericReceived > 0 ? (
                <div className="p-2.5 bg-blue-50 border border-blue-300 text-blue-900 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-150">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Valor Exato Entregue</span>
                  </span>
                  <span className="font-mono text-blue-800 font-extrabold">Troco: 0 Kz</span>
                </div>
              ) : numericReceived > 0 && numericReceived < total ? (
                <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Valor Insuficiente</span>
                    </span>
                    <span className="font-mono text-rose-600 font-black">
                      Falta: -{missingAmount.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                  <div className="text-[10.5px] text-amber-800 flex justify-between font-mono">
                    <span>Entregue: {numericReceived.toLocaleString('pt-AO')} Kz</span>
                    <span>Total a Cobrar: {total.toLocaleString('pt-AO')} Kz</span>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-white rounded-xl border border-dashed border-slate-300 text-center text-[10.5px] text-slate-500">
                  Insira o valor entregue para calcular automaticamente o troco.
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium">Pagamento Eletrónico (TPA / Transferência):</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">Sem Troco (Valor Exato)</span>
            </div>
          )}

          {/* Botão de Finalizar Venda com Assinatura AGT */}
          <button
            type="button"
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span>A Processar e Assinar Factura/Recibo...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar venda ({total.toLocaleString('pt-AO')} Kz)</span>
              </>
            )}
          </button>

          {/* Certificação Fiscal */}
          <div className="pt-1 text-center">
            <span className="text-[10px] text-slate-400">
              Certificação AGT N.º 412/AGT/2026 • RSA-2048 • QR Code Oficial
            </span>
          </div>
        </aside>
      </div>

      {/* ========================================================
          MODAL DE SELEÇÃO DE QUANTIDADE ANTES DE ADICIONAR AO CARRINHO
          Acionado via código de barras, pesquisa ou catálogo
          ======================================================== */}
      {quantityModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    Selecionar Quantidade
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Defina a quantidade antes de enviar para o carrinho
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cancelQuantitySelector}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Cancelar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações do Produto Selecionado */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="shrink-0">
                <ProductVisual
                  codeOrName={quantityModalProduct.description || quantityModalProduct.code}
                  size="md"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-900 text-sm truncate">
                  {quantityModalProduct.description}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                  <span>Cód: {quantityModalProduct.code}</span>
                  {quantityModalProduct.barcode && (
                    <span className="text-slate-400">• {quantityModalProduct.barcode}</span>
                  )}
                </div>
                <div className="text-xs font-bold text-blue-700 mt-1">
                  Preço Unitário: {quantityModalProduct.standardPrice.toLocaleString('pt-AO')} Kz
                </div>
              </div>
            </div>

            {/* Campo e Controles de Quantidade */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmAddWithQuantity();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                  Quantidade a Adicionar:
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    title="Diminuir ( - )"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="1"
                    max="9999"
                    step="1"
                    required
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmAddWithQuantity();
                      }
                    }}
                    className="w-32 h-14 bg-slate-50 focus:bg-white text-center text-3xl font-black font-mono text-slate-900 border-2 border-slate-200 focus:border-blue-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                  />

                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => q + 1)}
                    className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    title="Aumentar ( + )"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Botões Rápidos de Quantidade (Pills pré-definidas) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Quantidades Rápidas:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[1, 2, 3, 5, 6, 10, 12, 24].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setSelectedQuantity(q);
                        quantityInputRef.current?.focus();
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedQuantity === q
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtotal em tempo real do item */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-blue-900 block">
                    Subtotal do Artigo:
                  </span>
                  <span className="text-[10px] text-blue-700 font-mono">
                    {selectedQuantity} un × {quantityModalProduct.standardPrice.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
                <span className="text-lg font-black text-blue-950 font-mono">
                  {(quantityModalProduct.standardPrice * selectedQuantity).toLocaleString('pt-AO')} Kz
                </span>
              </div>

              {/* Ações do Modal */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelQuantitySelector}
                  className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar (Esc)
                </button>
                <button
                  type="button"
                  onClick={confirmAddWithQuantity}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Adicionar ao Carrinho (Enter)</span>
                </button>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-medium">
                Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[9px]">Enter</kbd> para confirmar ou <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[9px]">Esc</kbd> para cancelar
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Desconto */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-xs w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-sm">Aplicar Desconto na Venda</h3>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Valor do Desconto em Kwanzas (Kz):
              </label>
              <input
                type="number"
                min={0}
                max={subtotal}
                step={100}
                value={tempDiscount}
                onChange={(e) => setTempDiscount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-center text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountAmount(tempDiscount);
                  setShowDiscountModal(false);
                  searchInputRef.current?.focus();
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impressão do Recibo / Fatura */}
      {showReceiptModal && lastIssuedDoc && company && (
        <ReceiptPreviewModal
          document={lastIssuedDoc}
          company={company}
          initialMode="thermal"
          onClose={() => {
            setShowReceiptModal(false);
            searchInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};
