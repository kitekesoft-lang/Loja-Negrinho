# FISCAL.md — Regras de Negócio Fiscais e Enquadramento Angolano

## 1. Enquadramento Legal

1. **Código do IVA de Angola (Lei n.º 7/19 e alterações posteriores)**:
   - Taxa Geral: **14%**;
   - Taxas Especiais/Reduzidas (por exemplo, província de Cabinda a **2% / 7%** para determinados bens alimentares essenciais de produção nacional);
   - Isenções com motivo obrigatório (M00 a M99) e fundamentação legal nos documentos emitidos.
2. **Regime Jurídico das Facturas e Documentos Equivalentes (Decreto Presidencial n.º 292/18)**:
   - Numeração contínua e cronológica por série documental;
   - Imutabilidade absoluta após emissão;
   - Elementos obrigatórios: NIF da entidade emitente e adquirente, morada, denominação social, discriminação de mercadorias, taxas aplicadas, valor líquido, impostos discriminados, menção ao sistema e número de certificação/versão.
3. **Retenções na Fonte**:
   - Prestação de serviços (6.5% ou taxa aplicável conforme natureza do prestador e regime);
   - Discriminação visual e contábil expressa do montante retido a deduzir ao total a pagar.

## 2. Motor de Séries e Numeração Sequencial (`DocumentSeriesEngine`)

- **Estrutura**: `[TipoDocumento] [Série]/[Sequência]` (Exemplo: `FT A2026/000001`).
- **Garantia Anti-Concorrência**:
  - Reserva atómica na base de dados (`SELECT ... FOR UPDATE` no registo de controlo da série dentro de uma transacção isolada).
  - Sem furos ou saltos de numeração. Em caso de falha de gravação ou cancelamento antes da persistência, a transacção faz rollback integral.
  - Verificação de monotonicidade cronológica: `DataDocumento(N) >= DataDocumento(N-1)`.

## 3. Encadeamento Criptográfico de Hashes (Integridade do Núcleo Fiscal)

Cada documento fiscal gerado calcula uma chave hash SHA encadeada:
$$\text{Hash}_N = \text{HMAC-SHA256}(\text{DataDocumento} + ";" + \text{DataSistema} + ";" + \text{NumeroDocumento} + ";" + \text{TotalBruto} + ";" + \text{Hash}_{N-1})$$

Onde $\text{Hash}_0 = ""$ (string vazia para o primeiro documento da série).
O código de controlo de 4 caracteres (ex: 1º, 11º, 21º e 31º caracteres do hash) é impresso no documento para conferência visual.

## 4. Tipos Documentais Suportados

| Código | Designação Oficial | Descrição Fiscal |
|---|---|---|
| **FT** | Factura | Documento emitido para titulação de venda a crédito ou a pronto. |
| **FR** | Factura/Recibo | Titula a venda com quitação imediata e simultânea do pagamento. |
| **RC** | Recibo | Titula a quitação de pagamentos referentes a facturas prévias. |
| **NC** | Nota de Crédito | Rectifica ou anula total/parcialmente uma factura prévia. Obriga a referenciar o documento original. |
| **ND** | Nota de Débito | Acrescenta valores debitados ao cliente associados a uma factura prévia. |
| **FP** | Factura Pró-forma | Documento orçamental informativo sem relevância fiscal imediata. |
| **GA** | Factura Global / Adiantamento | Titula adiantamentos ou vendas globais consolidadas. |
