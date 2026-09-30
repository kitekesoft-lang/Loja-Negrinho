# CHANGELOG.md — Registo Histórico de Alterações

## [0.1.0] - 2026-09-20
### Adicionado
- **Etapa 0 Concluída**: Planeamento e Especificação Técnica Integral da Solução Fiscal e ERP Angolano.
- Definição formal das 4 fases de desenvolvimento:
  - Fase 1: Núcleo Fiscal (Fiscal Core)
  - Fase 2: Integração AGT (AGTConnector, Assinatura RSA, Fila Assíncrona)
  - Fase 3: Motor SAF-T(AO) (Mappers, Gerador XML e Validador XSD)
  - Fase 4: Expansão ERP (Compras, Stock, Vendas, Tesouraria e Contabilidade)
- Elaboração dos documentos directivos: `README.md`, `ARCHITECTURE.md`, `DATABASE.md`, `FISCAL.md`, `AGT.md`, `SAFT.md`, `SECURITY.md`, `API.md` e `CHANGELOG.md`.
- Modelação de dados relacional detalhada das entidades multiempresa, séries anti-duplicação, tabelas de impostos angolanos e imutabilidade dos documentos fiscais.
