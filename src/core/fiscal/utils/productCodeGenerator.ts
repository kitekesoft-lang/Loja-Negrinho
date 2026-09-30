import { Product } from '../types/product';

/**
 * Calcula o dígito de controlo padrão EAN-13 (módulo 10, pesos alternados 1 e 3)
 * em conformidade com as normas GS1 para retalho internacional.
 */
export function calculateEan13CheckDigit(digits12: string): string {
  const clean12 = digits12.replace(/\D/g, '').slice(0, 12).padStart(12, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean12[i], 10);
    // Posições ímpares (0-indexed par: 0, 2, 4...) peso 1; pares (0-indexed ímpar: 1, 3, 5...) peso 3
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const remainder = sum % 10;
  return remainder === 0 ? '0' : String(10 - remainder);
}

/**
 * Gera o próximo ID sequencial de produto (Ex: P009, P010, P011...)
 * que é curto, intuitivo e fácil de digitar no campo de pesquisa do operador.
 */
export function generateNextProductId(products: Product[]): string {
  let maxNum = 0;

  for (const p of products) {
    if (!p) continue;
    // Testa formatos como P001, P008, P009, P100 ou PRD-001
    const pMatch = (p.id || '').match(/^P0*(\d+)$/i) || (p.code || '').match(/^P0*(\d+)$/i);
    if (pMatch) {
      const val = parseInt(pMatch[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }

    const prdMatch = (p.id || '').match(/^PRD-0*(\d+)$/i) || (p.code || '').match(/^PRD-0*(\d+)$/i);
    if (prdMatch) {
      const val = parseInt(prdMatch[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  }

  // Se já temos até 8 produtos (P001 a P008), o próximo será P009
  const nextNum = Math.max(maxNum + 1, 9);
  return `P${String(nextNum).padStart(3, '0')}`;
}

/**
 * Gera um código de barras EAN-13 válido (13 dígitos) com prefixo da loja e dígito de controlo.
 * Baseado na sequência dos artigos existentes (Ex: 5601001000001 a 5601001000008 -> 5601001000096).
 */
export function generateNextBarcode(products: Product[]): string {
  let maxSeq = 8;

  for (const p of products) {
    if (!p || !p.barcode) continue;
    const clean = p.barcode.replace(/\D/g, '');
    if (clean.startsWith('560100100') && clean.length === 13) {
      const seqStr = clean.slice(9, 12);
      const val = parseInt(seqStr, 10);
      if (!isNaN(val) && val > maxSeq) {
        maxSeq = val;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const base12 = `560100100${String(nextSeq).padStart(3, '0')}`;
  const checkDigit = calculateEan13CheckDigit(base12);
  return `${base12}${checkDigit}`;
}

/**
 * Valida se um código de barras EAN-13 é matematicamente consistente
 */
export function isValidEan13(barcode: string): boolean {
  const clean = barcode.replace(/\D/g, '');
  if (clean.length !== 13) return false;
  const base12 = clean.slice(0, 12);
  const check = clean[12];
  return calculateEan13CheckDigit(base12) === check;
}
