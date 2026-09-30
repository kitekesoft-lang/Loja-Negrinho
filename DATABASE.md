# DATABASE.md — Modelo de Dados e Estrutura de Tabelas

## 1. Princípios de Modelação Relacional
- **ACID Compliant**: Uso de base de dados relacional com integridade referencial forte (`FOREIGN KEY ... ON DELETE RESTRICT` para entidades fiscais emitidas).
- **Sem Exclusão Física**: Documentos fiscais após emissão possuem restrição no nível da base de dados e da aplicação que impede `DELETE` e `UPDATE` em colunas imutáveis.
- **Auditoria de Linha**: Todas as tabelas contêm `created_at`, `updated_at`, `created_by_user_id` e controlo de versão de registo (`version` / optimistic locking).

## 2. Tabelas Principais (Fase 1)

### 2.1. Empresas e Estabelecimentos
- `companies`:
  - `id` (UUID PK)
  - `tax_id` (NIF angolano único com validação algorítmica)
  - `name` (Denominação social)
  - `trade_name` (Nome comercial)
  - `address_line1`, `address_line2`, `city`, `province`, `postal_code`, `country_code` (AO)
  - `currency_code` (AOA)
  - `tax_regime` (Regime Geral / Regime Simplificado / Regime de Exclusão)
  - `conservatory_registration` (Registo Comercial)
  - `share_capital` (Capital Social)
  - `status` (ACTIVE, INACTIVE, SUSPENDED)
- `establishments`:
  - `id` (UUID PK)
  - `company_id` (UUID FK -> companies)
  - `code` (ex: "SEDE", "LOJA01", "FILIAL_TALATONA")
  - `name`
  - `address`, `city`, `province`, `country_code`
  - `status`

### 2.2. Segurança e Utilizadores
- `users`: `id`, `company_id`, `email`, `password_hash`, `full_name`, `status`
- `roles`: `id`, `code` (ADMIN, GERENTE, CAIXA, VENDEDOR, CONTABILISTA, AUDITOR), `description`
- `user_roles`: `user_id`, `role_id`
- `permissions`: `id`, `code` (ex: `FISCAL_DOC_ISSUE`, `FISCAL_DOC_CANCEL`, `SERIES_MANAGE`, `AUDIT_VIEW`)
- `role_permissions`: `role_id`, `permission_id`

### 2.3. Entidades Comerciais
- `customers`:
  - `id` (UUID PK)
  - `company_id` (UUID FK)
  - `customer_tax_id` (NIF ou '999999999' para Consumidor Final)
  - `name`, `trade_name`, `email`, `phone`
  - `billing_address`, `city`, `province`, `country_code`
  - `customer_type` (NATIONAL_COMPANY, NATIONAL_INDIVIDUAL, FOREIGN)
  - `status`
- `suppliers`:
  - `id` (UUID PK), `company_id`, `tax_id`, `name`, `email`, `phone`, `address`, `status`

### 2.4. Catálogo e Impostos
- `tax_categories`:
  - `id` (UUID PK)
  - `tax_type` (IVA, IS - Imposto de Selo, RETENCAO_FONTE)
  - `tax_code` (NOR - Taxa Normal, RED - Taxa Reduzida, ISE - Isento, OUT - Outro)
  - `rate_percentage` (ex: 14.00, 7.00, 5.00, 0.00)
  - `exemption_reason_code` (ex: M00, M02, M04 conforme tabela SAF-T AO)
  - `exemption_reason_description`
  - `valid_from`, `valid_to`
- `products`:
  - `id` (UUID PK), `company_id`, `type` (PRODUCT, SERVICE)
  - `sku_code`, `description`, `barcode`
  - `unit_of_measure` (UN, KG, HORAS, etc.)
  - `standard_price`, `currency` (AOA)
  - `tax_category_id` (UUID FK -> tax_categories)
  - `withholding_tax_applicable` (BOOLEAN)
  - `withholding_rate` (ex: 6.50%)
  - `status`

### 2.5. Séries e Facturação
- `document_series`:
  - `id` (UUID PK), `company_id`, `establishment_id`
  - `document_type_code` (FT, FR, RC, NC, ND, FP, etc.)
  - `series_code` (ex: "A2026", "L01")
  - `fiscal_year` (2026)
  - `current_sequence_number` (BIGINT, default 0)
  - `is_active` (BOOLEAN)
  - `is_closed` (BOOLEAN)
  - `created_at`
- `fiscal_documents`:
  - `id` (UUID PK), `company_id`, `establishment_id`
  - `series_id` (UUID FK)
  - `document_type_code` (FT, FR, RC, NC, ND)
  - `document_number` (ex: "FT A2026/000001")
  - `sequential_number` (BIGINT)
  - `document_date` (TIMESTAMP)
  - `system_entry_date` (TIMESTAMP)
  - `customer_id` (UUID FK)
  - `customer_tax_id`, `customer_name`, `customer_address`
  - `status` (DRAFT, ISSUED, ACCEPTED_AGT, REJECTED_AGT, CANCELLED, RECTIFIED)
  - `gross_amount` (Total Ilíquido)
  - `discount_amount` (Descontos)
  - `tax_payable_amount` (Total Imposto)
  - `withholding_tax_amount` (Retenções)
  - `net_total_amount` (Total Líquido / A Pagar)
  - `hash` (Hash de integridade encadeado)
  - `previous_hash` (Hash do documento anterior na série)
  - `hash_control_code` (ex: 4 caracteres para exibição em factura)
  - `signature` (Assinatura digital AGT / RSA)
  - `agt_request_id`, `agt_status_code`, `agt_message`
- `fiscal_document_lines`:
  - `id` (UUID PK), `document_id` (UUID FK)
  - `line_number` (INTEGER)
  - `product_id` (UUID FK), `product_code`, `description`
  - `quantity`, `unit_price`, `unit_of_measure`
  - `discount_rate`, `discount_amount`
  - `tax_category_id` (UUID FK), `tax_rate`, `tax_amount`
  - `exemption_code`, `exemption_reason`
  - `withholding_rate`, `withholding_amount`
  - `total_line_amount`
- `fiscal_document_references`:
  - `id` (UUID PK), `source_document_id`, `referenced_document_id`
  - `reference_type` (CREDIT_NOTE_FOR, DEBIT_NOTE_FOR, RECTIFICATION_OF)
  - `reason`

### 2.6. Pagamentos e Auditoria
- `payment_methods`: `id`, `code` (CASH, BANK_TRANSFER, MULTICAIXA, CREDIT_CARD), `name`
- `payments`:
  - `id` (UUID PK), `company_id`, `document_id`, `payment_method_id`
  - `amount`, `payment_date`, `transaction_reference`, `status`
- `audit_logs`:
  - `id` (UUID PK), `company_id`, `user_id`, `event_type`
  - `entity_name`, `entity_id`, `action`
  - `previous_payload` (JSONB), `new_payload` (JSONB)
  - `ip_address`, `user_agent`, `created_at` (TIMESTAMP)
