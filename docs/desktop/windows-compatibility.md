# Matriz de Compatibilidade Windows

## Decisão de Fixação de Versão: Electron 22.3.27

A versão do motor Electron foi fixada estritamente em **`22.3.27`**.

### Justificação Técnica
A partir do Electron 23 (Chromium 110), o projeto Chromium e a Microsoft descontinuaram o suporte a:
- Windows 7 SP1
- Windows 8
- Windows 8.1
- Windows Server 2008 R2 / 2012 / 2012 R2

Em Angola e nos mercados emergentes, uma parcela substancial dos computadores de ponto de venda (POS) e frentes de caixa operam sobre Windows 7 ou Windows 8.1. A versão **Electron 22.3.27** é a última versão oficial a suportar estes sistemas operativos com estabilidade.

## Matriz de Suporte por Sistema Operativo

| Sistema Operativo | Versão NT | Arquitetura | Estado | Observações |
| :--- | :---: | :---: | :---: | :--- |
| **Windows 7 SP1** | NT 6.1 | x64 / x86 | Compatibilidade Prevista | Exige Service Pack 1 e KB2533623 instalados |
| **Windows 8** | NT 6.2 | x64 / x86 | Compatibilidade Prevista | Suportado nativamente pelo Electron 22 |
| **Windows 8.1** | NT 6.3 | x64 / x86 | Compatibilidade Prevista | Suportado nativamente pelo Electron 22 |
| **Windows 10** | NT 10.0 | x64 / x86 | Compatibilidade Validada | Execução estável |
| **Windows 11** | NT 10.0+ | x64 | Compatibilidade Validada | Execução estável |

*Nota sobre validação: Ambientes sem instalação física de Windows 7/8 devem ser considerados "Compatibilidade prevista — não validada em ambiente real".*

## Estratégia Bifurcada: Linha LEGACY vs Linha MODERN

Para manter a longevidade da solução:
- **Linha LEGACY (Atual)**: Electron 22.3.27. Protegida contra atualizações automáticas que quebrem Windows 7.
- **Linha MODERN (Futura)**: Permite que compilações destinadas exclusivamente a Windows 10/11 utilizem versões mais recentes do Electron sem qualquer alteração na base de código do ERP.
