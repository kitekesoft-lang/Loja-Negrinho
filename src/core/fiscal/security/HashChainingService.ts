/**
 * Implementação pura e determinística de SHA-256
 * Compatível com todos os ambientes (Navegador, Node.js, Web Workers)
 * sem dependências externas.
 */
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  // Constantes iniciais do hash (primeiros 32 bits das partes fraccionárias das raízes quadradas dos primeiros 8 primos)
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // Constantes da rodada (primeiros 32 bits das partes fraccionárias das raízes cúbicas dos primeiros 64 primos)
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // UTF-8 encoding & padding
  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w: number[] = [];
    for (j = 0; j < 16; j++) {
      w[j] = words[i + j] || 0;
    }
    for (j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export interface ChainedHashPayload {
  documentDate: string; // YYYY-MM-DD
  systemEntryDate: string; // ISO 8601 YYYY-MM-DDTHH:mm:ss
  documentNumber: string; // ex: 'FT A2026/000001'
  netTotal: number; // ex: 125000.00
  previousHash: string; // Hash do documento imediatamente anterior na série (ou "" se for o 1º)
}

export interface HashGenerationResult {
  hash: string;
  previousHash: string;
  hashControl: string; // 4 caracteres oficiais para impressão (posições 11, 21, 31, 41)
  rawSourceString: string;
}

export class HashChainingService {
  /**
   * Função utilitária SHA-256 criptográfica determinística pura
   */
  static sha256(ascii: string): string {
    return sha256(ascii);
  }

  /**
   * Constrói a representação canónica fiscal para encadeamento
   * Formato oficial AGT:
   * DataDocumento;DataHoraCriacaoSistema;NumeroDocumento;TotalDocumento;HashAnterior
   */
  static buildSourceString(payload: ChainedHashPayload): string {
    const formattedDate = payload.documentDate.split('T')[0];
    const formattedTotal = Number(payload.netTotal).toFixed(2);
    const prev = payload.previousHash || '';

    return `${formattedDate};${payload.systemEntryDate};${payload.documentNumber};${formattedTotal};${prev}`;
  }

  /**
   * Calcula o hash criptográfico do documento fiscal e extrai o código de controlo de 4 caracteres
   */
  static generateDocumentHash(payload: ChainedHashPayload): HashGenerationResult {
    const rawSourceString = this.buildSourceString(payload);
    const fullHash = sha256(rawSourceString);

    // Extrair caracteres nas posições 11, 21, 31, 41 (1-indexed, logo índices 10, 20, 30, 40)
    // Se por algum motivo o hash for menor (não é), fallback seguro
    const c1 = fullHash.charAt(10) || '0';
    const c2 = fullHash.charAt(20) || '0';
    const c3 = fullHash.charAt(30) || '0';
    const c4 = fullHash.charAt(40) || '0';
    const hashControl = (c1 + c2 + c3 + c4).toUpperCase();

    return {
      hash: fullHash,
      previousHash: payload.previousHash || '',
      hashControl,
      rawSourceString,
    };
  }

  /**
   * Valida a integridade matemática da cadeia entre o documento actual e o anterior
   */
  static verifyDocumentHash(
    doc: ChainedHashPayload,
    claimedHash: string,
    claimedHashControl: string
  ): { isValid: boolean; expectedHash: string; expectedControl: string } {
    const result = this.generateDocumentHash(doc);
    const isHashValid = result.hash.toLowerCase() === claimedHash.toLowerCase();
    const isControlValid = result.hashControl.toUpperCase() === claimedHashControl.toUpperCase();

    return {
      isValid: isHashValid && isControlValid,
      expectedHash: result.hash,
      expectedControl: result.hashControl,
    };
  }

  /**
   * Valida uma cadeia sequencial completa de documentos fiscais de uma série
   */
  static verifyChainIntegrity(
    documents: Array<{
      documentDate: string;
      systemEntryDate: string;
      documentNumber: string;
      netTotal: number;
      hash: string;
      previousHash: string;
      hashControl: string;
      sequentialNumber: number;
    }>
  ): {
    isValid: boolean;
    brokenAtDocumentNumber?: string;
    reason?: string;
  } {
    // Ordenar por sequentialNumber
    const sorted = [...documents].sort((a, b) => a.sequentialNumber - b.sequentialNumber);

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const expectedPrevHash = i === 0 ? '' : sorted[i - 1].hash;

      // Verificar encadeamento do previousHash
      if (current.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          brokenAtDocumentNumber: current.documentNumber,
          reason: `Quebra de cadeia: o previousHash registado (${current.previousHash.slice(0, 10)}...) não coincide com o hash do documento anterior (${expectedPrevHash.slice(0, 10)}...).`,
        };
      }

      // Verificar recálculo do hash do documento actual
      const verification = this.verifyDocumentHash(
        {
          documentDate: current.documentDate,
          systemEntryDate: current.systemEntryDate,
          documentNumber: current.documentNumber,
          netTotal: current.netTotal,
          previousHash: current.previousHash,
        },
        current.hash,
        current.hashControl
      );

      if (!verification.isValid) {
        return {
          isValid: false,
          brokenAtDocumentNumber: current.documentNumber,
          reason: `Adulteração detectada: os dados do documento ${current.documentNumber} foram modificados após a emissão fiscal. Hash esperado: ${verification.expectedHash}, registado: ${current.hash}.`,
        };
      }
    }

    return { isValid: true };
  }
}
