# Resolução de Problemas (Troubleshooting)

## Diagnósticos Comuns no Windows

### 1. Aplicação não inicia no Windows 7
- **Causa provável**: Ausência do Windows 7 Service Pack 1 ou da atualização de segurança da Microsoft KB2533623 / KB3063858 (suporte SHA-2).
- **Solução**: Aplicar o Windows Update ou instalar o pacote KB2533623 manualmente.

### 2. Impressora térmica não responde
- **Causa provável**: Driver da impressora (ESC/POS) não registado no Spooler do Windows ou nome de dispositivo divergente.
- **Solução**:
  - Verificar no Painel de Controlo do Windows se a impressora aparece na lista de "Dispositivos e Impressoras".
  - Utilizar a opção de diálogo de impressão nativo do Windows caso a impressão silenciosa falhe.

### 3. Falsa detecção de vírus / SmartScreen
- **Causa provável**: O binário recém-compilado não possui assinatura de código digital (EV Code Signing Certificate).
- **Solução**:
  - Clicar em "Mais informações" -> "Executar assim mesmo" no ecrã do Windows SmartScreen.
  - Para ambiente corporativo de produção, assinar o binário com certificado digital padrão da empresa.

### 4. Perda de Conexão com o Servidor / Offline
- O sistema mantém funcionamento ininterrupto offline graças ao motor de persistência local (`FiscalDatabase` / `LocalPersistenceEngine`).
- As vendas efetuadas em caixa entram na fila de sincronização assíncrona da AGT e serão transmitidas assim que a conectividade for restaurada.
