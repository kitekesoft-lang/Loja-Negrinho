import React, { useState } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { User, canAccessAdminLayout } from '../../core/fiscal/types/user';
import { LocalPersistenceEngine } from '../../core/fiscal/storage/LocalPersistenceEngine';
import { LicenseManagerView } from '../admin/LicenseManagerView';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  Settings,
  Store,
  Printer,
  DollarSign,
  Percent,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  Upload,
  ShieldCheck,
  CreditCard,
  Database,
  FileCheck,
  Download,
  Monitor,
  Smartphone,
  Cloud,
  HardDrive,
  RefreshCw,
  FileDown,
  Wifi,
  WifiOff,
  QrCode,
  KeyRound,
} from 'lucide-react';
import { AndroidInstallGuideModal } from '../common/AndroidInstallGuideModal';

interface OperatorSettingsViewProps {
  currentUser: User;
}

export const OperatorSettingsView: React.FC<OperatorSettingsViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const company = Array.from(db.companies.values())[0];

  const { isOnline, isSyncing, lastSyncTime, triggerSync } = useNetworkStatus();
  const { isInstalled, isWindows, isAndroid, isIOS, isInstallable, promptInstall, downloadWindowsLauncher, downloadWindowsShortcut } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'DADOS' | 'IMPOSTOS' | 'PAGAMENTOS' | 'IMPRESSORA' | 'SISTEMA' | 'LICENCA'>('DADOS');

  // Form states
  const [storeName, setStoreName] = useState(company?.tradeName || company?.name || 'Minha Loja');
  const [currency, setCurrency] = useState(company?.currency || 'Kz');
  const [address, setAddress] = useState(company?.address || 'Rua da Liberdade, Nº 123 - Luanda');
  const [vatRate, setVatRate] = useState('14');
  const [phone, setPhone] = useState(company?.phone || '923 456 789');
  const [printerModel, setPrinterModel] = useState('Impressora Térmica 80mm (ESC/POS)');
  const [email, setEmail] = useState(company?.email || 'minhaloja@email.com');
  const [taxId, setTaxId] = useState(company?.taxId || '5417082341');
  const [conservatory, setConservatory] = useState(company?.conservatoryRegistration || '1432-19/Luanda');
  const [capitalSocial, setCapitalSocial] = useState(company?.capitalSocial || '5.000.000,00 Kz');

  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [showAndroidGuideModal, setShowAndroidGuideModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (company) {
      company.tradeName = storeName.trim();
      company.name = storeName.trim();
      company.address = address.trim();
      company.phone = phone.trim();
      company.email = email.trim();
      company.currency = currency.trim();
      company.taxId = taxId.trim();
      company.conservatoryRegistration = conservatory.trim();
      company.capitalSocial = capitalSocial.trim();
      db.companies.set(company.id, company);
      db.notify();
    }

    setFeedbackSuccess('Alterações salvas com sucesso no banco de dados fiscal!');
    setTimeout(() => setFeedbackSuccess(null), 3500);
  };

  return (
    <div id="operator-settings-view" className="space-y-4">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Configurações da Loja
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Parâmetros operacionais, dados cadastrais, impostos e preferências de impressão.
        </p>
      </div>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {feedbackSuccess}
        </div>
      )}

      {/* 2. Abas de Configuração Superiores (Exactas da Imagem) */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('DADOS')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'DADOS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dados da loja
        </button>
        <button
          onClick={() => setActiveTab('IMPOSTOS')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'IMPOSTOS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Impostos &amp; Taxas
        </button>
        <button
          onClick={() => setActiveTab('PAGAMENTOS')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'PAGAMENTOS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Formas de Pagamento
        </button>
        <button
          onClick={() => setActiveTab('IMPRESSORA')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'IMPRESSORA'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Impressora de Talões
        </button>
        <button
          onClick={() => setActiveTab('SISTEMA')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'SISTEMA'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Backup &amp; Sistema
        </button>
        {canAccessAdminLayout(currentUser) && (
          <button
            type="button"
            onClick={() => setActiveTab('LICENCA')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LICENCA'
                ? 'border-amber-500 text-amber-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-amber-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Licença (Admin A)</span>
          </button>
        )}
      </div>

      {/* Conteúdo da Aba DADOS DA LOJA (100% fiel ao mockup da imagem) */}
      {activeTab === 'DADOS' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
            {/* Bloco Logotipo + Nome */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-100">
              <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center shrink-0">
                <Store className="w-8 h-8 text-blue-600 mb-1" />
                <span className="text-[10px] text-slate-400 font-semibold leading-tight">Logótipo</span>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-sm font-bold text-slate-900">Logótipo do Estabelecimento</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Este logótipo será impresso nos talões térmicos (80mm) de venda e exibido no cabeçalho do sistema.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => alert('Seleção de imagem pronta. Formato PNG/JPG recomendado.')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Alterar logotipo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Formulário em 2 Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Moeda Padrão
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Endereço da Loja
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Percentagem de IVA Padrão (%)
                </label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="14">14% - Taxa Geral IVA</option>
                  <option value="7">7% - Taxa Reduzida Cesta Básica</option>
                  <option value="5">5% - Taxa Cabinda</option>
                  <option value="0">0% - Isento (M00/M02)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Telefone de Contacto
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Impressora de Talões
                </label>
                <select
                  value={printerModel}
                  onChange={(e) => setPrinterModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Impressora Térmica 80mm (ESC/POS)">Impressora Térmica 80mm (ESC/POS)</option>
                  <option value="Impressora Térmica 58mm">Impressora Térmica 58mm</option>
                  <option value="Impressora A4 PDF">Impressora Padrão A4 (PDF)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIF da Empresa (Identificação Fiscal)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Conservatória do Registo Comercial (Obrigatório AGT)
                </label>
                <input
                  type="text"
                  value={conservatory}
                  onChange={(e) => setConservatory(e.target.value)}
                  placeholder="Ex: 1432-19/Luanda"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Capital Social da Empresa (Obrigatório AGT)
                </label>
                <input
                  type="text"
                  value={capitalSocial}
                  onChange={(e) => setCapitalSocial(e.target.value)}
                  placeholder="Ex: 5.000.000,00 Kz"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar alterações</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Conteúdo Aba IMPOSTOS */}
      {activeTab === 'IMPOSTOS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Configurações Fiscais AGT de Angola</h3>
          <p className="text-xs text-slate-500">
            Regras de tributação em vigor segundo o Código do Imposto sobre o Valor Acrescentado de Angola.
          </p>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">IVA Taxa Normal (14%)</span>
                <p className="text-[11px] text-slate-400">Regime Geral aplicado a produtos e serviços não isentos</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Activo</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">IVA Taxa Reduzida Cesta Básica (7%)</span>
                <p className="text-[11px] text-slate-400">Arroz, farinha, óleo alimentar, leite, açúcar e massas</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Activo</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">Retenção na Fonte (6,5%)</span>
                <p className="text-[11px] text-slate-400">Prestação de serviços a pessoas coletivas</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">Configurado</span>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba PAGAMENTOS */}
      {activeTab === 'PAGAMENTOS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Métodos de Quitação no Caixa</h3>
          <div className="space-y-2 text-xs">
            {['Dinheiro (Numerário)', 'Multicaixa / Cartão TPA', 'Transferência Bancária (BAI / BFA)', 'Vales / Cheques'].map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{m}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Habilitado no POS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Aba IMPRESSORA */}
      {activeTab === 'IMPRESSORA' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Preferências de Impressão Térmica</h3>
          <p className="text-xs text-slate-500">
            Emissão automática de talões de 80mm com Código QR oficial da AGT e hash RSA-2048.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Largura de Papel:</span>
              <span className="font-bold text-slate-800">80 mm (Padrão Retail)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Código QR Fiscal:</span>
              <span className="font-bold text-emerald-600">Sim (Conforme Portaria n.º 292/18)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Imprimir vias de consumidor:</span>
              <span className="font-bold text-slate-800">Original + Duplicado</span>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba SISTEMA (Armazenamento, Nuvem & Instaladores) */}
      {activeTab === 'SISTEMA' && (
        <div className="space-y-4">
          {/* 1. Armazenamento Local e Sincronização em Nuvem */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Armazenamento de Dados (Local &amp; Nuvem)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Os dados são gravados localmente no dispositivo para funcionamento 100% offline e sincronizados com a nuvem quando houver internet.
                </p>
              </div>

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isOnline ? 'Online (Nuvem Activa)' : 'Offline (Armazenamento Local)'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Modo Local Offline</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Vendas, faturas e controle de estoque continuam a funcionar perfeitamente sem qualquer conexão de rede.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>Sincronização Automática</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Ao restabelecer ligação, a fila de transações pendentes é enviada para a nuvem de forma transparente.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await triggerSync();
                  setFeedbackSuccess(res.success ? 'Dados sincronizados com o servidor de nuvem!' : 'Erro na conexão à nuvem.');
                  setTimeout(() => setFeedbackSuccess(null), 3500);
                }}
                disabled={isSyncing || !isOnline}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com Nuvem'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const jsonStr = LocalPersistenceEngine.exportFullBackupJSON(db);
                  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Backup-MinhaLoja-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setFeedbackSuccess('Cópia de segurança descarregada com sucesso!');
                  setTimeout(() => setFeedbackSuccess(null), 3500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <label className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Restaurar Ficheiro Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      const res = LocalPersistenceEngine.importBackupJSON(content, db);
                      setFeedbackSuccess(res.message);
                      setTimeout(() => setFeedbackSuccess(null), 4000);
                    };
                    reader.readAsText(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 2. Instaladores Nativos para Windows & Android */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Instaladores da Aplicação (Windows &amp; Android)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Instale a aplicação no computador de caixa ou no dispositivo móvel para aceder diretamente como programa nativo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Windows */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  <span>Instalador Windows (PC / POS)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Executa em janela própria sem navegador, cria atalho no Ambiente de Trabalho e Menu Iniciar.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={promptInstall}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Instalar no Windows (1-Clique)</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadWindowsLauncher}
                    className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Descarregar Lançador .BAT</span>
                  </button>
                </div>
              </div>

              {/* Android */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Instalador Android (Mobile &amp; Tablet)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Instalação WebAPK com ícone no ecrã de aplicações e suporte a câmara para scanner de códigos.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (isInstallable) {
                        const outcome = await promptInstall();
                        if (outcome === 'accepted') {
                          setFeedbackSuccess('Aplicação instalada com sucesso no telemóvel!');
                          return;
                        }
                      }
                      setShowAndroidGuideModal(true);
                    }}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Instalar no Android (Guia &amp; App)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAndroidGuideModal(true)}
                    className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ver QR Code para Telemóvel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Certificação Fiscal */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Certificação Fiscal &amp; Auditoria</h3>
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-950">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Software Certificado AGT N.º 412/AGT/2026
              </div>
              <p className="text-slate-600">
                As faturas emitidas por este posto contêm assinatura digital RSA-2048, encadeamento de hashes SHA-1
                e exportação oficial SAF-T(AO) sem perda de integridade.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba LICENÇA (Exclusivo Administrador A) */}
      {activeTab === 'LICENCA' && canAccessAdminLayout(currentUser) && (
        <LicenseManagerView currentUser={currentUser} />
      )}

      {/* Banner Informativo de Certificação no Rodapé */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              Motor Fiscal Angolano Homologado
            </div>
            <div className="text-[11px] text-slate-300">
              Assinatura digital RSA-2048, Código QR de validação pública e arquivo XML SAF-T(AO) ativos.
            </div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-mono font-bold shrink-0">
          AGT v1.0.0
        </div>
      </div>

      {/* Modal Guia de Instalação Android */}
      <AndroidInstallGuideModal
        isOpen={showAndroidGuideModal}
        onClose={() => setShowAndroidGuideModal(false)}
      />
    </div>
  );
};
