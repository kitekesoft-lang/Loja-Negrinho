export type RoadmapPhaseId = 'phase0' | 'phase1' | 'phase2' | 'phase3' | 'phase4';

export interface RoadmapPhase {
  id: RoadmapPhaseId;
  number: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'in_progress' | 'pending';
  badge: string;
  description: string;
  keyDeliverables: string[];
  prerequisites: string;
}

export interface ArchitectureLayer {
  name: string;
  badge: string;
  description: string;
  components: string[];
  responsibilities: string[];
}

export interface EntityDefinition {
  name: string;
  category: 'Organizacional' | 'Segurança' | 'Catálogo' | 'Fiscal & Documentos' | 'Auditoria';
  description: string;
  primaryKey: string;
  attributes: { name: string; type: string; constraints?: string; description: string }[];
  relationships: { target: string; type: '1:N' | 'N:1' | 'N:M' | '1:1'; description: string }[];
}

export interface TaxRateOption {
  code: string;
  name: string;
  rate: number;
  type: 'IVA' | 'IS' | 'RET';
  exemptionCode?: string;
  legalBasis?: string;
}

export interface TechnicalRisk {
  id: string;
  title: string;
  category: 'Fiscal' | 'Criptografia' | 'Concorrência' | 'Integração' | 'Performance';
  severity: 'Crítico' | 'Alto' | 'Médio';
  description: string;
  mitigationStrategy: string;
}
