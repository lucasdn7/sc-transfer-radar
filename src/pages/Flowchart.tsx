import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Search, X, Maximize2, Crosshair, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { MemoFlowNode, MemoStartEndNode } from '@/components/flowchart/FlowchartNode';
import {
  buildNodes,
  buildEdges,
  getStatusNodeId,
  getNodeOrder,
  TOTAL_STEPS,
  nodeDefinitions,
} from '@/components/flowchart/flowchartConfig';
import {
  useProcessCountsByNode,
  useSearchProcess,
  useProcessesForNode,
} from '@/components/flowchart/useFlowchartData';
import { formatCurrency } from '@/utils/processUtils';

const nodeTypes = {
  flowNode: MemoFlowNode,
  startEnd: MemoStartEndNode,
};

export default function Flowchart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [nucleusFilter, setNucleusFilter] = useState('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowInstance = useRef<any>(null);

  // Queries
  const { data: counts = {} } = useProcessCountsByNode(nucleusFilter);
  const { data: searchResult } = useSearchProcess(debouncedSearch);
  const { data: nodeProcesses = [] } = useProcessesForNode(selectedNodeId, nucleusFilter);
  const { data: nuclei = [] } = useQuery({
    queryKey: ['regional-nuclei-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('regional_nuclei')
        .select('id, name, acronym')
        .order('name');
      return data || [];
    },
  });

  // Determine highlighted node
  const highlightedNodeId = useMemo(() => {
    if (!searchResult) return null;
    const statusName = (searchResult.status_processos as any)?.nome;
    if (!statusName) return null;
    const nodeId = getStatusNodeId(statusName);
    return nodeId; // null means unmapped, undefined means status not in map
  }, [searchResult]);

  // Build nodes with counts and highlight
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const initialNodes = useMemo(() => {
    const nodes = buildNodes();
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        count: counts[n.id] ?? 0,
        isHighlighted: highlightedNodeId === n.id,
        onClick: handleNodeClick,
      },
    }));
  }, [counts, highlightedNodeId, handleNodeClick]);

  const initialEdges = useMemo(() => buildEdges(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when data changes
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Vigencia calculation
  const vigenciaDays = useMemo(() => {
    if (!searchResult?.vigencia_date) return null;
    const diff = new Date(searchResult.vigencia_date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [searchResult]);

  // Progress
  const progressInfo = useMemo(() => {
    if (!highlightedNodeId) return null;
    const order = getNodeOrder(highlightedNodeId);
    return { step: order, total: TOTAL_STEPS, percent: Math.round((order / TOTAL_STEPS) * 100) };
  }, [highlightedNodeId]);

  const statusName = (searchResult?.status_processos as any)?.nome;
  const isUnmapped = searchResult && (highlightedNodeId === null || highlightedNodeId === undefined);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const centerFlow = () => {
    reactFlowInstance.current?.fitView({ duration: 400 });
  };

  // Selected node definition for sheet
  const selectedNodeDef = nodeDefinitions.find((n) => n.id === selectedNodeId);

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-64px)] relative">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b bg-background z-10">
        <h1 className="text-xl font-bold mr-2">Fluxograma</h1>

        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nº do processo..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <Select value={nucleusFilter} onValueChange={setNucleusFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos os núcleos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os núcleos</SelectItem>
            {nuclei.map((n) => (
              <SelectItem key={n.id} value={String(n.id)}>
                {n.acronym} - {n.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 ml-auto">
          <Button variant="outline" size="icon" onClick={centerFlow} title="Centralizar">
            <Crosshair className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen} title="Tela cheia">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search result panel */}
      {debouncedSearch && (
        <div className="absolute top-[72px] right-4 z-20 w-[320px]">
          {searchResult ? (
            <Card className="p-4 shadow-xl border">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm">{searchResult.process_number}</h3>
                <button onClick={() => setSearchInput('')}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {(searchResult.municipalities as any)?.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs">Status:</span>
                <Badge variant="secondary" className="text-xs">
                  {statusName || 'N/A'}
                </Badge>
              </div>

              {progressInfo && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Etapa {progressInfo.step} de {progressInfo.total}
                  </p>
                  <Progress value={progressInfo.percent} className="h-2" />
                </div>
              )}

              {vigenciaDays !== null && (
                <p className={`text-xs mt-2 ${vigenciaDays < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {vigenciaDays >= 0
                    ? `${vigenciaDays} dias restantes de vigência`
                    : 'Vigência encerrada'}
                </p>
              )}

              {isUnmapped && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Etapa não mapeada no fluxograma</span>
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                <Link to="/processes">Ver processo completo</Link>
              </Button>
            </Card>
          ) : (
            <Card className="p-4 shadow-xl border">
              <p className="text-sm text-muted-foreground">
                Nenhum processo encontrado com esse número.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* React Flow canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-right"
            style={{ marginBottom: 50 }}
            nodeColor={(node: Node) => {
              const t = (node.data as any)?.type;
              if (t === 'interno') return '#1a5c3a';
              if (t === 'externo') return '#0d4d5c';
              return '#6b7280';
            }}
            maskColor="rgba(0,0,0,0.15)"
          />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="p-3 bg-background/80 backdrop-blur-sm border text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#1a5c3a' }} />
              <span>Setor SETUR (interno)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#0d4d5c' }} />
              <span>Secretaria externa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#e8720c' }} />
              <span>Documento / ação emitida</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Node detail sheet */}
      <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedNodeDef?.label || 'Detalhes da Etapa'}</SheetTitle>
            <SheetDescription>
              {selectedNodeDef?.type === 'interno' ? 'Setor SETUR (interno)' : 'Secretaria externa'}
            </SheetDescription>
          </SheetHeader>

          {selectedNodeDef?.documents && selectedNodeDef.documents.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Documentos / Ações:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNodeDef.documents.map((doc) => (
                  <Badge
                    key={doc}
                    className="text-xs text-white"
                    style={{ backgroundColor: '#e8720c' }}
                  >
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-sm font-medium mb-3">
              Processos nesta etapa ({nodeProcesses.length})
            </p>
            {nodeProcesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum processo nesta etapa no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {nodeProcesses.map((p: any) => {
                  const days = Math.ceil(
                    (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Card key={p.id} className="p-3">
                      <p className="font-mono text-sm font-semibold">{p.process_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.municipalities?.name}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs">
                          {formatCurrency(p.total_portaria_value || 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">{days} dias nesta etapa</span>
                      </div>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" asChild>
                        <Link to="/processes">Ver detalhes</Link>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Pulse glow animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(251, 146, 60, 0.5); }
          50% { box-shadow: 0 0 20px 6px rgba(251, 146, 60, 0.8); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
