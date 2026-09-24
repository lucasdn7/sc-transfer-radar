import { useRef } from "react";
import { AlertTriangle, Download, FileImage } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ChartData } from "@/hooks/useChartsData";

type ChartContainerRef = React.RefObject<HTMLDivElement>;

const formatMoney = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatNumber = (value: unknown) => Number(value || 0).toLocaleString("pt-BR");
const formatPercent = (value: unknown) => `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ExportButtons({ containerRef, filename }: { containerRef: ChartContainerRef; filename: string }) {
  const { toast } = useToast();

  const exportSvg = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) {
      toast({ title: "Exportação indisponível", description: "O gráfico ainda não foi renderizado.", variant: "destructive" });
      return;
    }
    const source = new XMLSerializer().serializeToString(svg);
    downloadBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), `${filename}.svg`);
    toast({ title: "SVG exportado", description: `${filename}.svg foi baixado.` });
  };

  const exportPng = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) {
      toast({ title: "Exportação indisponível", description: "O gráfico ainda não foi renderizado.", variant: "destructive" });
      return;
    }
    const source = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.clientWidth || 900;
      canvas.height = svg.clientHeight || 350;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (blob) {
          downloadBlob(blob, `${filename}.png`);
          toast({ title: "PNG exportado", description: `${filename}.png foi baixado.` });
        }
      }, "image/png");
    };
    image.onerror = () => toast({ title: "Erro ao exportar", description: "Não foi possível converter o SVG para PNG.", variant: "destructive" });
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  };

  return (
    <div className="flex gap-1" aria-label={`Exportar ${filename}`}>
      <Button type="button" variant="ghost" size="icon" onClick={exportSvg} aria-label="Exportar SVG" title="Exportar SVG"><FileImage /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={exportPng} aria-label="Exportar PNG" title="Exportar PNG"><Download /></Button>
    </div>
  );
}

function EmptyChart({ message = "Sem dados para exibir" }: { message?: string }) {
  return <div className="h-[350px] flex items-center justify-center text-sm text-muted-foreground" role="status">{message}</div>;
}

function ChartFrame({ title, description, filename, children, chartRef }: { title: string; description?: string; filename: string; children: React.ReactNode; chartRef: ChartContainerRef }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div><CardTitle className="text-lg font-semibold">{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</div>
        <ExportButtons containerRef={chartRef} filename={filename} />
      </CardHeader>
      <CardContent><div ref={chartRef} className="h-[350px] w-full" role="img" aria-label={title}>{children}</div></CardContent>
    </Card>
  );
}

function currencyTooltip(value: unknown, name: string) {
  return [formatMoney(value), name];
}

export function ChartsObras({ data }: { data: ChartData }) {
  const g1Ref = useRef<HTMLDivElement>(null);
  const g2Ref = useRef<HTMLDivElement>(null);
  const g3Ref = useRef<HTMLDivElement>(null);
  const g4Ref = useRef<HTMLDivElement>(null);
  const g5Ref = useRef<HTMLDivElement>(null);
  const g6Ref = useRef<HTMLDivElement>(null);
  const g7Ref = useRef<HTMLDivElement>(null);
  const g8Ref = useRef<HTMLDivElement>(null);
  const g9Ref = useRef<HTMLDivElement>(null);
  const refs = [g1Ref, g2Ref, g3Ref, g4Ref, g5Ref, g6Ref, g7Ref, g8Ref, g9Ref];
  const g2Total = data.g2Data.reduce((sum, item) => sum + item.value, 0);
  const paidPercentage = g2Total ? (data.g2Data[0].value / g2Total) * 100 : 0;
  const classifiedValue = data.g9Data.reduce((sum, item) => sum + item.value, 0);
  const categoryData = data.g9Data.map(item => ({ ...item, percentage: classifiedValue ? item.value / classifiedValue * 100 : 0 }));
  const categoryColors = ["#1D6FCC", "#0F6E56", "#C9903A", "#C0392B", "#7C3AED", "#888888"];

  return (
    <div className="space-y-6">
      {data.meta.semVigencia > 0 && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3"><AlertTriangle className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" /><div><h4 className="text-amber-900 font-medium">Dados incompletos</h4><p className="text-amber-800 text-sm">Há {formatNumber(data.meta.semVigencia)} processos sem data de vigência preenchida.</p></div></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartFrame title="G1 - Funil de status dos processos" description="Quantidade de processos por status" filename="g1-status-obras" chartRef={refs[0]}>
          {data.g1Data.length ? <ResponsiveContainer><BarChart data={data.g1Data} layout="vertical" margin={{ left: 20, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={formatNumber} /><YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11 }} /><Tooltip formatter={(value, name, item) => [name === "value" ? `${formatNumber(value)} processos | ${formatMoney(item.payload.totalValue)} | ${formatPercent(item.payload.percentage)}` : formatMoney(value), name === "value" ? "Status" : name]} /><Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>{data.g1Data.map(item => <Cell key={item.name} fill={item.fill} />)}</Bar></BarChart></ResponsiveContainer> : <EmptyChart />}
        </ChartFrame>

        <ChartFrame title="G2 - Execução financeira das parcelas" description="Pago vs pendente por valor" filename="g2-execucao-parcelas-obras" chartRef={refs[1]}>
          {g2Total > 0 ? <ResponsiveContainer><PieChart><Pie data={data.g2Data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={2}>{data.g2Data.map(item => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip formatter={currencyTooltip} /><Legend formatter={(value, entry) => `${value}: ${formatMoney(entry.payload?.value)} (${formatPercent((entry.payload?.value / g2Total) * 100)})`} /><text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xl font-semibold">{formatPercent(paidPercentage)}</text><text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">% pago</text></PieChart></ResponsiveContainer> : <EmptyChart message="Sem dados de parcelas" />}
        </ChartFrame>

        <ChartFrame title="G3 - Parcelas por número" description="Valores pagos e pendentes por parcela" filename="g3-parcelas-por-numero-obras" chartRef={refs[2]}>
          {data.g3Data.length ? <ResponsiveContainer><BarChart data={data.g3Data} margin={{ top: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={value => formatMoney(value)} /><Tooltip formatter={(value, name, item) => [`${formatMoney(value)} | Total: ${formatMoney(item.payload.total)} | Quantidade: ${name === "pago" ? item.payload.paidCount : item.payload.pendingCount}`, name === "pago" ? "Pago" : "Pendente"]} /><Legend /><Bar dataKey="pago" name="Pago" fill="#1A7340" /><Bar dataKey="pendente" name="Pendente" fill="#888888" /></BarChart></ResponsiveContainer> : <EmptyChart message="Sem dados de parcelas" />}
        </ChartFrame>

        <ChartFrame title="G4 - Semáforo de vigências" description="Risco por prazo de vigência" filename="g4-vigencias-obras" chartRef={refs[3]}>
          <ResponsiveContainer><BarChart data={data.g4Data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tickFormatter={formatNumber} /><Tooltip formatter={(value) => [formatNumber(value), "Processos"]} /><Bar dataKey="value" name="Processos">{data.g4Data.map(item => <Cell key={item.name} fill={item.fill} />)}</Bar></BarChart></ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="G5 - Investimento por região turística" description="Valor concedente sem duplicação de processos" filename="g5-investimento-regiao-obras" chartRef={refs[4]}>
          {data.g5Data.length ? <ResponsiveContainer><BarChart data={data.g5Data} margin={{ bottom: 70 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} /><YAxis tickFormatter={value => formatMoney(value)} /><Tooltip formatter={(value, name, item) => [`${formatMoney(value)} | ${formatNumber(item.payload.processCount)} processos | ${formatNumber(item.payload.municipalityCount)} municípios`, name]} /><Bar dataKey="value" name="Valor concedente" fill="#1D6FCC" /></BarChart></ResponsiveContainer> : <EmptyChart />}
        </ChartFrame>

        <ChartFrame title="G6 - Processos por núcleo regional" description="Quantidade; valor no tooltip" filename="g6-nucleos-obras" chartRef={refs[5]}>
          {data.g6Data.length ? <ResponsiveContainer><BarChart data={data.g6Data} layout="vertical" margin={{ left: 35 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={formatNumber} /><YAxis dataKey="acronym" type="category" width={90} /><Tooltip formatter={(value, name, item) => [name === "value" ? formatNumber(value) : formatMoney(item.payload.totalValue), name === "value" ? "Processos" : "Valor concedente"]} /><Bar dataKey="value" name="Processos" fill="#1D6FCC" /></BarChart></ResponsiveContainer> : <EmptyChart />}
        </ChartFrame>

        <ChartFrame title="G7 - Top 10 municípios" description="Ranking por valor concedente" filename="g7-top-10-municipios-obras" chartRef={refs[6]}>
          {data.g7Data.length ? <ResponsiveContainer><BarChart data={data.g7Data} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={value => formatMoney(value)} /><YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} /><Tooltip formatter={(value, name, item) => [`${formatMoney(value)} | ${formatNumber(item.payload.processCount)} processos`, name]} labelFormatter={(label, payload) => `${payload[0]?.payload.rank}º ${label} - ${payload[0]?.payload.region}`} /><Bar dataKey="value" name="Valor concedente" fill="#1D6FCC" /></BarChart></ResponsiveContainer> : <EmptyChart />}
        </ChartFrame>

        <ChartFrame title="G8 - Evolução de novos processos" description="Últimos 13 meses, incluindo meses sem registros" filename="g8-evolucao-processos-obras" chartRef={refs[7]}>
          <ResponsiveContainer><LineChart data={data.g8Data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tickFormatter={formatNumber} /><Tooltip formatter={(value) => [formatNumber(value), "Novos processos"]} /><Line type="monotone" dataKey="value" name="Novos processos" stroke="#1D6FCC" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="G9 - Distribuição por categoria de obra" description="Tamanho das fatias por quantidade de processos" filename="g9-categorias-obras" chartRef={refs[8]}>
          <div className="h-full flex flex-col"><div className="text-sm text-muted-foreground mb-2">{formatNumber(data.meta.classificados)} de {formatNumber(data.meta.totalProcessos)} processos possuem categoria ({formatPercent(data.meta.completude)}). Sem categoria: {formatNumber(data.meta.semCategoria)}.</div>{categoryData.length ? <div className="min-h-0 flex-1"><ResponsiveContainer><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={100}>{categoryData.map((item, index) => <Cell key={item.name} fill={categoryColors[index % categoryColors.length]} />)}</Pie><Tooltip formatter={(value, name, item) => [`${formatNumber(value)} processos | ${formatMoney(item.payload.value)} | ${formatPercent(item.payload.percentage)}`, name]} /><Legend /></PieChart></ResponsiveContainer></div> : <EmptyChart message="Sem categorias preenchidas" />}</div>
        </ChartFrame>
      </div>
    </div>
  );
}
