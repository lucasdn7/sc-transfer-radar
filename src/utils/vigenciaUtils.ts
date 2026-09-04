/**
 * Utilitários para cálculo de status de vigência de processos
 * 
 * Esta lógica é compartilhada entre o Mapa e a tela de Alertas e vencimentos
 * para garantir consistência no cálculo de vigência.
 */

export type VigenciaStatus = 'all' | 'vigentes' | 'proximos' | 'vencidos' | 'concluidas';
export type AlertCategory = 'all' | 'vencidos' | 'ate_7_dias' | 'ate_30_dias' | 'ate_90_dias' | 'sem_prazo' | 'concluidas';

/**
 * Calcula o status de vigência baseado na data de vigência e se está finalizado
 * 
 * @param vigenciaDate - Data de vigência do processo (string ISO)
 * @param isFinished - Indica se o processo está finalizado
 * @returns Status da vigência
 */
export function getVigenciaStatus(vigenciaDate?: string, isFinished?: boolean): VigenciaStatus {
  if (isFinished) return 'concluidas';
  if (!vigenciaDate) return 'vigentes';
  
  const today = new Date();
  const date = new Date(vigenciaDate);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'vencidos';
  if (diffDays <= 30) return 'proximos';
  return 'vigentes';
}

/**
 * Calcula a categoria de alerta baseada na data de vigência
 * 
 * @param vigenciaDate - Data de vigência do processo (string ISO)
 * @param isFinished - Indica se o processo está finalizado
 * @returns Categoria de alerta
 */
export function getAlertCategory(vigenciaDate?: string, isFinished?: boolean): AlertCategory {
  if (isFinished) return 'concluidas';
  if (!vigenciaDate) return 'sem_prazo';
  
  const today = new Date();
  const date = new Date(vigenciaDate);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'vencidos';
  if (diffDays <= 7) return 'ate_7_dias';
  if (diffDays <= 30) return 'ate_30_dias';
  if (diffDays <= 90) return 'ate_90_dias';
  return 'sem_prazo'; // Vigentes com mais de 90 dias
}

/**
 * Retorna a cor do marcador baseado no status de vigência
 * 
 * @param vigenciaDate - Data de vigência do processo (string ISO)
 * @param isFinished - Indica se o processo está finalizado
 * @returns Cor em formato hexadecimal
 */
export function getVigenciaMarkerColor(vigenciaDate?: string, isFinished?: boolean): string {
  if (isFinished) return '#3b82f6'; // azul para concluídas
  const status = getVigenciaStatus(vigenciaDate, false);
  if (status === 'vencidos') return '#ef4444';
  if (status === 'proximos') return '#f59e0b';
  return '#10b981';
}

/**
 * Retorna o rótulo legível do status de vigência
 * 
 * @param status - Status da vigência
 * @returns Rótulo em português
 */
export function getVigenciaStatusLabel(status: VigenciaStatus): string {
  const labels: Record<VigenciaStatus, string> = {
    all: 'Todas',
    vigentes: 'Vigentes',
    proximos: 'Próximo ao vencimento (≤ 30 dias)',
    vencidos: 'Vencidas',
    concluidas: 'Concluídas',
  };
  return labels[status];
}

/**
 * Retorna o rótulo legível da categoria de alerta
 * 
 * @param category - Categoria de alerta
 * @returns Rótulo em português
 */
export function getAlertCategoryLabel(category: AlertCategory): string {
  const labels: Record<string, string> = {
    all: 'Todas',
    vencidos: 'Vencidos',
    ate_7_dias: 'Vencendo em até 7 dias',
    ate_30_dias: 'Vencendo em até 30 dias',
    ate_90_dias: 'Vencendo em até 90 dias',
    sem_prazo: 'Sem prazo informado',
    concluidas: 'Concluídos',
  };
  return labels[category];
}
