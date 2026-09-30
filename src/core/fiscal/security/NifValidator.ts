/**
 * Validador de NIF Angolano (Pessoas Singulares, Colectivas e Consumidor Final)
 * Conforme regras da AGT (Administração Geral Tributária de Angola)
 */
export interface NifValidationResult {
  isValid: boolean;
  type: 'CONSUMIDOR_FINAL' | 'PESSOA_COLECTIVA' | 'PESSOA_SINGULAR' | 'ESTRANGEIRO' | 'INVALIDO';
  formatted: string;
  errorMessage?: string;
}

export class NifValidator {
  /**
   * Valida NIF conforme regras fiscais angolanas
   * @param nif String do NIF
   * @param country Código do país (ex: 'AO')
   */
  static validate(nif: string, country: string = 'AO'): NifValidationResult {
    if (!nif) {
      return {
        isValid: false,
        type: 'INVALIDO',
        formatted: '',
        errorMessage: 'O NIF não pode ser vazio.',
      };
    }

    const cleanNif = nif.trim().toUpperCase().replace(/[\s\-\/\.]/g, '');

    // Se for estrangeiro
    if (country && country !== 'AO') {
      if (cleanNif.length >= 3 && cleanNif.length <= 25) {
        return {
          isValid: true,
          type: 'ESTRANGEIRO',
          formatted: cleanNif,
        };
      }
      return {
        isValid: false,
        type: 'INVALIDO',
        formatted: cleanNif,
        errorMessage: 'NIF de entidade estrangeira inválido (deve ter entre 3 e 25 caracteres).',
      };
    }

    // 1. Consumidor Final genérico: 999999999
    if (cleanNif === '999999999') {
      return {
        isValid: true,
        type: 'CONSUMIDOR_FINAL',
        formatted: '999999999',
      };
    }

    // 2. Pessoa Colectiva (Empresa em Angola): 10 dígitos numéricos, normalmente iniciado por 5
    // Ex: 5417082341
    if (/^\d{10}$/.test(cleanNif)) {
      const firstDigit = cleanNif[0];
      if (firstDigit === '5') {
        return {
          isValid: true,
          type: 'PESSOA_COLECTIVA',
          formatted: cleanNif,
        };
      } else if (firstDigit === '0' || firstDigit === '1' || firstDigit === '2') {
        // NIFs numéricos singulares atribuídos pela AGT
        return {
          isValid: true,
          type: 'PESSOA_SINGULAR',
          formatted: cleanNif,
        };
      } else {
        // NIF de 10 dígitos válido
        return {
          isValid: true,
          type: 'PESSOA_COLECTIVA',
          formatted: cleanNif,
        };
      }
    }

    // 3. Pessoa Singular via Bilhete de Identidade (BI Angolano):
    // Formato: 9 dígitos + 2 letras + 3 dígitos (ex: 004521345LA042) -> 14 caracteres
    if (/^\d{9}[A-Z]{2}\d{3}$/.test(cleanNif)) {
      return {
        isValid: true,
        type: 'PESSOA_SINGULAR',
        formatted: cleanNif,
      };
    }

    // Formato alternativo de 9 dígitos numéricos
    if (/^\d{9}$/.test(cleanNif)) {
      return {
        isValid: true,
        type: 'PESSOA_SINGULAR',
        formatted: cleanNif,
      };
    }

    return {
      isValid: false,
      type: 'INVALIDO',
      formatted: cleanNif,
      errorMessage:
        'Formato de NIF angolano inválido. Deve ser 10 dígitos numéricos (Empresa), 14 caracteres (BI Angolano ex: 004521345LA042) ou 999999999 (Consumidor Final).',
    };
  }
}
