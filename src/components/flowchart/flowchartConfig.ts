import type { Node, Edge } from '@xyflow/react';

export interface FlowNodeData {
  id: string;
  label: string;
  type: 'interno' | 'externo' | 'start' | 'end';
  documents: string[];
  order: number;
}

export const flowchartStatusMap: Record<string, string | null> = {
  "Publicado na Portaria": "node-2",
  "Solicitado documentos tecnicos": "node-4",
  "Em diligencia": "node-4b",
  "Contrato assinado": "node-10",
  "Em pagamento": "node-14",
  "Termo de aditivo": null,
  "Em prestação de contas": null,
  "Em Análise": null,
  "Finalizado": null,
};

export const nodeDefinitions: FlowNodeData[] = [
  { id: 'node-start', label: 'INÍCIO', type: 'start', documents: [], order: 0 },
  { id: 'node-1', label: 'Solicitação de Abertura do Processo', type: 'externo', documents: ['Plano de Trabalho', 'Ofício'], order: 1 },
  { id: 'node-2', label: 'Casa Civil', type: 'externo', documents: ['Publicação da Portaria', 'Relatório SIGEF'], order: 2 },
  { id: 'node-3', label: 'SETUR/GABS', type: 'interno', documents: [], order: 3 },
  { id: 'node-4', label: 'SETUR/GEINFRA', type: 'interno', documents: ['Solicita Docs. Técnicos via tarefa'], order: 4 },
  // Diligência (opcional) - branch
  { id: 'node-4b', label: 'SETUR/GEINFRA/DLG', type: 'interno', documents: ['Solicita correção de documentos'], order: 5 },
  // Parecer (se docs corretos, volta p/ GEINFRA)
  { id: 'node-5', label: 'SETUR/GEINFRA', type: 'interno', documents: ['Parecer', 'Solicita Dados Orçamentários'], order: 6 },
  { id: 'node-6', label: 'SETUR/GEAFIN', type: 'interno', documents: ['Insere os Dados Orçamentários'], order: 7 },
  { id: 'node-7', label: 'SETUR/GEINFRA', type: 'interno', documents: [], order: 8 },
  { id: 'node-8', label: 'SETUR/GECON', type: 'interno', documents: ['Insere minuta do contrato'], order: 9 },
  { id: 'node-9', label: 'SETUR/GEINFRA', type: 'interno', documents: ['Parecer Referencial', 'ANEXO I', 'ANEXO II'], order: 10 },
  { id: 'node-10', label: 'SETUR/GECON', type: 'interno', documents: ['Assinatura da minuta', 'Publicação'], order: 11 },
  { id: 'node-11', label: 'SETUR/GEINFRA', type: 'interno', documents: ['DART', 'Ordem de Serviço', 'Extrato Contrapartida'], order: 12 },
  { id: 'node-12', label: 'SETUR/GEAFIN', type: 'interno', documents: [], order: 13 },
  { id: 'node-13', label: 'SEF/DIGF', type: 'externo', documents: ['Descentralização'], order: 14 },
  { id: 'node-14', label: 'SETUR/GEAFIN', type: 'interno', documents: ['N.E.', 'N.L.', 'O.B.'], order: 15 },
  { id: 'node-15', label: 'SETUR/GEINFRA', type: 'interno', documents: [], order: 16 },
  { id: 'node-end', label: 'FIM DO FLUXO', type: 'end', documents: [], order: 17 },
];

const NODE_WIDTH = 260;

export function buildNodes(): Node[] {
  const centerX = 400;
  const sideX = 700;
  const yStart = 0;
  const yStep = 130;

  const positions: Record<string, { x: number; y: number }> = {
    'node-start': { x: centerX, y: yStart },
    'node-1': { x: centerX, y: yStart + yStep },
    'node-2': { x: centerX, y: yStart + yStep * 2 },
    'node-3': { x: centerX, y: yStart + yStep * 3 },
    'node-4': { x: centerX, y: yStart + yStep * 4 },
    // Diligência branch (to the right)
    'node-4b': { x: sideX, y: yStart + yStep * 5 },
    // Main path continues
    'node-5': { x: centerX, y: yStart + yStep * 6 },
    'node-6': { x: centerX, y: yStart + yStep * 7 },
    'node-7': { x: centerX, y: yStart + yStep * 8 },
    'node-8': { x: centerX, y: yStart + yStep * 9 },
    'node-9': { x: centerX, y: yStart + yStep * 10 },
    'node-10': { x: centerX, y: yStart + yStep * 11 },
    'node-11': { x: centerX, y: yStart + yStep * 12 },
    'node-12': { x: centerX, y: yStart + yStep * 13 },
    'node-13': { x: centerX, y: yStart + yStep * 14 },
    'node-14': { x: centerX, y: yStart + yStep * 15 },
    'node-15': { x: centerX, y: yStart + yStep * 16 },
    'node-end': { x: centerX, y: yStart + yStep * 17 },
  };

  return nodeDefinitions.map((nd) => ({
    id: nd.id,
    type: nd.type === 'start' || nd.type === 'end' ? 'startEnd' : 'flowNode',
    position: positions[nd.id] || { x: centerX, y: 0 },
    data: { ...nd },
    style: { width: NODE_WIDTH },
  }));
}

export function buildEdges(): Edge[] {
  const edgeDefs: [string, string, string?][] = [
    ['node-start', 'node-1'],
    ['node-1', 'node-2'],
    ['node-2', 'node-3'],
    ['node-3', 'node-4'],
    // Diligência branch (optional)
    ['node-4', 'node-4b', 'Diligência'],
    ['node-4b', 'node-4'], // returns to GEINFRA
    // Main path
    ['node-4', 'node-5', 'Docs. corretos'],
    ['node-5', 'node-6'],
    ['node-6', 'node-7'],
    ['node-7', 'node-8'],
    ['node-8', 'node-9'],
    ['node-9', 'node-10'],
    ['node-10', 'node-11'],
    ['node-11', 'node-12'],
    ['node-12', 'node-13'],
    ['node-13', 'node-14'],
    ['node-14', 'node-15'],
    ['node-15', 'node-end'],
  ];

  return edgeDefs.map(([source, target, label]) => ({
    id: `e-${source}-${target}${label ? '-' + label.replace(/\s/g, '') : ''}`,
    source,
    target,
    type: 'smoothstep',
    animated: true,
    label: label || undefined,
    style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
    labelStyle: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
    labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.8 },
  }));
}

export function getNodeOrder(nodeId: string): number {
  const node = nodeDefinitions.find((n) => n.id === nodeId);
  return node?.order ?? 0;
}

export const TOTAL_STEPS = 17; // node-end order

export function getStatusNodeId(statusName: string): string | null | undefined {
  return flowchartStatusMap[statusName];
}
