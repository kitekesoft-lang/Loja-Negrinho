# Procedimento de Lançamento (Release Process)

## Checklist de Pré-Lançamento

1. [ ] Verificar conformidade fiscal executando a suite de 21 testes AGT (`FiscalTestSuite.runAll()`).
2. [ ] Validar integridade do ficheiro `package.json` mantendo a versão de `electron` fixada em `22.3.27`.
3. [ ] Executar `npm run lint` para garantir zero erros de compilação TypeScript.
4. [ ] Executar `npm run desktop:build:win:x64` para gerar o instalador `Kiteke-Pro-Setup-x64.exe` e a versão portátil `Kiteke-Pro-Portable-x64.exe`.
5. [ ] Verificar se os ficheiros de saída na pasta `/release` possuem os metadados corretos:
   - Nome do Produto: **Kiteke Pro**
   - Fabricante: **KitekeSoft**
   - Ícone oficial aplicado

## Estrutura de Artefatos Gerados

```
/release
  ├── Kiteke-Pro-Setup-x64.exe          (Instalador NSIS completo)
  ├── Kiteke-Pro-Portable-x64.exe       (Versão Portátil sem instalação)
  └── win-unpacked/                     (Pasta de binários desempacotados para validação)
```
