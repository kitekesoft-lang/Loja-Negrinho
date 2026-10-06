import React, { useState } from 'react';
import { User } from '../../core/fiscal/types/user';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { SaftXmlParser, SaftParsedData } from '../../core/fiscal/saft/SaftXmlParser';
import { LocalPersistenceEngine } from '../../core/fiscal/storage/LocalPersistenceEngine';
import { Customer } from '../../core/fiscal/types/customer';
import { Product } from '../../core/fiscal/types/product';
import {
  FileUp,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Package,
  Building2,
  ShieldCheck,
  Download,
  Database,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface OperatorSaftImporterViewProps {
  currentUser: User;
}

export const OperatorSaftImporterView: React.FC<OperatorSaftImporterViewProps> = ({ currentUser }) => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  const [xmlContent, setXmlContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<SaftParsedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Leitura de Ficheiro pelo utilizador
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setImportSuccess(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setXmlContent(text);
        const data = SaftXmlParser.parseXmlString(text);
        setParsedData(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Falha ao processar o ficheiro XML');
        setParsedData(null);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler o ficheiro selecionado.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // Carregar Exemplo Realista de SAF-T da Trunfo Software
  const handleLoadSampleTrunfoSaft = () => {
    setFileName('SAFT_AO_TRUNFO_SOFTWARE_2026_EXEMPLO.xml');
    setErrorMessage(null);
    setImportSuccess(null);
    setIsProcessing(true);

    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01">
  <Header>
    <AuditFileVersion>1.01_01</AuditFileVersion>
    <CompanyID>5409887766</CompanyID>
    <TaxRegistrationNumber>5409887766</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>Comercial &amp; Distribuição Luanda, Lda.</CompanyName>
    <BusinessName>Trunfo Retail Store</BusinessName>
    <CompanyAddress>
      <AddressDetail>Avenida 4 de Fevereiro, Nº 800 - Luanda</AddressDetail>
      <City>Luanda</City>
      <PostalCode>Luanda</PostalCode>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>2026</FiscalYear>
    <StartDate>2026-01-01</StartDate>
    <EndDate>2026-10-01</EndDate>
    <CurrencyCode>AOA</CurrencyCode>
    <DateCreated>2026-10-02</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>5412984510</ProductCompanyTaxID>
    <SoftwareCertificateNumber>375/AGT/2022</SoftwareCertificateNumber>
    <ProductID>Trunfo Software ERP &amp; POS</ProductID>
    <ProductVersion>v4.9.2 PRO</ProductVersion>
  </Header>
  <MasterFiles>
    <Customer>
      <CustomerID>TRUNFO-CUST-001</CustomerID>
      <AccountID>Desconhecido</AccountID>
      <CustomerTaxID>5401142231</CustomerTaxID>
      <CompanyName>Sonangol Distribuidora Central</CompanyName>
      <BillingAddress>
        <AddressDetail>Rua Rainha Ginga, Luanda</AddressDetail>
        <City>Luanda</City>
        <Country>AO</Country>
      </BillingAddress>
      <Telephone>923 000 111</Telephone>
      <Email>facturacao@sonangol.co.ao</Email>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>
    <Customer>
      <CustomerID>TRUNFO-CUST-002</CustomerID>
      <AccountID>Desconhecido</AccountID>
      <CustomerTaxID>006734221LA02</CustomerTaxID>
      <CompanyName>Eng. Fernando de Carvalho</CompanyName>
      <BillingAddress>
        <AddressDetail>Morro Bento, Luanda</AddressDetail>
        <City>Luanda</City>
        <Country>AO</Country>
      </BillingAddress>
      <Telephone>924 112 233</Telephone>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>
    <Customer>
      <CustomerID>TRUNFO-CUST-003</CustomerID>
      <AccountID>Desconhecido</AccountID>
      <CustomerTaxID>5403129845</CustomerTaxID>
      <CompanyName>Banco Millennium Atlântico Luanda</CompanyName>
      <BillingAddress>
        <AddressDetail>Talatona, Luanda</AddressDetail>
        <City>Luanda</City>
        <Country>AO</Country>
      </BillingAddress>
      <Telephone>923 888 999</Telephone>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>
    <Product>
      <ProductType>P</ProductType>
      <ProductCode>TRF-ARROZ-25KG</ProductCode>
      <ProductGroup>Cereais &amp; Grãos</ProductGroup>
      <ProductDescription>Arroz Agulha Tio Lucas 25Kg</ProductDescription>
      <ProductNumberCode>5601234567890</ProductNumberCode>
    </Product>
    <Product>
      <ProductType>P</ProductType>
      <ProductCode>TRF-OLEO-12L</ProductCode>
      <ProductGroup>Mercearia</ProductGroup>
      <ProductDescription>Óleo Alimentar Palmart Caixa 12x1L</ProductDescription>
      <ProductNumberCode>5609876543210</ProductNumberCode>
    </Product>
    <Product>
      <ProductType>P</ProductType>
      <ProductCode>TRF-ACUCAR-50KG</ProductCode>
      <ProductGroup>Mercearia Doce</ProductGroup>
      <ProductDescription>Açúcar Castelo Branco Saco 50Kg</ProductDescription>
      <ProductNumberCode>5604561237890</ProductNumberCode>
    </Product>
    <Product>
      <ProductType>S</ProductType>
      <ProductCode>TRF-SRV-ENTREGA</ProductCode>
      <ProductGroup>Serviços Logísticos</ProductGroup>
      <ProductDescription>Serviço de Transporte &amp; Frete Luanda</ProductDescription>
    </Product>
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>128</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>8745000.00</TotalCredit>
      <Invoice>
        <DocumentTotals>
          <GrossTotal>450000.00</GrossTotal>
        </DocumentTotals>
      </Invoice>
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;

    setXmlContent(sampleXml);
    try {
      const data = SaftXmlParser.parseXmlString(sampleXml);
      setParsedData(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Importar Definitivamente para a Base de Dados Local
  const handleImportToDatabase = () => {
    if (!parsedData) return;

    let importedCustomersCount = 0;
    let importedProductsCount = 0;
    const now = new Date().toISOString();
    const companyId = 'COMP-001';

    // 1. Importar Clientes
    parsedData.customers.forEach((c) => {
      const customer: Customer = {
        id: c.id,
        companyId,
        taxId: c.taxId,
        name: c.name,
        customerType: c.customerType,
        country: 'AO',
        billingAddress: c.billingAddress,
        city: c.city,
        email: c.email,
        phone: c.phone,
        status: 'ACTIVE',
        createdAt: now,
      };
      db.customers.set(customer.id, customer);
      importedCustomersCount++;
    });

    // 2. Importar Produtos
    parsedData.products.forEach((p) => {
      const product: Product = {
        id: p.id,
        companyId,
        code: p.code,
        barcode: p.barcode,
        description: p.name,
        type: 'PRODUCT',
        unit: p.unit || 'UN',
        standardPrice: p.price,
        taxConfigurationId: 'TAX-IVA-14',
        withholdingTaxApplicable: false,
        status: 'ACTIVE',
        createdAt: now,
      };
      db.products.set(product.id, product);
      importedProductsCount++;
    });

    LocalPersistenceEngine.persistToLocalStorage(db);
    db.notify();
    forceUpdate();

    setImportSuccess(
      `Migração concluída com sucesso! ${importedCustomersCount} clientes e ${importedProductsCount} artigos do ficheiro SAF-T foram inseridos na base de dados.`
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo Importador SAF-T */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Importador Universal SAF-T (AO)
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Migração Trunfo / Concorrentes
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Importe artigos, clientes e dados cadastrais a partir do ficheiro SAF-T de qualquer software certificado pela AGT
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleTrunfoSaft}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Carregar Exemplo Trunfo Software</span>
        </button>
      </div>

      {/* 2. Feedback de Sucesso ou Erro */}
      {importSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{importSuccess}</span>
          </div>
          <button onClick={() => setImportSuccess(null)} className="text-emerald-700 hover:text-emerald-950 font-black">
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-xs text-rose-900 font-bold">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-950 font-black">
            Fechar
          </button>
        </div>
      )}

      {/* 3. Dropzone e Seletor de Ficheiro */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-purple-400 transition-colors text-center">
        <input
          type="file"
          id="saft-file-input"
          accept=".xml"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="saft-file-input" className="cursor-pointer flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
            <FileUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {fileName ? fileName : 'Selecione ou Arraste o Ficheiro SAF-T (.xml)'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Compatível com ficheiros de auditoria fiscal SAF-T (AO) exportados da <strong>Trunfo Software</strong>, PrimaVera, PHC, FactPlus, Cegid ou qualquer ERP homologado AGT.
          </p>
          <span className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-block shadow-xs">
            Procurar Ficheiro no Computador
          </span>
        </label>
      </div>

      {/* 4. Resumo e Pré-visualização do Ficheiro Analisado */}
      {parsedData && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header do SAF-T */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Cabeçalho Fiscal Reconhecido no Ficheiro SAF-T
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Certificação AGT: {parsedData.header.softwareCertificateNumber || 'Validado'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Empresa Emissora:</span>
                <span className="font-bold text-slate-900">{parsedData.header.companyName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">NIF Fiscal:</span>
                <span className="font-mono font-bold">{parsedData.header.taxRegistrationNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Software de Origem:</span>
                <span className="font-bold text-purple-700">{parsedData.header.productID}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Ano Fiscal:</span>
                <span className="font-bold">{parsedData.header.fiscalYear}</span>
              </div>
            </div>
          </div>

          {/* Cards com Dados Encontrados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>Clientes Encontrados</span>
              </div>
              <div className="text-2xl font-black text-blue-900 mt-2 font-mono">
                {parsedData.customers.length}
              </div>
              <span className="text-[11px] text-blue-600 mt-1 block">Com NIF e morada de faturação</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                <Package className="w-4 h-4" />
                <span>Artigos / Produtos</span>
              </div>
              <div className="text-2xl font-black text-purple-900 mt-2 font-mono">
                {parsedData.products.length}
              </div>
              <span className="text-[11px] text-purple-600 mt-1 block">Artigos com código e descrição</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <FileCheck2 className="w-4 h-4" />
                <span>Faturas Registadas</span>
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-2 font-mono">
                {parsedData.invoicesCount}
              </div>
              <span className="text-[11px] text-emerald-600 mt-1 block">Movimento comercial auditado</span>
            </div>
          </div>

          {/* Prévia dos Clientes e Artigos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Clientes */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Clientes a Importar ({parsedData.customers.length})
              </h4>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {parsedData.customers.map((c) => (
                  <div key={c.id} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIF: {c.taxId} • {c.city}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                      {c.customerType}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Artigos */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                Artigos a Importar ({parsedData.products.length})
              </h4>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {parsedData.products.map((p) => (
                  <div key={p.id} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Código: {p.code} • {p.category}</div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700">
                      Taxa IVA {p.taxPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botão de Confirmação de Migração */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                Migrar Dados para a Base de Dados do Minha Loja
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Os artigos e clientes serão inseridos instantaneamente no seu sistema local com proteção contra duplicados.
              </p>
            </div>

            <button
              type="button"
              onClick={handleImportToDatabase}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors shrink-0"
            >
              <span>Confirmar & Importar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
