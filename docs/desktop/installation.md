# Guia de Instalação do Kiteke Pro Desktop

## Tipos de Distribuição Disponíveis

O sistema disponibiliza dois formatos de entrega para Windows:

### 1. Instalador Assistido (Kiteke-Pro-Setup.exe)
- Formato: NSIS (Nullsoft Scriptable Install System)
- Local de instalação padrão: `%LOCALAPPDATA%\Programs\Kiteke Pro` (ou personalizável pelo administrador)
- Atalhos gerados:
  - Atalho no Ambiente de Trabalho (Desktop)
  - Atalho no Menu Iniciar / Programas
- Desinstalador: Integrado no painel "Adicionar ou Remover Programas" do Windows.
- Preservação de dados: Os bancos de dados e preferências em `LocalStorage` / `IndexedDB` são preservados durante atualizações.

### 2. Versão Portátil (Kiteke-Pro-Portable.exe)
- Execução direta a partir de qualquer pasta ou pendrive USB.
- Não exige permissões de Administrador do Windows.
- Não efetua alterações no Registo do Windows.

## Requisitos Mínimos de Sistema

- **Processador**: Intel Core i3 / Celeron de 2.0 GHz ou equivalente
- **Memória RAM**: 2 GB (Recomendado: 4 GB para POS de alto tráfego)
- **Espaço em Disco**: 250 MB livres
- **Ecrã**: Resolução mínima de 1024×768 pixels
- **Impressoras**: Compatível com qualquer impressora instalada no Spooler do Windows (ESC/POS 58mm/80mm ou laser/jato de tinta A4).
