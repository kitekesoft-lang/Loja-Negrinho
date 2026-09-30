import { RoadmapPhase, ArchitectureLayer, EntityDefinition, TaxRateOption, TechnicalRisk } from '../types';

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'phase0',
    number: 0,
    title: 'Etapa 0 — Planeamento & Especificação',
    subtitle: 'Arquitectura, stack, modelo de dados e estratégias de segurança',
    status: 'completed',
    badge: 'Concluído',
    description: 'Definição da fundação técnica, separação em camadas limpas, especificação dos modelos relacionais, directivas fiscais angolanas e identificação de riscos.',
    keyDeliverables: [
      'Arquitectura desacoplada (Clean Architecture)',
      'Selecção e justificação tecnológica',
      'Estrutura modular e dicionário de dados relacional',
      'Estratégia de concorrência e integridade sequencial (sem saltos)',
      'Estratégia de auditoria contínua e imutabilidade',
      'Planeamento do conector AGT e gerador SAF-T(AO)',
      'Documentos ARCHITECTURE.md, DATABASE.md, FISCAL.md, etc.'
    ],
    prerequisites: 'Nenhum. Ponto de partida obrigatório.'
  },
  {
    id: 'phase1',
    number: 1,
    title: 'Fase 1 — Núcleo Fiscal (Fiscal Core)',
    subtitle: 'Emissão e gestão de documentos fiscalmente relevantes',
    status: 'completed',
    badge: 'Concluído',
    description: 'Construção do motor fiscal independente de interface: TaxEngine parametrizável, DocumentSeriesEngine atómico, InvoiceEngine imutável com J-Hash SHA-256 e auditoria estrita.',
    keyDeliverables: [
      'Empresas & Estabelecimentos (Multi-tenant)',
      'Utilizadores, perfis e controlo de permissões (RBAC)',
      'Clientes com validação de NIF angolano',
      'Catálogo de produtos/serviços e TaxEngine configurável',
      'DocumentSeriesEngine (séries, numeração atómica sem duplicação)',
      'Documentos: Factura (FT), Factura/Recibo (FR), Recibo (RC), Nota de Crédito (NC), Nota de Débito (ND)',
      'Encadeamento de Hashes SHA-256 e código de controlo de 4 caracteres',
      'Liquidação/Pagamentos e Trilha de Auditoria (AuditLog)',
      'Demonstração completa de ponta a ponta com testes automatizados'
    ],
    prerequisites: 'Aprovação explícita da Etapa 0.'
  },
  {
    id: 'phase2',
    number: 2,
    title: 'Fase 2 — Integração AGT',
    subtitle: 'Facturação electrónica e comunicação com a AGT',
    status: 'completed',
    badge: 'Implementado',
    description: 'Comunicação oficial com os Web Services da AGT: AGTConnector dedicado, gestão de chaves RSA em ambiente seguro, assinatura digital conforme directivas e fila com tolerância a falhas.',
    keyDeliverables: [
      'AGTConnector desacoplado do InvoiceEngine',
      'Ambientes isolados: Homologação e Produção',
      'SignatureService isolado (criptografia RSA/RS256)',
      'Fila de comunicação assíncrona com idempotência e backoff exponencial',
      'Gestão de códigos de resposta, registo de RequestID e persistência de comprovativos',
      'Testes de contingência: timeout, indisponibilidade e duplicação'
    ],
    prerequisites: 'Fase 1 funcional, testada e documentada.'
  },
  {
    id: 'phase3',
    number: 3,
    title: 'Fase 3 — SAF-T(AO)',
    subtitle: 'Motor de extracção e validação do ficheiro de auditoria fiscal',
    status: 'completed',
    badge: 'Implementado',
    description: 'Motor SAF-T independente com builders dedicados para cada secção, gerador de XML normalizado segundo o XSD oficial da AGT e validador de conformidade semântica.',
    keyDeliverables: [
      'SAFTService com builders desacoplados (Header, Customers, Products, Taxes, Sales, Payments)',
      'Geração de XML em estrita conformidade com a portaria vigente da AGT (Portaria n.º 292/18)',
      'Motor de validação XSD com relatório de incongruências estruturais e aritméticas',
      'Suporte a documentos rectificados, anulados, notas de crédito e retenções na fonte',
      'Geração reproduzível, determinística e auditável de ficheiros SAF-T de facturação com download'
    ],
    prerequisites: 'Fase 2 homologada e validada.'
  },
  {
    id: 'phase4',
    number: 4,
    title: 'Fase 4 — ERP Completo',
    subtitle: 'Expansão empresarial integrada ao Núcleo Fiscal',
    status: 'completed',
    badge: 'Concluído',
    description: 'Expansão para compras, controlo de armazéns e stock permanente, gestão de caixas e bancos, contabilidade geral (PGC Angolano) e relatórios executivos.',
    keyDeliverables: [
      'Módulo de Compras e Fornecedores',
      'Gestão de Armazéns, Stocks e Inventário Permanente',
      'Circuito comercial alargado (Orçamentos, Encomendas, Guias de Transporte)',
      'Gestão de Tesouraria (Caixa diário, Abertura/Fecho, Bancos e Reconciliação)',
      'Contabilidade Geral (Plano Geral de Contabilidade de Angola e Diários)',
      'SAF-T de Inventário e SAF-T de Contabilidade'
    ],
    prerequisites: 'Fase 3 validada perante o validador oficial.'
  }
];

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    name: 'Interface de Usuário',
    badge: 'Apresentação',
    description: 'Camada responsável pela experiência de utilizador. Totalmente desacoplada do núcleo de negócio.',
    components: ['Web SPA React + Tailwind', 'Terminal POS (Futuro)', 'App Mobile Android (Futuro)', 'Integrações Externas'],
    responsibilities: [
      'Captura de interacções e formulários com validação preventiva no cliente',
      'Apresentação de estados fiscais e alertas visuais de conformidade',
      'Comunicação exclusiva via API REST tipada com tokens JWT'
    ]
  },
  {
    name: 'API / Application Service',
    badge: 'Aplicação',
    description: 'Orquestração de fluxos de negócio, conversão de DTOs, autenticação e autorização.',
    components: ['Express Router', 'Auth Middleware (JWT)', 'RBAC Guard', 'Request DTO Validators (Zod)'],
    responsibilities: [
      'Tradução de requisições HTTP para comandos de aplicação',
      'Garantia de contexto multiempresa (company_id contextualizado)',
      'Coordenação de transacções e controlo de excepções'
    ]
  },
  {
    name: 'Business Domain',
    badge: 'Domínio',
    description: 'Entidades centrais de negócio independentes de infraestrutura ou base de dados.',
    components: ['Empresas & Estabelecimentos', 'Clientes & Fornecedores', 'Catálogo de Produtos & Serviços', 'Tabelas Mestras'],
    responsibilities: [
      'Validação de NIF de Angola (algoritmo módulo 11)',
      'Manutenção das regras de cadastro comercial',
      'Garantia de consistência das entidades'
    ]
  },
  {
    name: 'Fiscal Core (Núcleo Fiscal)',
    badge: 'Coração Fiscal',
    description: 'Módulo inviolável responsável pela conformidade tributária angolana.',
    components: ['TaxEngine', 'DocumentSeriesEngine', 'InvoiceEngine', 'HashChainingService', 'AuditLogService'],
    responsibilities: [
      'Cálculo de IVA (14%, 7%, 5%, 0%), isenções e retenções na fonte (6.5%)',
      'Numeração atómica estrita sem duplicações e sem furos por série',
      'Geração de hashes HMAC/SHA encadeados e chaves de controlo',
      'Bloqueio irrestrito contra alteração ou eliminação de documentos emitidos',
      'Registo imutável de todas as acções no log de auditoria'
    ]
  },
  {
    name: 'Database & Persistência',
    badge: 'Infraestrutura',
    description: 'Armazenamento transaccional ACID com integridade referencial forte.',
    components: ['PostgreSQL / Cloud SQL', 'Migrations Versionadas', 'Connection Pool com Transacções Serializable'],
    responsibilities: [
      'Isolamento estrito entre empresas (Multi-tenant)',
      'Bloqueio em nível de linha (SELECT ... FOR UPDATE) para séries',
      'Restrições FOREIGN KEY ... ON DELETE RESTRICT para dados fiscais'
    ]
  }
];

