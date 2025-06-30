
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

export function RegionChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Processos por Região</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={regionData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="region" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="processos" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
