import React, { useState } from 'react';
import { FileText, CheckCircle } from 'lucide-react';

interface DocItem {
  id: string;
  name: string;
  title: string;
  summary: string;
  content: string;
}

const DOCS: DocItem[] = [
  {
    id: 'architecture',
    name: 'ARCHITECTURE.md',
    title: 'Arquitectura de Camadas e Desacoplamento',
    summary: 'Separação formal entre Interface, Aplicação, Domínio de Negócio, Núcleo Fiscal e Persistência.',
    content: `# ARCHITECTURE.md — Arquitectura do Sistema

## 1. Visão Geral
O sistema respeita rigorosamente os princípios de Clean Architecture e DDD.
O Núcleo Fiscal (Fiscal Core) é agnóstico em relação à tecnologia de transporte (HTTP, Web, POS, Mobile).

## 2. Camadas
1. INTERFACE: Web React / Terminal POS / Mobile
2. API / APPLICATION: Routers, DTOs, Autenticação JWT, RBAC Guards
3. BUSINESS DOMAIN: Modelos de Empresa, Cliente, Produto
4. FISCAL CORE: TaxEngine, SeriesEngine, InvoiceEngine, HashChainingService, AuditLog
5. DATABASE: PostgreSQL / Cloud SQL com isolamento multiempresa e transacções atómicas.`
  },
  {
    id: 'database',
    name: 'DATABASE.md',
    title: 'Modelo Relacional e Dicionário de Dados',
    summary: 'Estrutura das tabelas, chaves primárias UUID, restrições ON DELETE RESTRICT e controlo de imutabilidade.',
    content: `# DATABASE.md — Modelo de Dados e Estrutura de Tabelas

- companies (Multiempresa com NIF angolano)
- establishments (Sede, Filiais com séries próprias)
- users & roles (ADMIN, GERENTE, CAIXA, VENDEDOR, CONTABILISTA, AUDITOR)
- customers (Nacionais, Estrangeiros, Consumidor Final 999999999)
- tax_categories (Parametrização dinâmica de IVA 14%, 7%, 5%, 0% e Isenções M00-M99)
- products (Bens e Serviços com configuração fiscal)
- document_series (Controlo atómico contra concorrência e duplicação)
- fiscal_documents & fiscal_document_lines (Imutáveis após emissão com hashes encadeados)
- payments (Meios de liquidação em Kwanza)
- audit_logs (Registo imutável de todas as mutações e transacções fiscais)`
  },
  {
    id: 'fiscal',
    name: 'FISCAL.md',
    title: 'Regras de Negócio Fiscais e Enquadramento Angolano',
    summary: 'Decreto Presidencial n.º 292/18, Código do IVA de Angola, retenções 6.5% e encadeamento J-Hash.',
    content: `# FISCAL.md — Regras de Negócio Fiscais

1. Regime Jurídico das Facturas (Decreto Presidencial 292/18)
2. Taxas de IVA: 14% (Geral), 7% (Reduzida/Cabinda), 5% e Isenções M00 a M99
3. Retenção na Fonte de 6.5% para prestação de serviços a sujeitos passivos
4. Formato de numeração: [Tipo] [Série]/[Sequência] (Ex: FT A2026/000001)
5. Encadeamento criptográfico de hashes (SHA-256) garantindo integridade auditável
6. Tipos documentais: FT, FR, RC, NC, ND, FP, GA`
  },
  {
    id: 'agt',
    name: 'AGT.md',
    title: 'Arquitectura de Integração AGT (Fase 2)',
    summary: 'Conector isolado AGTConnector, gestão de chaves RSA e fila de comunicação com tolerância a falhas.',
    content: `# AGT.md — Integração com a Administração Geral Tributária

- AGTConnector desacoplado do InvoiceEngine
- Ambientes isolados: Homologação e Produção
- SignatureService: Assinatura digital RSA/RS256 com chave privada em ambiente seguro
- Fila assíncrona tolerante a falhas com retry idempotente
- Registo auditável de Request ID e respostas da AGT`
  },
  {
    id: 'saft',
    name: 'SAFT.md',
    title: 'Arquitectura do Motor SAF-T(AO) (Fase 3)',
    summary: 'Mapeadores desacoplados, gerador de XML normalizado e validador contra esquemas XSD oficiais.',
    content: `# SAFT.md — Motor SAF-T(AO)

- SAFTHeaderBuilder, SAFTCustomerBuilder, SAFTProductBuilder, SAFTTaxBuilder, SAFTSalesBuilder, SAFTPaymentBuilder
- Geração de XML segundo as directivas oficiais vigentes da AGT
- Validador XSD sintáctico e semântico antes da exportação`
  },
  {
    id: 'security',
    name: 'SECURITY.md',
    title: 'Directrizes de Segurança e Imutabilidade',
    summary: 'Cofre de chaves, JWT, RBAC, protecção contra SQL injection e imutabilidade fiscal estrita.',
    content: `# SECURITY.md — Segurança e Imutabilidade

- Proibição de chaves privadas em código-fonte ou respostas de API
- Imutabilidade absoluta: remoção de UPDATE/DELETE em documentos emitidos
- Isolamento multiempresa obrigatório por company_id
- Auditoria contínua de operações críticas`
  }
];

export const DocumentationView: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('architecture');
  const activeDoc = DOCS.find((d) => d.id === selectedDocId) || DOCS[0];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-stone-200">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-stone-900">Documentação e Especificação Técnica Produzida</h2>
        </div>
        <p className="text-xs text-stone-500 mb-6">
          Ficheiros directivos já criados no repositório de acordo com as directrizes de conformidade fiscal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Docs list */}
          <div className="md:col-span-4 space-y-2">
            {DOCS.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold">{doc.name}</span>
                    <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-emerald-600'}`} />
                  </div>
                  <p className={`text-xs font-medium line-clamp-1 ${isSelected ? 'text-stone-200' : 'text-stone-700'}`}>
                    {doc.title}
                  </p>
                  <p className={`text-[11px] line-clamp-2 mt-1 ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
                    {doc.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Doc Content Viewer */}
          <div className="md:col-span-8 bg-stone-900 text-stone-100 p-5 rounded-lg font-mono text-xs overflow-x-auto border border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <div>
                <span className="text-amber-400 font-bold text-sm">{activeDoc.name}</span>
                <span className="text-stone-400 text-xs ml-3 font-sans">{activeDoc.title}</span>
              </div>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-sans">
                Markdown Oficial
              </span>
            </div>

            <pre className="whitespace-pre-wrap leading-relaxed text-stone-300 font-mono text-[11px]">
              {activeDoc.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
