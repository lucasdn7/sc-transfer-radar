import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Info } from "lucide-react";

export function ChartsEventos({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="text-blue-500 w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-blue-800 font-medium">Insights Rápidos</h4>
          <ul className="text-blue-700 text-sm list-disc pl-5 mt-1 space-y-1">
            <li>Há uma forte concentração de eventos em 2025 e 2026.</li>
            <li>O maior valor contratado encontra-se em 2025.</li>
            <li>Diferenças regionais: a capital (Florianópolis) concentra a maior parte dos recursos para eventos.</li>
            <li>A execução financeira de eventos (pagamentos consolidados) ocorre em ritmo diferente em comparação com as obras.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* G10 — Eventos por ano e status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G10 - Eventos por Ano e Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g10Data} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [value, 'Eventos']} />
                  <Legend />
                  <Bar dataKey="Pago" fill="#10b981" />
                  <Bar dataKey="Pendente" fill="#f59e0b" />
                  <Bar dataKey="Arquivado" fill="#64748b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G11 — Valor contratado por ano */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G11 - Valor Contratado por Ano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g11Data} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Bar dataKey="value" fill="#3b82f6" name="Valor Contratado" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G12 — Por tipo de instrumento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G12 - Por Tipo de Instrumento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.g12Data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.g12Data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#0ea5e9', '#8b5cf6', '#f43f5e', '#14b8a6', '#f59e0b'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G13 — Eventos por região turística */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G13 - Eventos por Região Turística</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g13Data} layout="vertical" margin={{ left: 20 }}>
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

        {/* G15 — Top 15 municípios por valor de eventos */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G15 - Top 15 Municípios</CardTitle>
            <CardDescription>Por valor contratado em eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.g15Data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* G16 — Pagamento de eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">G16 - Pagamento de Eventos</CardTitle>
            <CardDescription>Valores pagos vs pendentes (Eventos)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.g16Data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {data.g16Data.map((entry: any, index: number) => (
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
      </div>
    </div>
  );
}
