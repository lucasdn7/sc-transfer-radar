
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
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
      );
    }
    
    if (chartType === 'line') {
      return (
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`${value} processos`, 'Processos']}
          />
          <Line type="monotone" dataKey="processos" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      );
    }
    
    if (chartType === 'pie') {
      return (
        <PieChart>
          <Pie
            data={monthlyData}
            dataKey="processos"
            nameKey="month"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ month, processos }) => `${month}: ${processos}`}
          >
            {monthlyData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280", "#ef4444"][idx % 6]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} processos`, 'Processos']} />
        </PieChart>
      );
    }
    
    return null;
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Processos por Mês</CardTitle>
          <Select value={chartType} onValueChange={(value: 'bar' | 'line' | 'pie') => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="line">Linhas</SelectItem>
              <SelectItem value="pie">Pizza</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
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

export function RegionChart({ 
  regionalData = [], 
  processes = [] 
}: { 
  regionalData?: Array<{ region: string; count: number; value: number }>;
  processes?: Array<any>;
}) {
  const [metric, setMetric] = useState<'count' | 'value' | 'total_value' | 'concedente_value' | 'proponente_value' | 'remaining_value'>('count');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [groupBy, setGroupBy] = useState<'municipality' | 'regional_nucleus' | 'region'>('municipality');

  // Preparar dados baseado no groupBy selecionado
  const prepareData = () => {
    const dataMap: Record<string, any> = {};
    
    processes.forEach((process: any) => {
      let key = 'Não definido';
      
      if (groupBy === 'municipality') {
        key = process.municipalities?.name || 'Não definido';
      } else if (groupBy === 'regional_nucleus') {
        key = process.regional_nuclei?.name || 'Não definido';
      } else if (groupBy === 'region') {
        key = process.regional_nuclei?.name || 'Não definido'; // Pode ser refinado se houver dados de região
      }
      
      if (!dataMap[key]) {
        dataMap[key] = {
          name: key,
          count: 0,
          value: 0,
          total_value: 0,
          concedente_value: 0,
          proponente_value: 0,
          remaining_value: 0,
        };
      }
      
      dataMap[key].count += 1;
      dataMap[key].total_value += process.total_portaria_value || 0;
      dataMap[key].concedente_value += process.total_concedente_value || 0;
      dataMap[key].proponente_value += process.total_proponente_value || 0;
      
      // Calcular saldo a repassar (assumindo parcelas pagas)
      const parcelas = process.process_parcels || [];
      const valorPago = parcelas
        .filter((p: any) => p.payment_date)
        .reduce((sum: number, p: any) => sum + (p.value || 0), 0);
      dataMap[key].remaining_value += Math.max(0, (process.total_concedente_value || 0) - valorPago);
    });

    return Object.values(dataMap);
  };

  const chartData = processes.length > 0 ? prepareData() : regionalData.map(r => ({ 
    name: r.region, 
    count: r.count, 
    value: r.value,
    total_value: r.value,
    concedente_value: r.value * 0.8, // Estimativa
    proponente_value: r.value * 0.2, // Estimativa
    remaining_value: r.value * 0.3, // Estimativa
  }));

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey={metric} />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip 
            formatter={(value) => {
              if (metric === 'count') return [`${value} processos`, 'Processos'];
              return [`R$ ${Number(value).toLocaleString('pt-BR')}`, getMetricLabel(metric)];
            }}
          />
          <Bar dataKey={metric} fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      );
    }
    
    if (chartType === 'line') {
      return (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value) => {
              if (metric === 'count') return [`${value} processos`, 'Processos'];
              return [`R$ ${Number(value).toLocaleString('pt-BR')}`, getMetricLabel(metric)];
            }}
          />
          <Line type="monotone" dataKey={metric} stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      );
    }
    
    if (chartType === 'pie') {
      return (
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
          <Tooltip 
            formatter={(value) => {
              if (metric === 'count') return [`${value} processos`, 'Processos'];
              return [`R$ ${Number(value).toLocaleString('pt-BR')}`, getMetricLabel(metric)];
            }}
          />
        </PieChart>
      );
    }
    
    return null;
  };

  const getMetricLabel = (metric: string) => {
    const labels = {
      count: 'Processos',
      value: 'Valor Total',
      total_value: 'Valor Total',
      concedente_value: 'Valor Concedente',
      proponente_value: 'Valor Proponente',
      remaining_value: 'Saldo a Repassar'
    };
    return labels[metric as keyof typeof labels] || 'Valor';
  };

  const getGroupByLabel = (groupBy: string) => {
    const labels = {
      municipality: 'Municípios',
      regional_nucleus: 'Núcleos Regionais',
      region: 'Regiões'
    };
    return labels[groupBy as keyof typeof labels] || 'Agrupamento';
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Processos por {getGroupByLabel(groupBy)}</CardTitle>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="municipality">Municípios</SelectItem>
              <SelectItem value="regional_nucleus">Núcleos</SelectItem>
              <SelectItem value="region">Regiões</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Processos</SelectItem>
              <SelectItem value="total_value">Valor Total</SelectItem>
              <SelectItem value="concedente_value">Concedente</SelectItem>
              <SelectItem value="proponente_value">Proponente</SelectItem>
              <SelectItem value="remaining_value">Saldo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="line">Linhas</SelectItem>
              <SelectItem value="pie">Pizza</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
