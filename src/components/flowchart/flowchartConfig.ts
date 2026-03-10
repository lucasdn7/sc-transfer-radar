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
  "Solicitado documentos tecnicos": "node-4a",
  "Em diligencia": "node-4b",
  "Contrato assinado": "node-5c",
  "Em pagamento": "node-9",
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
  { id: 'node-4a', label: 'SETUR/GEINFRA', type: 'interno', documents: ['Solicita Docs. Técnicos via tarefa'], order: 4 },
  { id: 'node-4b', label: 'SETUR/GEINFRA/DLG', type: 'externo', documents: ['Solicita correção de documentos'], order: 5 },
  { id: 'node-4c', label: 'SETUR/GEINFRA', type: 'interno', documents: ['Parecer', 'Solicita Dados Orçamentários'], order: 6 },
  { id: 'node-4d', label: 'SETUR/GEAFIN', type: 'interno', documents: ['Insere os Dados Orçamentários'], order: 7 },
  { id: 'node-5a', label: 'SETUR/GECON', type: 'interno', documents: ['Insere minuta do contrato'], order: 4 },
  { id: 'node-5b', label: 'SETUR/GEINFRA', type: 'interno', documents: ['Parecer Referencial', 'ANEXO I', 'ANEXO II'], order: 5 },
  { id: 'node-5c', label: 'SETUR/GECON', type: 'interno', documents: ['Assinatura da minuta', 'Publicação'], order: 6 },
  { id: 'node-6', label: 'SETUR/GEINFRA', type: 'interno', documents: ['DART', 'Ordem de Serviço', 'Extrato Contrapartida'], order: 8 },
  { id: 'node-7', label: 'SETUR/GEAFIN', type: 'interno', documents: [], order: 9 },
  { id: 'node-8', label: 'SEF/DIGF', type: 'externo', documents: ['Descentralização'], order: 10 },
  { id: 'node-9', label: 'SETUR/GEAFIN', type: 'interno', documents: ['N.E.', 'N.L.', 'O.B.'], order: 11 },
  { id: 'node-10', label: 'SETUR/GEINFRA', type: 'interno', documents: [], order: 12 },
  { id: 'node-end', label: 'FIM DO FLUXO', type: 'end', documents: [], order: 13 },
];

const NODE_WIDTH = 260;

export function buildNodes(): Node[] {
  const centerX = 400;
  const leftX = 120;
  const rightX = 680;
  const yStart = 0;
  const yStep = 140;

  const positions: Record<string, { x: number; y: number }> = {
    'node-start': { x: centerX, y: yStart },
    'node-1': { x: centerX, y: yStart + yStep },
    'node-2': { x: centerX, y: yStart + yStep * 2 },
    'node-3': { x: centerX, y: yStart + yStep * 3 },
    // Right path - Análise Técnica
    'node-4a': { x: rightX, y: yStart + yStep * 4 },
    'node-4b': { x: rightX, y: yStart + yStep * 5 },
    'node-4c': { x: rightX, y: yStart + yStep * 6 },
    'node-4d': { x: rightX, y: yStart + yStep * 7 },
    // Left path - Minuta do Contrato
    'node-5a': { x: leftX, y: yStart + yStep * 4 },
    'node-5b': { x: leftX, y: yStart + yStep * 5 },
    'node-5c': { x: leftX, y: yStart + yStep * 6.5 },
    // Convergence
    'node-6': { x: centerX, y: yStart + yStep * 8.5 },
    'node-7': { x: centerX, y: yStart + yStep * 9.5 },
    'node-8': { x: centerX, y: yStart + yStep * 10.5 },
    'node-9': { x: centerX, y: yStart + yStep * 11.5 },
    'node-10': { x: centerX, y: yStart + yStep * 12.5 },
    'node-end': { x: centerX, y: yStart + yStep * 13.5 },
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
  const edgeDefs = [
    ['node-start', 'node-1'],
    ['node-1', 'node-2'],
    ['node-2', 'node-3'],
    ['node-3', 'node-5a', 'Minuta do Contrato'],
    ['node-3', 'node-4a', 'Análise Técnica'],
    ['node-5a', 'node-5b'],
    ['node-5b', 'node-5c'],
    ['node-4a', 'node-4b'],
    ['node-4b', 'node-4c'],
    ['node-4c', 'node-4d'],
    ['node-5c', 'node-6'],
    ['node-4d', 'node-6'],
    ['node-6', 'node-7'],
    ['node-7', 'node-8'],
    ['node-8', 'node-9'],
    ['node-9', 'node-10'],
    ['node-10', 'node-end'],
  ];

  return edgeDefs.map(([source, target, label]) => ({
    id: `e-${source}-${target}`,
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

export const TOTAL_STEPS = 13; // node-end order

export function getStatusNodeId(statusName: string): string | null | undefined {
  return flowchartStatusMap[statusName];
}
