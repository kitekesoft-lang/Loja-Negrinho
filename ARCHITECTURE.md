# ARCHITECTURE.md — Arquitectura do Sistema

## 1. Visão Geral

O sistema é projectado com base nos princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e **Inversão de Dependências**. O **Núcleo Fiscal (Fiscal Core)** é totalmente agnóstico em relação à camada de apresentação e à tecnologia de transporte (HTTP/REST/gRPC/CLI).

## 2. Camadas do Sistema

### 2.1. Domain & Fiscal Core (`/src/core/fiscal`)
- **Regras Imutáveis**: Entidades e Value Objects puros (sem dependências de frameworks externos ou bibliotecas de UI).
- **TaxEngine**: Avaliação de impostos em cascata, incidências, isenções, regimes de IVA angolanos (Geral 14%, Reduzido 5% / 7%, Isenção 0%), retenções na fonte (por exemplo, 6.5% de retenção de prestação de serviços / Lei 19/14 e subsequentes).
- **DocumentSeriesEngine**: Garantia de integridade sequencial estrita por Empresa + Estabelecimento + Tipo de Documento + Série + Exercício.
- **InvoiceEngine**: Orquestrador da emissão: validação de dados fiscais (NIF, morada obrigatória), apuramento de linhas, descontos comerciais e financeiros, cálculo de taxas e retenções, hashing encadeado (J-Hash / SHA-1/SHA-256 de acordo com a norma AGT) e bloqueio definitivo contra edição arbitrária.

### 2.2. Application Layer (`/src/core/application`)
- Casos de uso (Use Cases / Commands & Queries):
  - `CreateCompanyUseCase`, `CreateEstablishmentUseCase`
  - `RegisterCustomerUseCase`, `RegisterProductUseCase`
  - `IssueInvoiceUseCase`, `IssueCreditNoteUseCase`, `RegisterPaymentUseCase`
  - `GenerateSaftUseCase`, `TransmitAgtDocumentUseCase`
- Coordenação de transacções e chamadas aos serviços de domínio.

### 2.3. Infrastructure Layer (`/src/infrastructure`)
- **Database & Repositories**: Implementações de repositórios em PostgreSQL/SQL com transacções ACID com nível de isolamento `SERIALIZABLE` para reserva sequencial de números de documentos.
- **Crypto & Security**: `SignatureService` com suporte a chaves privadas RSA (PKCS#8 / PKCS#1) e cifras normalizadas.
- **AGT Web Service Client**: Adaptador SOAP/REST conforme especificação técnica dos serviços de Facturação Electrónica da AGT.
- **Audit Logger**: `AuditService` persistindo todos os eventos fiscais com timestamp UTC, IP, user-agent e delta de estado.

### 2.4. Presentation Layer (`/src/api` e `/src/ui`)
- **API REST**: Endpoints estruturados com versionamento `/api/v1/...` e validação rigorosa de DTOs.
- **Client Frontend**: Interface limpa, responsiva, com foco em ergonomia operacional, acessibilidade e validação imediata em tempo de digitação.

## 3. Isolamento Multiempresa (Multi-Tenant)

- Abordagem de dados: Coluna `company_id` com chaves estrangeiras estritas e Row-Level Security (RLS) ou isolamento por contexto transaccional.
- Nenhuma consulta ou mutação pode ser executada sem a contextualização explícita do `company_id` autenticado.
- Cada estabelecimento (`establishment_id`) pertence obrigatoriamente a uma única empresa e gere as suas próprias séries ou partilha séries centralizadas dependendo da parametrização legal adoptada.
