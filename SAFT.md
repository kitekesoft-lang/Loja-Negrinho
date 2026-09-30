# SAFT.md — Arquitectura do Motor SAF-T(AO) (Fase 3)

## 1. Visão do Módulo `SAFTService`

O ficheiro SAF-T(AO) (Standard Audit File for Tax Purposes - Angola) é o ficheiro de extracção de auditoria oficial exigido pela AGT.

A arquitectura segue o fluxo:
```text
┌──────────────┐     ┌─────────────┐     ┌────────────────┐     ┌───────────────┐     ┌───────────────┐
│ ERP Database ├───► │ Data Domain ├───► │ Builders Espec.├───► │ Xml Generator ├───► │ XSD Validator ├───► XML Final
└──────────────┘     └─────────────┘     └────────────────┘     └───────────────┘     └───────────────┘
```

## 2. Builders Desacoplados

1. `SAFTHeaderBuilder`: Metadados da empresa, NIF, versão da especificação SAF-T, período fiscal (Data Início / Fim), moeda (AOA) e dados do software produtor.
2. `SAFTCustomerBuilder`: Tabela mestra de clientes com identificadores e enquadramento fiscal.
3. `SAFTSupplierBuilder`: Tabela mestra de fornecedores.
4. `SAFTProductBuilder`: Tabela de produtos e serviços cadastrados com código fiscal.
5. `SAFTTaxBuilder`: Códigos e taxas de IVA (Normal, Reduzido, Isenções).
6. `SAFTSalesBuilder`: Mapeamento das facturas (`SalesInvoices`), linhas, impostos discriminados, referências a notas de crédito e hashes encadeados.
7. `SAFTPaymentBuilder`: Registo de recibos e meios de pagamento associados.
8. `SAFTInventoryBuilder`: Movimentos e saldos de inventário (preparado na Fase 3, alimentado na Fase 4).
9. `SAFTAccountingBuilder`: Diários, contas do plano geral de contabilidade (PGC) angolano e movimentos a débito/crédito (Fase 4).

## 3. Validação Sintáctica e Semântica XSD
- O ficheiro XML gerado é submetido automaticamente ao motor de validação contra o esquema `saft_ao_schema.xsd`.
- Relatório de validação detalha: tag, linha, coluna, valor recebido vs. restrição de formato XSD violada.