export const INITIAL_ENTITIES: EntityDefinition[] = [
  {
    name: 'Company (Empresa)',
    category: 'Organizacional',
    description: 'Entidade jurídica contribuinte registada perante a AGT.',
    primaryKey: 'id (UUID)',
    attributes: [
      { name: 'tax_id', type: 'VARCHAR(15)', constraints: 'UNIQUE, NOT NULL', description: 'NIF angolano validado' },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Razão social oficial' },
      { name: 'trade_name', type: 'VARCHAR(255)', description: 'Nome comercial' },
      { name: 'address', type: 'TEXT', constraints: 'NOT NULL', description: 'Morada fiscal completa' },
      { name: 'city', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Município / Cidade' },
      { name: 'province', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Província (ex: Luanda)' },
      { name: 'tax_regime', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Regime Geral / Simplificado / Exclusão' },
      { name: 'currency', type: 'VARCHAR(3)', constraints: 'DEFAULT "AOA"', description: 'Moeda padrão Kwanza' },
      { name: 'status', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'ACTIVE / INACTIVE' }
    ],
    relationships: [
      { target: 'Establishment', type: '1:N', description: 'Possui 1 ou mais estabelecimentos' },
      { target: 'DocumentSeries', type: '1:N', description: 'Define séries documentais' },
      { target: 'FiscalDocument', type: '1:N', description: 'Emite documentos fiscais' }
    ]
  },
  {
    name: 'Establishment (Estabelecimento)',
    category: 'Organizacional',
    description: 'Lojas, filiais ou sede operacional de uma empresa.',
    primaryKey: 'id (UUID)',
    attributes: [
      { name: 'company_id', type: 'UUID', constraints: 'FK -> Company, NOT NULL', description: 'Empresa mãe' },
      { name: 'code', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'Código único interno (ex: SEDE, LJ01)' },
      { name: 'name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Designação do estabelecimento' },
      { name: 'address', type: 'TEXT', constraints: 'NOT NULL', description: 'Morada física da instalação' },
      { name: 'status', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'ACTIVE / INACTIVE' }
    ],
    relationships: [
      { target: 'Company', type: 'N:1', description: 'Pertence a uma empresa' },
      { target: 'DocumentSeries', type: '1:N', description: 'Pode possuir séries próprias' }
    ]
  },
  {
    name: 'Customer (Cliente)',
    category: 'Catálogo',
    description: 'Adquirente nacional ou internacional com enquadramento fiscal.',
    primaryKey: 'id (UUID)',
    attributes: [
      { name: 'company_id', type: 'UUID', constraints: 'FK -> Company, NOT NULL', description: 'Empresa titular' },
      { name: 'tax_id', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'NIF ou 999999999 (Consumidor Final)' },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Nome ou razão social' },
      { name: 'customer_type', type: 'VARCHAR(30)', constraints: 'NOT NULL', description: 'EMPRESA_NACIONAL, PARTICULAR, ESTRANGEIRO' },
      { name: 'country', type: 'VARCHAR(2)', constraints: 'DEFAULT "AO"', description: 'Código do país ISO 3166-1' },
      { name: 'billing_address', type: 'TEXT', constraints: 'NOT NULL', description: 'Morada fiscal obrigatória' },
      { name: 'email', type: 'VARCHAR(100)', description: 'Contacto electrónico' }
    ],
    relationships: [
      { target: 'FiscalDocument', type: '1:N', description: 'Destinatário de facturas emitidas' }
    ]
  },
  {
    name: 'TaxCategory (Tabela de Imposto)',
    category: 'Fiscal & Documentos',
    description: 'Parametrização dinâmica de IVA, retenções e motivos de isenção legais.',
    primaryKey: 'id (UUID)',
    attributes: [
      { name: 'tax_type', type: 'VARCHAR(10)', constraints: 'NOT NULL', description: 'IVA, IS, RET_FONTE' },
      { name: 'tax_code', type: 'VARCHAR(10)', constraints: 'NOT NULL', description: 'NOR, RED, INT, ISE, OUT' },
      { name: 'rate_percentage', type: 'DECIMAL(5,2)', constraints: 'NOT NULL', description: 'Taxa (ex: 14.00, 7.00, 0.00)' },
      { name: 'exemption_code', type: 'VARCHAR(10)', description: 'Código SAF-T (M00 a M99) se taxa for 0%' },
      { name: 'exemption_reason', type: 'VARCHAR(255)', description: 'Menção legal exigida por lei' },
      { name: 'valid_from', type: 'DATE', constraints: 'NOT NULL', description: 'Início da vigência legal' },
      { name: 'valid_to', type: 'DATE', description: 'Fim de vigência (se revogado)' }
    ],
    relationships: [
      { target: 'Product', type: '1:N', description: 'Associado a produtos/serviços' },
      { target: 'FiscalDocumentLine', type: '1:N', description: 'Aplicado em linhas de documentos' }
    ]
  },
  {
    name: 'DocumentSeries (Série Documental)',
    category: 'Fiscal & Documentos',
    description: 'Controlador atómico de numeração contínua e sequencial por exercício.',
    primaryKey: 'id (UUID)',
    attributes: [
      { name: 'company_id', type: 'UUID', constraints: 'FK -> Company, NOT NULL', description: 'Empresa titular' },
      { name: 'establishment_id', type: 'UUID', constraints: 'FK -> Establishment, NOT NULL', description: 'Estabelecimento emissor' },
      { name: 'document_type', type: 'VARCHAR(5)', constraints: 'NOT NULL', description: 'FT, FR, RC, NC, ND' },
      { name: 'series_code', type: 'VARCHAR(10)', constraints: 'NOT NULL', description: 'Identificador (ex: A2026, LJ1)' },
      { name: 'fiscal_year', type: 'INTEGER', constraints: 'NOT NULL', description: 'Exercício fiscal (ex: 2026)' },
      { name: 'current_sequence', type: 'BIGINT', constraints: 'DEFAULT 0', description: 'Último número emitido (atómico)' },
      { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Série aberta para emissão' }
    ],
    relationships: [
      { target: 'FiscalDocument', type: '1:N', description: 'Agrupa documentos da série' }
    ]
  },
  {
    name: 'FiscalDocument (Documento Fiscal)',
    category: 'Fiscal & Documentos',
    description: 'Documento fiscal inviolável com hash criptográfico encadeado.',
    primaryKey: 'id (UUID)',
    attributes: [
      { name: 'series_id', type: 'UUID', constraints: 'FK -> DocumentSeries, NOT NULL', description: 'Série de origem' },
      { name: 'document_type', type: 'VARCHAR(5)', constraints: 'NOT NULL', description: 'FT, FR, RC, NC, ND' },
      { name: 'document_number', type: 'VARCHAR(30)', constraints: 'UNIQUE, NOT NULL', description: 'Ex: FT A2026/000001' },
      { name: 'sequential_number', type: 'BIGINT', constraints: 'NOT NULL', description: 'Sequência numérica 1..N' },
      { name: 'document_date', type: 'TIMESTAMP', constraints: 'NOT NULL', description: 'Data/Hora de emissão' },
      { name: 'gross_amount', type: 'DECIMAL(18,2)', constraints: 'NOT NULL', description: 'Total ilíquido' },
      { name: 'tax_amount', type: 'DECIMAL(18,2)', constraints: 'NOT NULL', description: 'Total IVA apurado' },
      { name: 'withholding_amount', type: 'DECIMAL(18,2)', constraints: 'DEFAULT 0', description: 'Total retenção na fonte (6.5%)' },
      { name: 'net_total', type: 'DECIMAL(18,2)', constraints: 'NOT NULL', description: 'Total a pagar' },
      { name: 'hash', type: 'VARCHAR(256)', constraints: 'NOT NULL', description: 'Hash SHA-256 encadeado' },
      { name: 'previous_hash', type: 'VARCHAR(256)', description: 'Hash do documento anterior na série' },
      { name: 'hash_control', type: 'VARCHAR(4)', constraints: 'NOT NULL', description: 'Código de controlo impresso (ex: 4 caracteres)' },
      { name: 'status', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'ISSUED, PENDING_AGT, ACCEPTED, RECTIFIED' }
    ],
    relationships: [
      { target: 'FiscalDocumentLine', type: '1:N', description: 'Linhas discriminadas do documento' },
      { target: 'Payment', type: '1:N', description: 'Liquidações financeiras associadas' },
      { target: 'FiscalDocumentReference', type: '1:N', description: 'Relações com notas de crédito' }
    ]
  },
  {
    name: 'AuditLog (Registo de Auditoria)',
    category: 'Auditoria',
    description: 'Trilha cronológica imutável de todas as acções operacionais e fiscais.',
    primaryKey: 'id (UUID)',
    attributes: [
      { name: 'company_id', type: 'UUID', constraints: 'NOT NULL', description: 'Empresa do contexto' },
      { name: 'user_id', type: 'UUID', constraints: 'NOT NULL', description: 'Utilizador responsável' },
      { name: 'action', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'DOC_ISSUED, SERIES_OPENED, etc.' },
      { name: 'entity_name', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Nome da tabela/entidade' },
      { name: 'entity_id', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Identificador do registo' },
      { name: 'payload_diff', type: 'JSONB', description: 'Snapshot das alterações e valores' },
      { name: 'ip_address', type: 'VARCHAR(45)', description: 'Endereço IP do operador' },
      { name: 'timestamp', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Carimbo de data/hora oficial UTC' }
    ],
    relationships: []
  }
];

export const TAX_RATES_ANGOLA: TaxRateOption[] = [
  { code: 'IVA_14', name: 'IVA Taxa Geral (14%)', rate: 14.0, type: 'IVA', legalBasis: 'Art. 12.º do Código do IVA' },
  { code: 'IVA_07', name: 'IVA Taxa Reduzida (7%)', rate: 7.0, type: 'IVA', legalBasis: 'Bens essenciais e província de Cabinda' },
  { code: 'IVA_05', name: 'IVA Taxa Reduzida (5%)', rate: 5.0, type: 'IVA', legalBasis: 'Insumos agrícolas e produtos seleccionados' },
  { code: 'IVA_00_M00', name: 'Isenção M00 — Regime Transitório/Simplificado', rate: 0.0, type: 'IVA', exemptionCode: 'M00', legalBasis: 'Regime de Exclusão do IVA' },
  { code: 'IVA_00_M02', name: 'Isenção M02 — Transmissão de bens e serviços isentos', rate: 0.0, type: 'IVA', exemptionCode: 'M02', legalBasis: 'Artigo 12.º do CIVA' },
  { code: 'IVA_00_M04', name: 'Isenção M04 — Exportação e operações assimiladas', rate: 0.0, type: 'IVA', exemptionCode: 'M04', legalBasis: 'Artigo 15.º do CIVA' },
  { code: 'RET_65', name: 'Retenção na Fonte Prestação Serviços (6.5%)', rate: 6.5, type: 'RET', legalBasis: 'Lei n.º 19/14 e código do IRT/Imposto Industrial' }
];

export const TECHNICAL_RISKS: TechnicalRisk[] = [
  {
    id: 'RISK-01',
    title: 'Concorrência e Quebra da Numeração Sequencial',
    category: 'Concorrência',
    severity: 'Crítico',
    description: 'Emissões simultâneas por múltiplos postos/caixas poderem gerar números idênticos ou furos sequenciais proibidos pela AGT.',
    mitigationStrategy: 'Uso de transacções com isolamento estrito (SELECT ... FOR UPDATE na tabela document_series), atribuindo o número no mesmo bloco transaccional em que a factura é gravada com rollback completo em falhas.'
  },
  {
    id: 'RISK-02',
    title: 'Alteração Indevida de Documentos Após Emissão',
    category: 'Fiscal',
    severity: 'Crítico',
    description: 'Edições arbitrárias em dados fiscais já reportados ou impressos, violando o Decreto Presidencial 292/18.',
    mitigationStrategy: 'Imposição de imutabilidade no modelo: remoção de endpoints de UPDATE em tabelas fiscais emitidas; correcções exigem obrigatoriamente emissão de Nota de Crédito com referência explícita.'
  },
  {
    id: 'RISK-03',
    title: 'Exposição ou Comprometimento da Chave Privada RSA',
    category: 'Criptografia',
    severity: 'Crítico',
    description: 'Chaves privadas de certificação fiscal serem acidentalmente comitadas, expostas em logs ou acessíveis via frontend.',
    mitigationStrategy: 'A chave privada é mantida estritamente no backend em variáveis de ambiente cifradas; criação do SignatureService isolado sem qualquer saída de chave privada para logs ou APIs.'
  },
  {
    id: 'RISK-04',
    title: 'Indisponibilidade ou Timeout na Comunicação com a AGT',
    category: 'Integração',
    severity: 'Alto',
    description: 'Oscilações de conectividade de rede na submissão de facturas electrónicas para os servidores da AGT gerarem atrasos ou erros de bloqueio ao utilizador.',
    mitigationStrategy: 'Separação em emissão local (garantida com hash e estado PENDING_AGT) e fila assíncrona desacoplada com retry automático idempotente e tratamento de indisponibilidade.'
  },
  {
    id: 'RISK-05',
    title: 'Incompatibilidade com o Validador SAF-T(AO) da AGT',
    category: 'Fiscal',
    severity: 'Alto',
    description: 'Divergência na estrutura XML (cardinalidade de tags, tipos decimais, codificação de caracteres ou namespaces XSD) reprovar o ficheiro mensal.',
    mitigationStrategy: 'Implementação de gerador baseado no esquema XSD oficial da AGT com validador sintáctico e semântico embutido que valida o ficheiro antes da exportação.'
  },
  {
    id: 'RISK-06',
    title: 'Erros de Arredondamento e Discrepâncias de Cêntimos',
    category: 'Performance',
    severity: 'Médio',
    description: 'Diferenças de arredondamento entre a soma dos impostos das linhas e o imposto calculado sobre o total geral.',
    mitigationStrategy: 'Motor matemático normalizado com precisão decimal fixa (arredondamento bancário a 2 casas decimais na moeda Kwanza) e cálculo consistente por linha de documento.'
  }
];
