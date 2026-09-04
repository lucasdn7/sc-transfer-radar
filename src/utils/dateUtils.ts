/**
 * Utilitários para formatação de datas com tratamento de datas inválidas
 * 
 * Este helper garante que datas inválidas ou ausentes sejam exibidas de forma
 * compreensível ao usuário, sem alterar os dados de origem.
 */

import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição, tratando datas inválidas
 * 
 * @param dateString - String de data em formato ISO ou null/undefined
 * @param formatStr - Formato desejado (padrão: 'dd/MM/yyyy')
 * @returns Data formatada ou "Data não informada" se inválida
 */
export function formatDateDisplay(dateString: string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!dateString) {
    return 'Data não informada';
  }

  try {
    const date = parseISO(dateString);
    
    // Verifica se a data é válida e não é uma data padrão como 01/01/1970
    if (!isValid(date)) {
      return 'Data não informada';
    }

    // Verifica se é uma data muito antiga (provavelmente placeholder)
    const timestamp = date.getTime();
    const minValidTimestamp = new Date('1970-01-02').getTime(); // 02/01/1970 como mínimo
    
    if (timestamp < minValidTimestamp) {
      return 'Data não informada';
    }

    return format(date, formatStr, { locale: ptBR });
  } catch (error) {
    return 'Data não informada';
  }
}

/**
 * Formata uma data completa com hora para exibição
 * 
 * @param dateString - String de data em formato ISO ou null/undefined
 * @returns Data formatada com hora ou "Data não informada" se inválida
 */
export function formatDateTimeDisplay(dateString: string | null | undefined): string {
  return formatDateDisplay(dateString, "dd/MM/yyyy' às 'HH:mm");
}

/**
 * Calcula os dias até uma data de vigência
 * 
 * @param dateString - String de data em formato ISO ou null/undefined
 * @returns Número de dias (positivo para futuro, negativo para passado) ou null se inválida
 */
export function getDaysUntilDate(dateString: string | null | undefined): number | null {
  if (!dateString) {
    return null;
  }

  try {
    const date = parseISO(dateString);
    
    if (!isValid(date)) {
      return null;
    }

    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return null;
  }
}

/**
 * Retorna uma descrição legível do tempo até uma data
 * 
 * @param dateString - String de data em formato ISO ou null/undefined
 * @returns Descrição em português (ex: "Vence em 5 dias", "Vencido há 3 dias")
 */
export function getTimeUntilDescription(dateString: string | null | undefined): string {
  const days = getDaysUntilDate(dateString);
  
  if (days === null) {
    return 'Prazo não informado';
  }

  if (days < 0) {
    const absDays = Math.abs(days);
    return absDays === 1 ? 'Vencido há 1 dia' : `Vencido há ${absDays} dias`;
  }

  if (days === 0) {
    return 'Vence hoje';
  }

  if (days === 1) {
    return 'Vence em 1 dia';
  }

  return `Vence em ${days} dias`;
}
