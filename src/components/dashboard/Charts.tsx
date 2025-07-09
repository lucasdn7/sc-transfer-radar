
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const monthlyData = [
  { month: 'Jan', processos: 45, valor: 12500000 },
  { month: 'Fev', processos: 52, valor: 15800000 },
  { month: 'Mar', processos: 48, valor: 14200000 },
  { month: 'Abr', processos: 61, valor: 18900000 },
  { month: 'Mai', processos: 55, valor: 16700000 },
  { month: 'Jun', processos: 67, valor: 21200000 },
];

const statusData = [
  { name: 'Em Análise', value: 35, color: '#f59e0b' },
  { name: 'Aprovados', value: 28, color: '#10b981' },
  { name: 'Em Execução', value: 22, color: '#8b5cf6' },
  { name: 'Finalizados', value: 15, color: '#6b7280' },
];

const regionData = [
  { region: 'Grande Florianópolis', processos: 89 },
  { region: 'Norte', processos: 76 },
  { region: 'Vale do Itajaí', processos: 68 },
  { region: 'Oeste', processos: 52 },
  { region: 'Sul', processos: 45 },
];

export function ProcessChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Processos por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'processos' ? `${value} processos` : `R$ ${(value as number).toLocaleString('pt-BR')}`,
                name === 'processos' ? 'Processos' : 'Valor Total'
              ]}
            />
            <Bar dataKey="processos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function StatusChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Status dos Processos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RegionChart({ regionalData = [] }: { regionalData?: Array<{ region: string; count: number; value: number }> }) {
  const [metric, setMetric] = useState<'count' | 'value'>('count');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const chartData = regionalData.map(r => ({ name: r.region, count: r.count, value: r.value }));

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Processos por Região</CardTitle>
        <div className="flex gap-2 items-center">
          <select className="border rounded px-2 py-1 text-xs" value={metric} onChange={e => setMetric(e.target.value as any)}>
            <option value="count">Quantidade</option>
            <option value="value">Valor Total</option>
          </select>
          <select className="border rounded px-2 py-1 text-xs" value={chartType} onChange={e => setChartType(e.target.value as any)}>
            <option value="bar">Barras</option>
            <option value="line">Linhas</option>
            <option value="pie">Pizza</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          {chartType === 'bar' && (
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey={metric} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey={metric} fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          )}
          {chartType === 'line' && (
            <LineChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey={metric} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Line type="monotone" dataKey={metric} stroke="#3b82f6" />
            </LineChart>
          )}
          {chartType === 'pie' && (
            <PieChart>
              <Pie
                data={chartData}
                dataKey={metric}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"][idx % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
