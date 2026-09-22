import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { AlertTriangle, Info } from "lucide-react";

export function ChartsObras({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {data.meta.semVigencia > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-800 font-medium">Dados incompletos</h4>
            <p className="text-amber-700 text-sm">Há {data.meta.semVigencia} processos sem data de vigência preenchida. Recomendamos a atualização destes campos.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* G1 — Funil de status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G1 - Funil de Status</CardTitle>
            <CardDescription>Evolução dos processos pelas etapas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g1Data} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => [value, 'Processos']} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G2 — Execução financeira das parcelas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G2 - Execução Financeira</CardTitle>
            <CardDescription>Valores pagos vs pendentes (Geral)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.g2Data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {data.g2Data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G3 — Parcelas por número */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G3 - Parcelas por Número</CardTitle>
            <CardDescription>Pago vs Pendente (Top 5)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g3Data} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Legend />
                  <Bar dataKey="pago" name="Pago" stackId="a" fill="#10b981" />
                  <Bar dataKey="pendente" name="Pendente" stackId="a" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G4 — Semáforo de vigências */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G4 - Semáforo de Vigências</CardTitle>
            <CardDescription>Urgência de renovação/aditivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g4Data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [value, 'Processos']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.g4Data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G5 — Investimento por região turística */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G5 - Investimento por Região Turística</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g5Data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Valor Concedente" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G6 — Processos por núcleo regional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G6 - Processos por Núcleo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g6Data} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => [value, 'Processos']} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Processos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G7 — Top 15 municípios por valor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G7 - Top 15 Municípios</CardTitle>
            <CardDescription>Por valor total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g7Data} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} name="Valor Concedente" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G8 — Evolução de processos cadastrados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G8 - Evolução de Cadastros</CardTitle>
            <CardDescription>Crescimento histórico (Mês/Ano)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.g8Data} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [value, 'Novos processos']} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} name="Processos" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G9 — Distribuição por categoria de obra */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G9 - Categoria da Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.g9Data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.g9Data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#64748b'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Obras']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
