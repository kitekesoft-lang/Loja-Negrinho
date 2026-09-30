# Sistema de Gestão Fiscal e ERP Angolano

Sistema de gestão empresarial concebido especificamente para o mercado da República de Angola, com conformidade estrita aos diplomas legais e exigências técnicas da **Administração Geral Tributária (AGT)**, nomeadamente:
- Regime Jurídico das Facturas e Documentos Equivalentes (Decreto Presidencial n.º 292/18 e legislação conexa);
- Código do Imposto sobre o Valor Acrescentado (CIVA de Angola);
- Requisitos de certificação de software de facturação e comunicação de documentos (Web Services AGT);
- Estrutura de dados para ficheiro de auditoria fiscal SAF-T(AO) segundo as directivas em vigor.

---

## 1. Princípio Fundamental de Arquitectura

O sistema respeita a separação estrita por camadas desacopladas (Clean Architecture / Hexagonal Architecture):

```text
┌────────────────────────────────────────────────────────┐
│                   INTERFACE DE USUÁRIO                 │
│      (Web SPA React / Futuro POS / Mobile / Terceiros) │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                    API / APPLICATION                   │
│         (Controladores, DTOs, Autenticação, RBAC)       │
└───────────────────────────┬────────────────────────────┘
                            │ Casos de Uso
┌───────────────────────────▼────────────────────────────┐
│                    BUSINESS DOMAIN                     │
│         (Empresas, Clientes, Produtos, Utilizadores)   │
└───────────────────────────┬────────────────────────────┘
                            │ Regras Fiscais
┌───────────────────────────▼────────────────────────────┐
│                      FISCAL CORE                       │
│  (TaxEngine, SeriesEngine, InvoiceEngine, AuditLog,    │
│            Chaining Hashes, Assinatura)                │
└───────────────────────────┬────────────────────────────┘
                            │ Abstracção Repositório
┌───────────────────────────▼────────────────────────────┐
│                 DATABASE & PERSISTÊNCIA                │
│    (PostgreSQL / Cloud SQL / Migrations / Isolamento)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Roteiro de Implementação em 4 Fases

1. **FASE 1 — Núcleo Fiscal**: Modelos base multiempresa, clientes, produtos/serviços, motor de impostos (IVA, Retenções, Isenções), controlo de séries sequenciais invioláveis, motor de facturação, notas de crédito/débito, pagamentos e trilha de auditoria imutável.
2. **FASE 2 — Integração AGT**: Conector dedicado `AGTConnector`, gestão de chaves criptográficas (RSA/RS256), assinatura fiscal, fila assíncrona com retry e idempotência para comunicação via Web Services da AGT.
3. **FASE 3 — SAF-T(AO)**: Mapeadores independentes, gerador de XML normalizado segundo o XSD oficial da AGT e motor de validação sintáctica e semântica de esquemas.
4. **FASE 4 — ERP Completo**: Expansão para compras, controlo de stocks e armazéns com inventário permanente, gestão de caixas e bancos com reconciliação bancária, contabilidade e relatórios fiscais/analíticos.

---

## 3. Estado Atual do Projecto

- **Fase Actual:** `ETAPA 0 — PLANEAMENTO E ESPECIFICAÇÃO TÉCNICA`
- **Aguardando:** Validação e autorização para o início da execução da Fase 1 (Núcleo Fiscal).
