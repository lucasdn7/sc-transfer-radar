import { useRef, useState, type ReactNode } from "react";
import { Download, FileImage, RefreshCw, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type InvestmentItem = { name: string; value: number; fill: string; percentage: number };
type RegionItem = { name: string; obras: number; eventos: number; total: number; processos: number; eventosQuantidade: number; regionId: number | null };
type MunicipalityItem = { municipalityId: number | null; municipality: string; region: string; obras: number; eventos: number; totalInteracoes: number; valorObras: number; valorEventos: number; valorTotal: number };
type StatusItem = { name: string; value: number; fill?: string };

interface TodosChartData {
  g17Data: InvestmentItem[];
  g18Data: RegionItem[];
  g19Data: MunicipalityItem[];
  g20Data: RegionItem[];
  g1Data: StatusItem[];
  meta: { totalProcessos: number; totalCombinado: number };
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

function ChartFrame({ title, description, filename, chartRef, children, wide = false }: { title: string; description: string; filename: string; chartRef: React.RefObject<HTMLDivElement>; children: ReactNode; wide?: boolean }) {
  return <Card className={wide ? "col-span-1 md:col-span-2" : ""}><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-lg font-semibold">{title}</CardTitle><CardDescription>{description}</CardDescription></div><ExportButtons chartRef={chartRef} filename={filename} /></CardHeader><CardContent><div ref={chartRef} className="h-[350px] w-full" role="img" aria-label={title}>{children}</div></CardContent></Card>;
}

function EmptyChart({ message = "Sem dados para exibir" }: { message?: string }) {
  return <div className="h-[350px] flex items-center justify-center text-sm text-muted-foreground" role="status">{message}</div>;
}

function RegionFallbackGraphic({ regions, selectedRegion, onSelect }: { regions: RegionItem[]; selectedRegion: string | null; onSelect: (name: string) => void }) {
  const maxValue = Math.max(...regions.map(region => region.total), 0);
  const width = 900;
  const rowHeight = 34;
  const height = Math.max(170, regions.length * rowHeight + 30);
  return <div className="h-full overflow-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] h-auto" role="img" aria-label="Intensidade de investimento por região turística"><text x="10" y="18" className="fill-muted-foreground text-xs">Fallback acessível: não há GeoJSON confiável de regiões turísticas disponível no projeto</text>{regions.map((region, index) => { const y = 30 + index * rowHeight; const barWidth = maxValue ? region.total / maxValue * 620 : 0; const selected = selectedRegion === region.name; return <g key={region.name} tabIndex={0} role="button" aria-label={`${region.name}: ${money(region.total)}`} onClick={() => onSelect(region.name)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") onSelect(region.name); }}><text x="10" y={y + 17} className="fill-foreground text-xs">{region.name}</text><rect x="180" y={y + 4} width="620" height="18" rx="3" fill="#E5E7EB" /><rect x="180" y={y + 4} width={barWidth} height="18" rx="3" fill={selected ? "#0F6E56" : "#1D6FCC"} opacity={selected || !selectedRegion ? 0.9 : 0.45} /><text x="815" y={y + 17} className="fill-foreground text-xs">{money(region.total)}</text></g>;})}</svg></div>;
}

export function ChartsTodos({ data }: { data: TodosChartData | undefined }) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const g17Ref = useRef<HTMLDivElement>(null);
  const g18Ref = useRef<HTMLDivElement>(null);
  const g19Ref = useRef<HTMLDivElement>(null);
  const g20Ref = useRef<HTMLDivElement>(null);
  if (!data) return <EmptyChart message="Sem dados consolidados" />;
  const regions = selectedRegion ? data.g18Data.filter(region => region.name === selectedRegion) : data.g18Data;
  const municipalities = selectedRegion ? data.g19Data.filter(item => item.region === selectedRegion) : data.g19Data;
  const maxMunicipalityValue = Math.max(...municipalities.map(item => item.valorTotal), 0);
  const scatterData = municipalities.map(item => ({ ...item, radius: maxMunicipalityValue ? Math.max(60, item.valorTotal / maxMunicipalityValue * 900) : 60 }));
  const g17Total = data.g17Data.reduce((sum, item) => sum + item.value, 0);

  return <div className="space-y-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Visão consolidada</h2><p className="text-sm text-muted-foreground">Obras e Eventos agregados sem duplicar registros.</p></div>{selectedRegion && <Button type="button" variant="outline" onClick={() => setSelectedRegion(null)}><X /> Limpar filtro: {selectedRegion}</Button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <ChartFrame title="G17 - Investimento total por área" description="Valores reais de Obras, Eventos e Promoção" filename="g17-investimento-por-area" chartRef={g17Ref} wide>
      {g17Total > 0 ? <ResponsiveContainer><PieChart><Pie data={data.g17Data} dataKey="value" nameKey="name" innerRadius={78} outerRadius={115}>{data.g17Data.map(item => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip formatter={(value, name, item) => [`${money(value)} | ${percent(item.payload.percentage)}`, name]} /><Legend formatter={(value, entry) => `${value}: ${money(entry.payload?.value)} (${percent(entry.payload?.percentage)})`} /><text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-lg font-semibold">{money(g17Total)}</text><text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">total combinado</text></PieChart></ResponsiveContainer> : <EmptyChart message="Sem investimentos registrados" />}
    </ChartFrame>

    <ChartFrame title="G18 - Obras vs Eventos por região" description="Valores investidos por região turística" filename="g18-obras-eventos-regiao" chartRef={g18Ref} wide>
      {regions.length ? <ResponsiveContainer><BarChart data={regions} layout="vertical" margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={value => money(value)} /><YAxis dataKey="name" type="category" width={145} tick={{ fontSize: 10 }} /><Tooltip formatter={(value, name, item) => [`${money(value)} | Total: ${money(item.payload.total)} | Processos: ${number(item.payload.processos)} | Eventos: ${number(item.payload.eventosQuantidade)}`, name === "obras" ? "Obras" : "Eventos"]} /><Legend /><Bar dataKey="obras" name="Obras" stackId="total" fill="#1D6FCC" /><Bar dataKey="eventos" name="Eventos" stackId="total" fill="#0F6E56" /></BarChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="G19 - Municípios mais engajados" description="Eixo X: Obras; eixo Y: Eventos; tamanho: valor total" filename="g19-municipios-engajados" chartRef={g19Ref}>
      {scatterData.length ? <ResponsiveContainer><ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}><CartesianGrid /><XAxis type="number" dataKey="obras" name="Obras" allowDecimals={false} /><YAxis type="number" dataKey="eventos" name="Eventos" allowDecimals={false} /><ZAxis type="number" dataKey="radius" range={[60, 900]} /><Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => [number(value), name]} labelFormatter={(_, payload) => payload[0] ? `${payload[0].payload.municipality} | ${payload[0].payload.region} | Total: ${money(payload[0].payload.valorTotal)}` : "Município"} /><Scatter name="Municípios" data={scatterData} fill="#0F6E56" /></ScatterChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="G20 - Intensidade por região turística" description="Fallback de lista: não há asset GeoJSON confiável de regiões turísticas no projeto" filename="g20-mapa-regioes-sc" chartRef={g20Ref}>
      {data.g20Data.length ? <RegionFallbackGraphic regions={data.g20Data} selectedRegion={selectedRegion} onSelect={setSelectedRegion} /> : <EmptyChart message="Sem regiões para exibir" />}
    </ChartFrame>

    <Card className="col-span-1 md:col-span-2"><CardHeader><CardTitle className="text-lg font-semibold">Regiões consolidadas</CardTitle><CardDescription>Alternativa tabular acessível ao fallback visual do G20.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Região</th><th className="p-2">Obras</th><th className="p-2">Eventos</th><th className="p-2">Total</th><th className="p-2">Processos</th><th className="p-2">Eventos</th></tr></thead><tbody>{data.g20Data.map(region => <tr key={region.name} className={`border-b ${selectedRegion === region.name ? "bg-muted" : ""}`}><td className="p-2"><button type="button" className="underline-offset-2 hover:underline" onClick={() => setSelectedRegion(region.name)}>{region.name}</button></td><td className="p-2">{money(region.obras)}</td><td className="p-2">{money(region.eventos)}</td><td className="p-2 font-medium">{money(region.total)}</td><td className="p-2">{number(region.processos)}</td><td className="p-2">{number(region.eventosQuantidade)}</td></tr>)}</tbody></table></div></CardContent></Card>

    <Card className="col-span-1 md:col-span-2"><CardHeader><CardTitle className="text-lg font-semibold">Status das Obras Turísticas</CardTitle><CardDescription>Distribuição dos {number(data.meta.totalProcessos)} processos por status.</CardDescription></CardHeader><CardContent><div className="h-[350px]"><ResponsiveContainer><BarChart data={data.g1Data} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={number} /><YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} /><Tooltip formatter={value => [number(value), "Processos"]} /><Bar dataKey="value" name="Processos" fill="#1D6FCC" /></BarChart></ResponsiveContainer></div></CardContent></Card>
  </div></div>;
}
