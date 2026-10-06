# Processo de Compilação & Empacotamento Desktop

## Comandos Disponíveis

Os comandos estão parametrizados via `package.json`:

```bash
# 1. Modo de Desenvolvimento Desktop
npm run desktop:dev

# 2. Empacotamento Completo para Windows (x64 e x86)
npm run desktop:build

# 3. Empacotamento Exclusivo para Windows 64-bit
npm run desktop:build:win:x64

# 4. Empacotamento Exclusivo para Windows 32-bit (x86)
npm run desktop:build:win:x86

# 5. Gerar pasta desempacotada para testes locais imediatos
npm run desktop:package
```

## Etapas do Processo de Build

1. **Compilação do Frontend**: O Vite compila a aplicação React em `/dist` com caminhos relativos (`base: './'`).
2. **Validação de Tipos**: `npm run lint` assegura ausência de erros TypeScript.
3. **Empacotamento Electron**: O `electron-builder` consolida o binário do Electron 22.3.27, anexa o ícone oficial e gera o instalador NSIS e a versão Portable na pasta `/release`.
