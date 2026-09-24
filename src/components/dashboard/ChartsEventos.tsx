import { type ReactNode, useRef } from "react";
import { Download, FileImage, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type EventYearStatusItem = { name: string; Assinados: number; Pendentes: number; Arquivados: number; NaoDefinidos: number; total: number };
type EventYearValueItem = { name: string; value: number; acumulado: number; quantidadeAssinada: number };
type EventInstrumentItem = { name: string; value: number; quantidade: number; percentualQuantidade: number; percentualValor: number };
type EventRegionItem = { name: string; value: number; quantidade: number; media: number };
type EventNucleusItem = { name: string; acronym: string; value: number; quantidade: number };
type EventMunicipalityItem = { name: string; region: string; value: number; quantidade: number; rank: number };
type EventPaymentItem = { name: string; value: number; fill: string; quantidade: number; percentage: number };

interface EventChartData {
  g10Data: EventYearStatusItem[];
  g11Data: EventYearValueItem[];
  g12Data: EventInstrumentItem[];
  g13Data: EventRegionItem[];
  g14Data: EventNucleusItem[];
  g15Data: EventMunicipalityItem[];
  g16Data: EventPaymentItem[];
  meta?: { eventError?: string };
}

const money = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const number = (value: unknown) => Number(value || 0).toLocaleString("pt-BR");
const percent = (value: unknown) => `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ExportButtons({ chartRef, filename }: { chartRef: React.RefObject<HTMLDivElement>; filename: string }) {
  const { toast } = useToast();
  const getSvg = () => chartRef.current?.querySelector("svg");
  const exportSvg = () => {
    const svg = getSvg();
    if (!svg) { toast({ title: "Exportação indisponível", description: "O gráfico ainda não foi renderizado.", variant: "destructive" }); return; }
    downloadBlob(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" }), `${filename}.svg`);
    toast({ title: "SVG exportado", description: `${filename}.svg foi baixado.` });
  };
  const exportPng = () => {
    const svg = getSvg();
    if (!svg) { toast({ title: "Exportação indisponível", description: "O gráfico ainda não foi renderizado.", variant: "destructive" }); return; }
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
      canvas.toBlob(blob => { if (blob) { downloadBlob(blob, `${filename}.png`); toast({ title: "PNG exportado", description: `${filename}.png foi baixado.` }); } }, "image/png");
    };
    image.onerror = () => toast({ title: "Erro ao exportar", description: "Não foi possível converter o SVG para PNG.", variant: "destructive" });
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  };
  return <div className="flex gap-1" aria-label={`Exportar ${filename}`}><Button type="button" variant="ghost" size="icon" onClick={exportSvg} aria-label="Exportar SVG" title="Exportar SVG"><FileImage /></Button><Button type="button" variant="ghost" size="icon" onClick={exportPng} aria-label="Exportar PNG" title="Exportar PNG"><Download /></Button></div>;
}

function EmptyChart({ message = "Sem dados para exibir" }: { message?: string }) {
  return <div className="h-[350px] flex items-center justify-center text-sm text-muted-foreground" role="status">{message}</div>;
}

function ChartFrame({ title, description, filename, chartRef, children, wide = false }: { title: string; description: string; filename: string; chartRef: React.RefObject<HTMLDivElement>; children: ReactNode; wide?: boolean }) {
  return <Card className={wide ? "col-span-1 md:col-span-2" : ""}><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-lg font-semibold">{title}</CardTitle><CardDescription>{description}</CardDescription></div><ExportButtons chartRef={chartRef} filename={filename} /></CardHeader><CardContent><div ref={chartRef} className="h-[350px] w-full" role="img" aria-label={title}>{children}</div></CardContent></Card>;
}

export function ChartsEventos({ data, onRetry }: { data: EventChartData | undefined; onRetry?: () => void }) {
  const g10Ref = useRef<HTMLDivElement>(null);
  const g11Ref = useRef<HTMLDivElement>(null);
  const g12Ref = useRef<HTMLDivElement>(null);
  const g13Ref = useRef<HTMLDivElement>(null);
  const g14Ref = useRef<HTMLDivElement>(null);
  const g15Ref = useRef<HTMLDivElement>(null);
  const g16Ref = useRef<HTMLDivElement>(null);
  if (!data) return <EmptyChart message="Sem dados de Eventos" />;
  const paymentTotal = data.g16Data.reduce((sum, item) => sum + item.value, 0);
  const paidPercentage = paymentTotal ? data.g16Data[0].value / paymentTotal * 100 : 0;
  const instrumentColors = ["#0F6E56", "#1A7340", "#C9903A", "#1D6FCC", "#888888", "#7C3AED"];

  return <div className="space-y-6">{data.meta?.eventError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4" role="alert"><p className="font-medium">Não foi possível carregar os dados de Eventos.</p><p className="mt-1 text-sm text-muted-foreground">A consulta de Obras continua disponível, mas os gráficos G10–G16 precisam de uma nova tentativa.</p>{onRetry && <Button type="button" variant="outline" className="mt-3" onClick={onRetry}><RefreshCw /> Tentar novamente</Button>}</div>}<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <ChartFrame title="G10 - Eventos por ano e status do contrato" description="Status baseado exclusivamente em contrato_assinado" filename="g10-eventos-ano-status" chartRef={g10Ref}>
      {data.g10Data.length ? <ResponsiveContainer><BarChart data={data.g10Data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={number} /><Tooltip formatter={(value, name) => [number(value), name]} /><Legend /><Bar dataKey="Assinados" name="Assinados" fill="#1A7340" /><Bar dataKey="Pendentes" name="Pendentes" fill="#C9903A" /><Bar dataKey="Arquivados" name="Arquivados" fill="#888888" /><Bar dataKey="NaoDefinidos" name="Não definidos" fill="#C8C8C8" /></BarChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="G11 - Valor contratado por ano" description="Somente eventos com contrato assinado; linha acumulada" filename="g11-valor-contratado-ano" chartRef={g11Ref}>
      {data.g11Data.length ? <ResponsiveContainer><ComposedChart data={data.g11Data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis yAxisId="left" tickFormatter={value => money(value)} /><Tooltip formatter={(value, name) => [money(value), name === "value" ? "Valor contratado" : "Valor acumulado"]} /><Legend /><Bar yAxisId="left" dataKey="value" name="Valor contratado" fill="#0F6E56" /><Line yAxisId="left" type="monotone" dataKey="acumulado" name="Valor acumulado" stroke="#1D6FCC" strokeWidth={3} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="G12 - Distribuição por tipo de instrumento" description="Fatias proporcionais ao valor concedente" filename="g12-tipos-instrumento-eventos" chartRef={g12Ref}>
      {data.g12Data.length ? <ResponsiveContainer><PieChart><Pie data={data.g12Data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105}>{data.g12Data.map((item, index) => <Cell key={item.name} fill={instrumentColors[index % instrumentColors.length]} />)}</Pie><Tooltip formatter={(value, name, item) => [`${money(value)} | ${number(item.payload.quantidade)} eventos | ${percent(item.payload.percentualValor)} do valor | ${percent(item.payload.percentualQuantidade)} da quantidade`, name]} /><Legend formatter={(value, entry) => `${value}: ${money(entry.payload?.value)} (${percent(entry.payload?.percentualValor)})`} /></PieChart></ResponsiveContainer> : <EmptyChart message="Sem eventos ou tipos de instrumento" />}
    </ChartFrame>

    <ChartFrame title="G13 - Eventos por região turística" description="Valor apoiado por região; quantidade e média no tooltip" filename="g13-regioes-eventos" chartRef={g13Ref}>
      {data.g13Data.length ? <ResponsiveContainer><BarChart data={data.g13Data} layout="vertical" margin={{ left: 25 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={value => money(value)} /><YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} /><Tooltip formatter={(value, name, item) => [`${money(value)} | ${number(item.payload.quantidade)} eventos | Média ${money(item.payload.media)}`, name]} /><Bar dataKey="value" name="Valor apoiado" fill="#0F6E56" /></BarChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="G14 - Eventos por núcleo regional" description="Quantidade de eventos; valor total no tooltip" filename="g14-nucleos-eventos" chartRef={g14Ref}>
      {data.g14Data.length ? <ResponsiveContainer><BarChart data={data.g14Data} layout="vertical" margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={number} /><YAxis dataKey="acronym" type="category" width={90} /><Tooltip formatter={(value, name, item) => [name === "value" ? `${number(value)} eventos | ${money(item.payload.value)}` : money(value), "Núcleo"]} labelFormatter={(label, payload) => `${payload[0]?.payload.name} (${label})`} /><Bar dataKey="value" name="Quantidade" fill="#0F6E56" /></BarChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="G15 - Top 10 municípios" description="Ranking por valor apoiado" filename="g15-top-10-municipios-eventos" chartRef={g15Ref} wide>
      {data.g15Data.length ? <ResponsiveContainer><BarChart data={data.g15Data} layout="vertical" margin={{ left: 25 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={value => money(value)} /><YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} /><Tooltip formatter={(value, name, item) => [`${money(value)} | ${number(item.payload.quantidade)} eventos`, name]} labelFormatter={(label, payload) => `${payload[0]?.payload.rank}º ${label} - ${payload[0]?.payload.region}`} /><Bar dataKey="value" name="Valor apoiado" fill="#0F6E56" /></BarChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="G16 - Pagamento de Eventos" description="Pago vs pendente por valor concedente" filename="g16-pagamento-eventos" chartRef={g16Ref}>
      {paymentTotal > 0 ? <ResponsiveContainer><PieChart><Pie data={data.g16Data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={108} paddingAngle={2}>{data.g16Data.map(item => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip formatter={(value, name, item) => [`${money(value)} | ${percent(item.payload.percentage)} | ${number(item.payload.quantidade)} eventos`, name]} /><Legend formatter={(value, entry) => `${value}: ${money(entry.payload?.value)} (${percent(entry.payload?.percentage)})`} /><text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xl font-semibold">{percent(paidPercentage)}</text><text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">% pago</text></PieChart></ResponsiveContainer> : <EmptyChart message="Sem dados de pagamento" />}
    </ChartFrame>
  </div></div>;
}
