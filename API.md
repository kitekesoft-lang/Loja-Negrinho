# API.md — Contrato de Interfaces REST da Solução

## Versionamento da API: `/api/v1`

### 1. Multiempresa & Estabelecimentos
- `GET /api/v1/companies` — Lista empresas geridas
- `POST /api/v1/companies` — Cadastra nova empresa
- `GET /api/v1/companies/:id/establishments` — Lista estabelecimentos
- `POST /api/v1/companies/:id/establishments` — Cria novo estabelecimento

### 2. Cadastros Comerciais e Impostos
- `GET /api/v1/customers` — Lista clientes
- `POST /api/v1/customers` — Regista cliente
- `GET /api/v1/products` — Catálogo de produtos/serviços
- `POST /api/v1/products` — Cria produto/serviço com parametrização fiscal
- `GET /api/v1/tax-categories` — Tabela de impostos e isenções configuradas

### 3. Núcleo Fiscal e Séries
- `GET /api/v1/series` — Lista séries documentais e estado sequencial
- `POST /api/v1/series` — Abre nova série documental
- `POST /api/v1/invoices/simulate` — Simula cálculos de impostos, linhas e totais antes da emissão
- `POST /api/v1/invoices/issue` — Emite documento fiscal oficial (atribui número sequencial atómico, calcula hash, bloqueia documento)
- `POST /api/v1/invoices/:id/credit-note` — Emite Nota de Crédito rectificativa associada
- `POST /api/v1/invoices/:id/payments` — Regista liquidação/pagamento

### 4. Auditoria
- `GET /api/v1/audit-logs` — Consulta trilha de auditoria filtrada por empresa, data, utilizador e entidade
