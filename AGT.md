# AGT.md — Arquitectura de Integração AGT (Fase 2)

## 1. Princípios da Comunicação com a AGT

A comunicação com os Web Services da Administração Geral Tributária (AGT) é centralizada no `AGTConnector`, desacoplado do `InvoiceEngine`.

```text
┌─────────────────┐      Assinado (J-Hash / RSA)     ┌──────────────┐
│  InvoiceEngine  ├─────────────────────────────────►│ AGTConnector │
└─────────────────┘                                  └──────┬───────┘
                                                            │ Fila Assíncrona
                                                     ┌──────▼───────┐
                                                     │  AGT Worker  │
                                                     └──────┬───────┘
                                                            │ HTTPS / TLS 1.3
                                                     ┌──────▼───────┐
                                                     │ AGT Gateway  │
                                                     │ (Homol/Prod) │
                                                     └──────────────┘
```

## 2. Ambientes Isolados
- `HOMOLOGATION`: Endpoint de testes da AGT para validação técnica e certificação.
- `PRODUCTION`: Endpoint oficial da AGT para comunicação fiscal vinculativa.
- Travas de segurança: O sistema proíbe emissão de credenciais de produção sob URL de homologação e vice-versa.

## 3. Gestão Segura de Chaves e Assinatura Digital
- Par de chaves assimétricas RSA (mínimo 2048-bit / SHA-256).
- A chave privada é armazenada em cofre de segredos cifrado em repouso (KMS ou variável de ambiente protegida no servidor) e **nunca** é registada em ficheiros de log ou enviada para o cliente web.
- O `SignatureService` executa a assinatura da mensagem XML/JSON de acordo com a especificação técnica vigente.

## 4. Idempotência e Tratamento de Excepções
- **Chave de Idempotência**: Formada por `Hash(CompanyNIF + Series + DocumentNumber + SystemEntryDate)`.
- **Fila de Envio e Fallback Offline**:
  - Emissão no ERP conclui com estado `ISSUED` e marcação `PENDING_AGT`.
  - Worker assíncrono envia o payload à AGT.
  - Respostas HTTP 200 não implicam aceitação imediata sem verificação do código de resultado no corpo XML/JSON da AGT.
  - Estados finais: `ACCEPTED_AGT`, `REJECTED_AGT` (com código e mensagem de erro catalogada) ou `RETRY_SCHEDULED` com recuo exponencial (backoff exponencial com jitter).
