import { DocumentSeries, FiscalDocumentTypeCode } from '../types/series';

export interface SeriesAllocationResult {
  seriesId: string;
  documentTypeCode: FiscalDocumentTypeCode;
  seriesCode: string;
  fiscalYear: number;
  sequentialNumber: number;
  formattedDocumentNumber: string; // e.g. "FT A2026/000001"
}

export class DocumentSeriesEngine {
  // Lock atómico por ID de série para evitar colisões em concorrência
  private static seriesLocks: Map<string, boolean> = new Map();

  /**
   * Formata o número fiscal padrão angolano (ex: FT A2026/000001)
   */
  static formatDocumentNumber(
    documentTypeCode: FiscalDocumentTypeCode,
    seriesCode: string,
    sequence: number
  ): string {
    const padded = String(sequence).padStart(6, '0');
    return `${documentTypeCode} ${seriesCode}/${padded}`;
  }

  /**
   * Aloca de forma atómica e sequencial o próximo número da série
   */
  static allocateNextNumber(series: DocumentSeries): SeriesAllocationResult {
    if (!series.isActive) {
      throw new Error(`A série fiscal '${series.seriesCode}' (${series.documentTypeCode}) encontra-se INACTIVA.`);
    }

    if (series.isClosed) {
      throw new Error(`A série fiscal '${series.seriesCode}' (${series.documentTypeCode}) encontra-se ENCERRADA para emissão fiscal.`);
    }

    // Verificar ano fiscal
    const currentYear = new Date().getFullYear();
    if (series.fiscalYear !== currentYear) {
      // Aviso ou validação de exercício fiscal
    }

    // Simulação de trava atómica em memória
    if (this.seriesLocks.get(series.id)) {
      throw new Error(`Concorrência detectada: a série '${series.seriesCode}' está presentemente bloqueada por outra transacção.`);
    }

    try {
      this.seriesLocks.set(series.id, true);

      // Incremento atómico estrito sem salto/furo
      const nextSequence = series.currentSequence + 1;
      series.currentSequence = nextSequence;
      series.updatedAt = new Date().toISOString();

      const formattedDocumentNumber = this.formatDocumentNumber(
        series.documentTypeCode,
        series.seriesCode,
        nextSequence
      );

      return {
        seriesId: series.id,
        documentTypeCode: series.documentTypeCode,
        seriesCode: series.seriesCode,
        fiscalYear: series.fiscalYear,
        sequentialNumber: nextSequence,
        formattedDocumentNumber,
      };
    } finally {
      this.seriesLocks.delete(series.id);
    }
  }

  /**
   * Valida se um número de documento fiscal respeita a sintaxe e a série
   */
  static parseDocumentNumber(documentNumber: string): {
    documentTypeCode: string;
    seriesCode: string;
    sequence: number;
  } | null {
    // Ex: "FT A2026/000001"
    const regex = /^([A-Z]{2})\s+([A-Z0-9_\-]+)\/(\d+)$/;
    const match = documentNumber.trim().match(regex);
    if (!match) return null;

    return {
      documentTypeCode: match[1],
      seriesCode: match[2],
      sequence: parseInt(match[3], 10),
    };
  }
}
