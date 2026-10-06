# Arquitetura Kiteke Pro Desktop Shell

## Visão Geral

O **Kiteke Pro Desktop** é arquitetado como uma camada de encapsulamento nativo (*Desktop Shell*) sobre a aplicação empresarial existente, preservando integralmente todas as regras de negócio, o motor fiscal da AGT, a persistência de dados e a interface visual.

```
KITEKE PRO
    │
    ├── ERP EXISTENTE
    │    ├── Gestão de Vendas (POS)
    │    ├── Gestão de Stocks & Inventário
    │    ├── Restauração & Mesas
    │    ├── Ordens de Serviço & Assistência Técnica
    │    ├── Recursos Humanos & Folha Salarial (Lei 28/20)
    │    └── Importador Universal SAF-T (AO)
    │
    ├── Fiscal Engine (AGT)
    │    ├── Assinatura Digital RSA-2048 & SHA-256
    │    ├── Encadeamento de Hashes (Portaria n.º 292/18)
    │    └── Código QR Fiscal Canónico AGT
    │
    ├── AGT Connector & AGT Security
    │    ├── Transmissão Assíncrona & Fila AGT
    │    └── Ficheiro SAF-T (AO) XML
    │
    └── Interface React 19 / Tailwind CSS
             │
             ▼
      ELECTRON DESKTOP SHELL (v22.3.27)
             │
             ├── Main Process (electron/main/main.cjs)
             │    ├── Window Manager (window.cjs)
             │    ├── Security Guard (security.cjs)
             │    └── Updater Architecture (updater.cjs)
             │
             ├── Preload Bridge (electron/preload/preload.cjs)
             │    └── contextBridge (window.electronAPI)
             │
             ├── Windows Services (electron/services/)
             │    ├── Printer Service (Térmicas 58mm/80mm e A4)
             │    ├── Filesystem & PDF Service
             │    ├── Network Monitor
             │    └── System Diagnostic
             │
             ▼
      SISTEMA OPERATIVO WINDOWS
      (Windows 7, Windows 8, Windows 8.1, Windows 10, Windows 11)
```

## Princípios de Design

1. **Não-Destrutivo**: O Electron não substitui nem altera os motores fiscais ou comerciais do ERP.
2. **Context Isolation**: Isolamento total entre o processo de renderização e o ambiente Node.js.
3. **IPC Estritamente Validado**: Comunicação controlada por lista branca de canais permitidos (`ALLOWED_IPC_CHANNELS`).
4. **Sem Credenciais no Renderer**: Chaves criptográficas de licença e credenciais fiscais continuam geridas pelos seus módulos seguros originais.
5. **Instância Única**: Prevenção ativa de múltiplas instâncias concorrentes no Windows através de `app.requestSingleInstanceLock()`.
