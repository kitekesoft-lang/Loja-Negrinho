export type LicensePlan = 'DEMO' | 'SEMESTRAL' | 'ANUAL';

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'EXPIRING_SOON';

export interface LicensePlanDetails {
  plan: LicensePlan;
  name: string;
  tagline: string;
  defaultDurationDays: number;
  badgeColor: string;
  maxUsers: number | 'ILIMITADO';
  maxEstablishments: number | 'ILIMITADO';
  features: string[];
  description: string;
}

export const LICENSE_PLAN_PRESETS: Record<LicensePlan, LicensePlanDetails> = {
  DEMO: {
    plan: 'DEMO',
    name: 'Licença Demonstração (Demo)',
    tagline: 'Período experimental para testes operacionais e avaliação fiscal',
    defaultDurationDays: 15,
    badgeColor: 'amber',
    maxUsers: 2,
    maxEstablishments: 1,
    features: [
      'Ponto de Venda (POS) Completo',
      'Assinatura Digital AGT (RSA-2048)',
      'Emissão de Facturas/Recibo e Talões',
      'Gestão de Stock Básica',
      'Cálculo Automático de Troco',
      'Testes Fiscais Integrados',
    ],
    description: 'Indicada para demonstrações, clientes em fase de testes e feiras comerciais. Duração de 15 a 30 dias.',
  },
  SEMESTRAL: {
    plan: 'SEMESTRAL',
    name: 'Licença Semestral (6 Meses)',
    tagline: 'Subscrição semestral renovável para pequenas e médias empresas',
    defaultDurationDays: 180,
    badgeColor: 'blue',
    maxUsers: 5,
    maxEstablishments: 2,
    features: [
      'Ponto de Venda (POS) Ilimitado',
      'Certificação Fiscal AGT e Código QR Oficial',
      'Gestão Integral de Stocks e Inventário CMP',
      'Clientes, Fornecedores e Encomendas de Compra',
      'Exportação Oficial do Ficheiro SAF-T (AO)',
      'Sessões de Caixa e Controlo de Sangrias',
      'Relatórios Financeiros e Fiscais Exportáveis',
      'Suporte Técnico Semestral Dedicado',
    ],
    description: 'Plano semestral de 180 dias com renovação semestral e total conformidade com a AGT.',
  },
  ANUAL: {
    plan: 'ANUAL',
    name: 'Licença Anual (12 Meses)',
    tagline: 'Solução corporativa completa com validade para o ano fiscal inteiro',
    defaultDurationDays: 365,
    badgeColor: 'emerald',
    maxUsers: 'ILIMITADO',
    maxEstablishments: 'ILIMITADO',
    features: [
      'Acesso Total Irrestrito a Todos os Módulos',
      'Assinatura Criptográfica RSA-2048 & Hash Encadeado',
      'Transmissão Assíncrona AGT e Fila de Contingência',
      'Extracção e Validação do SAF-T(AO) Anual',
      'Multi-utilizadores e Estabelecimentos Ilimitados',
      'Módulo ERP Completo (Contabilidade PGC & Tesouraria)',
      'Modo Offline Robusto com Sincronização Automática',
      'Actualizações Fiscais Garantidas para o Ano Fiscal',
    ],
    description: 'Plano empresarial de 365 dias (1 ano completo) para empresas consolidadas com suporte prioritário.',
  },
};

export interface LicenseInfo {
  id: string;
  licenseKey: string;
  plan: LicensePlan;
  status: LicenseStatus;
  issuedToCompany: string;
  issuedToNif: string;
  activationDate: string; // Formato YYYY-MM-DD
  expirationDate: string; // Formato YYYY-MM-DD
  durationDays: number;
  maxUsers: number | 'ILIMITADO';
  maxEstablishments: number | 'ILIMITADO';
  features: string[];
  signatureChecksum: string;
  assignedByUserId: string;
  assignedByUserName: string;
  lastValidatedAt: string;
  notes?: string;
  hardwareFingerprint?: string;
}
