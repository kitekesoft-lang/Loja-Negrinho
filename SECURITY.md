# SECURITY.md — Directrizes de Segurança e Imutabilidade

## 1. Princípios de Protecção de Dados e Integridade
- **Protecção de Chaves Privadas**: As chaves criptográficas utilizadas para assinatura de documentos perante a AGT são armazenadas em formato seguro no backend e jamais expostas via endpoints da API ou logs.
- **Autenticação e Autorização**:
  - JWT assinado criptograficamente com tempo de expiração curto e refresh tokens rotativos;
  - Role-Based Access Control (RBAC) com permissões granulares: apenas utilizadores com permissão específica podem anular documentos ou abrir novas séries.
- **Imutabilidade Fiscal**:
  - Registos de `fiscal_documents` emitidos não suportam operações de `DELETE` físico.
  - Rectificações ou correcções exigem obrigatoriamente a emissão de Nota de Crédito (NC) ou Nota de Débito (ND) com encadeamento referencial.
- **Sanitização e Validação**:
  - Validação estrita de schemas em todos os endpoints REST (DTOs com zod/typebox);
  - Parametrização integral de consultas SQL contra vulnerabilidades de SQL Injection.
