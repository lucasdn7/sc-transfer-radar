import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from './flowchartConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FlowNodeComponentProps {
  data: FlowNodeData & {
    count?: number;
    isHighlighted?: boolean;
    tooltipExtra?: string;
    onClick?: (nodeId: string) => void;
  };
}

function FlowNodeComponent({ data }: NodeProps & FlowNodeComponentProps) {
  const nodeData = data as FlowNodeData & {
    count?: number;
    isHighlighted?: boolean;
    tooltipExtra?: string;
    onClick?: (nodeId: string) => void;
  };

  const bgColor = nodeData.type === 'interno' ? '#1a5c3a' : '#0d4d5c';
  const count = nodeData.count ?? 0;
  const isHighlighted = nodeData.isHighlighted ?? false;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`relative rounded-lg px-4 py-3 text-white shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
            isHighlighted ? 'ring-4 ring-orange-400 animate-pulse-glow' : ''
          }`}
          style={{ backgroundColor: bgColor, minWidth: 220 }}
          onClick={() => nodeData.onClick?.(nodeData.id)}
        >
          <Handle type="target" position={Position.Top} className="!bg-white/50 !w-2 !h-2" />
          
          {/* Counter badge */}
          <div
            className={`absolute -top-2 -right-2 min-w-[24px] h-6 rounded-full flex items-center justify-center text-xs font-bold px-1.5 ${
              count > 0
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-500/50 text-white/60'
            }`}
          >
            {count}
          </div>

          <p className="text-sm font-semibold text-center leading-tight">{nodeData.label}</p>

          {/* Document badges */}
          {nodeData.documents.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {nodeData.documents.map((doc) => (
                <span
                  key={doc}
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#e8720c', color: 'white' }}
                >
                  {doc}
                </span>
              ))}
            </div>
          )}

          <Handle type="source" position={Position.Bottom} className="!bg-white/50 !w-2 !h-2" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[280px]">
        <p className="font-semibold">{nodeData.label}</p>
        <p className="text-xs text-muted-foreground">
          {nodeData.type === 'interno' ? 'Setor SETUR (interno)' : 'Secretaria externa'}
        </p>
        {nodeData.documents.length > 0 && (
          <div className="mt-1">
            <p className="text-xs font-medium">Documentos / Ações:</p>
            <ul className="text-xs list-disc pl-3">
              {nodeData.documents.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs mt-1">{count} processo(s) nesta etapa</p>
      </TooltipContent>
    </Tooltip>
  );
}

function StartEndNode({ data }: NodeProps) {
  const nodeData = data as unknown as FlowNodeData;
  const isStart = nodeData.type === 'start';

  return (
    <div
      className="rounded-full px-6 py-3 text-white font-bold text-center shadow-md"
      style={{ backgroundColor: isStart ? '#1a5c3a' : '#6b2124', minWidth: 140 }}
    >
      {!isStart && <Handle type="target" position={Position.Top} className="!bg-white/50 !w-2 !h-2" />}
      <p className="text-sm">{nodeData.label}</p>
      {isStart && <Handle type="source" position={Position.Bottom} className="!bg-white/50 !w-2 !h-2" />}
    </div>
  );
}

export const MemoFlowNode = memo(FlowNodeComponent);
export const MemoStartEndNode = memo(StartEndNode);
