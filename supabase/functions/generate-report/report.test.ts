import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortRows, normalizeEvent, normalizeProcess, parseRequestBody, summarize, vigenciaStatus } from './report.ts';

test('aceita relatório válido com filtros permitidos', () => {
  const result = parseRequestBody(JSON.stringify({
    report_type: 'financial',
    format: 'json',
    filters: { municipality_ids: [1, 2], region_name: 'Grande Florianópolis', status_names: ['Em Execução'] },
    fields: ['process_number', 'total_paid'],
  }));
  assert.equal('status' in result, false);
  if (!('status' in result)) assert.deepEqual(result.filters?.municipality_ids, [1, 2]);
});

test('rejeita SQL, campos desconhecidos e limites adulterados', () => {
  assert.deepEqual(parseRequestBody(JSON.stringify({ report_type: 'custom', sql: 'select * from users' })), { status: 400 });
  assert.deepEqual(parseRequestBody(JSON.stringify({ report_type: 'custom', fields: ['password'] })), { status: 400 });
  assert.deepEqual(parseRequestBody(JSON.stringify({ report_type: 'custom', filters: { municipality_ids: [0] } })), { status: 400 });
});

test('classifica vigências em categorias estáveis', () => {
  const now = new Date('2026-09-29T12:00:00Z');
  assert.equal(vigenciaStatus(null, null, now), 'sem_prazo');
  assert.equal(vigenciaStatus('2026-09-28', null, now), 'vencidos');
  assert.equal(vigenciaStatus('2026-10-05', null, now), 'ate_7_dias');
  assert.equal(vigenciaStatus('2026-11-15', null, now), 'ate_60_dias');
});

test('normaliza parcelas e calcula pago e saldo', () => {
  const row = normalizeProcess({
    id: 10, process_number: 'SC-10', object: 'Obra', categoria: 'obra', total_portaria_value: 1000,
    total_concedente_value: 900, total_proponente_value: 100, contrato_assinado: true,
    created_at: '2026-01-01', vigencia_date: '2026-12-31', municipalities: { name: 'Florianópolis', regioes: { nome: 'Capital' } },
    regional_nuclei: { name: 'Núcleo 1' }, status_processos: { nome: 'Em Execução' },
    process_parcels: [{ value: 300, payment_date: '2026-02-01' }, { value: 700, payment_date: null }],
  }, new Date('2026-09-29T12:00:00Z'));
  assert.equal(row.total_paid, 300);
  assert.equal(row.balance, 700);
  assert.equal(row.paid_parcel_count, 1);
});

test('normaliza eventos sem depender de uma relação inexistente com núcleos regionais', () => {
  const row = normalizeEvent({
    id: 11,
    numero_processo: 'EV-11',
    objeto: 'Evento cultural',
    municipio_nome: 'Lages',
    nucleo_origem_texto: 'Núcleo Serrano',
    foi_pago: false,
    contrato_assinado: 'Sim',
    valor_concedente: 500,
    valor_proponente: 100,
    data_evento: '2026-09-01',
  });

  assert.equal(row.regional_nucleus, 'Núcleo Serrano');
  assert.equal(row.total_portaria_value, 600);
  assert.equal(row.contract_signed, true);
});

test('aplica filtro por nome e limita ordenação ao conjunto permitido', () => {
  const rows = [
    { id: 1, municipality_id: 1, region: 'Capital', status: 'Em Execução', created_at: '2026-01-01', total_paid: 20, vigencia_status: 'vigentes' },
    { id: 2, municipality_id: 2, region: 'Oeste', status: 'Finalizado', created_at: '2026-02-01', total_paid: 80, vigencia_status: 'concluidas' },
  ];
  const result = filterAndSortRows(rows, { report_type: 'custom', filters: { region_name: 'Capital', status_names: ['Em Execução'] }, sort: { field: 'total_paid', direction: 'desc' } });
  assert.deepEqual(result.map((row) => row.id), [1]);
});

test('gera resumo financeiro e operacional', () => {
  const result = summarize([
    { municipality: 'A', status: 'Em Execução', total_portaria_value: 100, total_paid: 40, balance: 60, vigencia_status: 'vigentes' },
    { municipality: 'A', status: 'Finalizado', total_portaria_value: 50, total_paid: 50, balance: 0, vigencia_status: 'vencidos' },
  ]);
  assert.equal(result.process_count, 2);
  assert.equal(result.municipality_count, 1);
  assert.equal(result.total_paid, 90);
  assert.equal((result.by_status as Record<string, number>)['Finalizado'], 1);
});
