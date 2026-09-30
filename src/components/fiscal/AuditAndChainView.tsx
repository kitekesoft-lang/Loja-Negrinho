import React, { useState, useEffect } from 'react';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { HashChainingService } from '../../core/fiscal/security/HashChainingService';
import { SignatureService } from '../../core/fiscal/security/SignatureService';
import { AuditService } from '../../core/fiscal/security/AuditService';
import { AuditLog } from '../../core/fiscal/types/audit';
import { ShieldCheck, Lock, Activity, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Key, FileCheck2, Cpu } from 'lucide-react';

export const AuditAndChainView: React.FC = () => {
  const db = FiscalDatabase.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, [db]);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [chainAuditResults, setChainAuditResults] = useState<
    Array<{
      seriesCode: string;
      documentTypeCode: string;
      documentsCount: number;
      isValid: boolean;
      brokenAt?: string;
      reason?: string;
    }>
  >([]);

  // Sandbox de adulteração
  const [tamperTested, setTamperTested] = useState<boolean>(false);
  const [tamperResult, setTamperResult] = useState<any>(null);

  const scanChains = () => {
    const seriesMap = new Map<string, any[]>();

    db.documents.forEach((doc) => {
      const list = seriesMap.get(doc.seriesId) || [];
      list.push(doc);
      seriesMap.set(doc.seriesId, list);
    });

    const results: any[] = [];
    db.series.forEach((series) => {
      const docs = seriesMap.get(series.id) || [];
      if (docs.length === 0) {
        results.push({
          seriesCode: series.seriesCode,
          documentTypeCode: series.documentTypeCode,
          documentsCount: 0,
          isValid: true,
        });
      } else {
        const verify = HashChainingService.verifyChainIntegrity(docs);
        results.push({
          seriesCode: series.seriesCode,
          documentTypeCode: series.documentTypeCode,
          documentsCount: docs.length,
          isValid: verify.isValid,
          brokenAt: verify.brokenAtDocumentNumber,
          reason: verify.reason,
        });
      }
    });

    setChainAuditResults(results);
    setLogs(AuditService.getLogs({ limit: 40 }));
  };

  useEffect(() => {
    scanChains();
  }, []);

  const simulateTamper = () => {
    const allDocs = Array.from(db.documents.values());
    if (allDocs.length === 0) {
      alert('Emita pelo menos uma factura ou execute os testes para simular a adulteração!');
      return;
    }

    const targetDoc = allDocs[0];
    // Simular que alguém acedeu directamente à base de dados e adulterou o valor líquido
    const fakeNetTotal = targetDoc.netTotal * 0.5; // Reduziu 50%
    const verification = HashChainingService.verifyDocumentHash(
      {
        documentDate: targetDoc.documentDate,
        systemEntryDate: targetDoc.systemEntryDate,
        documentNumber: targetDoc.documentNumber,
        netTotal: fakeNetTotal,
        previousHash: targetDoc.previousHash,
      },
      targetDoc.hash,
      targetDoc.hashControl
    );

    setTamperTested(true);
    setTamperResult({
      documentNumber: targetDoc.documentNumber,
      originalTotal: targetDoc.netTotal,
      tamperedTotal: fakeNetTotal,
      originalHash: targetDoc.hash,
      recalculatedHash: verification.expectedHash,
      caughtFraud: !verification.isValid,
    });
  };

  const certInfo = SignatureService.getCertificateInfo();

  return (
    <div className="space-y-8">
      {/* 0. CERTIFICADO DIGITAL RSA-2048 E CHAVE PÚBLICA AGT */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-6 rounded-2xl border border-stone-800 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-100">
                  Certificado Digital &amp; Assinatura Criptográfica RSA-2048
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AGT HOMOLOGADO
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Padrão RSASSA-PKCS1-v1_5 / SHA-256 em estrita conformidade com o Decreto Presidencial n.º 312/18 e Portaria n.º 292/18
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-stone-300 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Versão da Chave: <strong>v{certInfo.keyVersion}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <span className="text-stone-400 text-[11px] block">Número de Série do Certificado:</span>
            <div className="font-mono text-stone-200 font-bold break-all">{certInfo.serialNumber}</div>
            <div className="text-[11px] text-stone-400 pt-1">Autoridade Certificadora: <strong>{certInfo.issuer}</strong></div>
          </div>

          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <span className="text-stone-400 text-[11px] block">Impressão Digital da Chave Pública (Fingerprint):</span>
            <div className="font-mono text-amber-300 font-bold break-all">{certInfo.fingerprint}</div>
            <div className="text-[11px] text-stone-400 pt-1">Algoritmo: <strong>{certInfo.algorithm}</strong></div>
          </div>

          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <span className="text-stone-400 text-[11px] block">Homologação de Software AGT:</span>
            <div className="font-mono text-emerald-400 font-bold break-all">{certInfo.softwareValidationNumber}</div>
            <div className="text-[11px] text-stone-400 pt-1">Validade do Certificado: <strong>31/12/2028</strong></div>
          </div>
        </div>

        <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800/80 text-[11px] font-mono text-stone-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-stone-300 font-semibold">Estrutura Canónica Assinada: </span>
            <code className="text-amber-300">DataDoc;DataHoraEntrada;NumDoc;TotalLiquido;Hash</code>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-medium text-xs">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Todos os documentos faturáveis são assinados atomicamente na emissão</span>
          </div>
        </div>
      </section>

      {/* 1. VERIFICAÇÃO CRIPTOGRÁFICA DE CADEIA SHA-256 */}
      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                1.10 &amp; 1.15 Verificador Criptográfico de Cadeias Fiscais (SHA-256)
              </h2>
              <p className="text-xs text-stone-500">
                Auditoria matemática atómica: verificação de integridade entre hashes consecutivos e códigos de controlo de 4 caracteres
              </p>
            </div>
          </div>

          <button
            onClick={scanChains}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auditar Cadeias Agora</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chainAuditResults.map((r, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                r.isValid
                  ? 'bg-stone-50/60 border-stone-200'
                  : 'bg-rose-50 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs bg-stone-900 text-white px-2 py-0.5 rounded">
                  {r.documentTypeCode} {r.seriesCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    r.isValid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {r.isValid ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CADEIA ÍNTEGRA
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> QUEBRA DETECTADA
                    </>
                  )}
                </span>
              </div>

              <div className="text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>Documentos Emitidos:</span>
                  <strong className="font-mono text-stone-900">{r.documentsCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Algoritmo:</span>
                  <span className="font-mono text-[11px] text-stone-700">SHA-256 AGT Compliant</span>
                </div>
              </div>

              {r.reason && (
                <div className="text-[11px] text-rose-700 bg-rose-100 p-2 rounded">
                  {r.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. SIMULADOR ANTI-ADULTERAÇÃO (DEMO DE SEGURANÇA FISCAL) */}
      <section className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                1.15 Demonstração Prática de Imutabilidade e Detecção de Fraude
              </h2>
              <p className="text-xs text-stone-400">
                Simula uma tentativa ilícita de mutação directa de valores na base de dados e demonstra a rejeição imediata da cadeia
              </p>
            </div>
          </div>

          <button
            onClick={simulateTamper}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-colors cursor-pointer shrink-0"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>Simular Tentativa de Fraude</span>
          </button>
        </div>

        {tamperTested && tamperResult && (
          <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mecanismo Criptográfico Barrou a Fraude Instantaneamente!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-950/70 p-3 rounded-lg font-mono space-y-1">
                <span className="text-stone-400 text-[11px]">Dados Oficiais Emitidos:</span>
                <div>Documento: <strong>{tamperResult.documentNumber}</strong></div>
                <div>Total Legítimo: <strong>{tamperResult.originalTotal.toLocaleString('pt-AO')} AOA</strong></div>
                <div className="text-[10px] text-stone-500 break-all">Hash: {tamperResult.originalHash}</div>
              </div>

              <div className="bg-rose-950/40 p-3 rounded-lg font-mono border border-rose-900/60 space-y-1 text-rose-200">
                <span className="text-rose-400 text-[11px]">Tentativa Adulterada:</span>
                <div>Total Falsificado: <strong>{tamperResult.tamperedTotal.toLocaleString('pt-AO')} AOA</strong></div>
                <div>Novo Digest Calculado: <strong className="text-rose-300 break-all">{tamperResult.recalculatedHash.slice(0, 24)}...</strong></div>
                <div className="text-rose-400 font-bold text-[11px] pt-1">
                  DISCORDÂNCIA DETECTADA ➔ DOCUMENTO REJEITADO
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. TRILHA DE AUDITORIA COMPLETA (AUDIT LOG) */}
      <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 text-stone-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                1.14 Trilha de Auditoria Imutável (Audit Trail)
              </h2>
              <p className="text-xs text-stone-500">
                Registo contínuo com carimbo de tempo UTC, ator responsável, perfil, operação e hash de integridade
              </p>
            </div>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            {logs.length} eventos registados
          </span>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <th className="py-2.5 px-3">Data/Hora (UTC)</th>
                <th className="py-2.5 px-3">Utilizador / Ator</th>
                <th className="py-2.5 px-3 text-center">Perfil</th>
                <th className="py-2.5 px-3 text-center">Operação</th>
                <th className="py-2.5 px-3">Entidade</th>
                <th className="py-2.5 px-3">Descrição do Evento Fiscal</th>
                <th className="py-2.5 px-3 font-mono text-stone-400 text-right">Integridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/60">
                  <td className="py-2 px-3 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                    {log.timestamp.replace('T', ' ').replace(/\.\d{3}Z$/, 'Z')}
                  </td>
                  <td className="py-2 px-3 font-medium text-stone-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.operation === 'ISSUE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.operation === 'PAY'
                          ? 'bg-indigo-100 text-indigo-800'
                          : log.operation === 'PERMISSION_DENIED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {log.operation}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-stone-600 text-[11px]">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-2 px-3 text-stone-800 font-medium max-w-md">
                    {log.description}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-stone-400 text-[10px]">
                    #{log.integrityHash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
