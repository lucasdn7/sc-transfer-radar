import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Inconsistency {
  type: 'duplicate_cnpj' | 'similar_name' | 'duplicate_name';
  description: string;
  municipalities: any[];
}

export default function TerritorialInconsistencies() {
  const [analysisDone, setAnalysisDone] = useState(false);

  // Buscar todos os municípios para análise
  const { data: municipalities, isLoading } = useQuery({
    queryKey: ['municipalities-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('municipalities')
        .select(`
          *,
          regional_nuclei (name, acronym),
          regioes (nome, sigla)
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Analisar inconsistências
  const inconsistencies: Inconsistency[] = [];
  
  if (municipalities && !analysisDone) {
    setAnalysisDone(true);

    // 1. CNPJ duplicado
    const cnpjMap = new Map<string, any[]>();
    municipalities.forEach(m => {
      if (m.cnpj) {
        const normalizedCnpj = m.cnpj.replace(/\D/g, '');
        if (!cnpjMap.has(normalizedCnpj)) {
          cnpjMap.set(normalizedCnpj, []);
        }
        cnpjMap.get(normalizedCnpj)!.push(m);
      }
    });

    cnpjMap.forEach((muns, cnpj) => {
      if (muns.length > 1) {
        inconsistencies.push({
          type: 'duplicate_cnpj',
          description: `CNPJ duplicado: ${cnpj}`,
          municipalities: muns,
        });
      }
    });

    // 2. Nomes duplicados (exato)
    const nameMap = new Map<string, any[]>();
    municipalities.forEach(m => {
      const normalizedName = m.name.toLowerCase().trim();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(m);
    });

    nameMap.forEach((muns, name) => {
      if (muns.length > 1) {
        inconsistencies.push({
          type: 'duplicate_name',
          description: `Nome duplicado: ${name}`,
          municipalities: muns,
        });
      }
    });

    // 3. Nomes similares (sem acentuação)
    const removeAccents = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    const similarNameMap = new Map<string, any[]>();
    municipalities.forEach(m => {
      const similarName = removeAccents(m.name);
      if (!similarNameMap.has(similarName)) {
        similarNameMap.set(similarName, []);
      }
      similarNameMap.get(similarName)!.push(m);
    });

    similarNameMap.forEach((muns, name) => {
      if (muns.length > 1) {
        // Verificar se não é o mesmo nome exato (já tratado acima)
        const uniqueNames = new Set(muns.map(m => m.name.toLowerCase()));
        if (uniqueNames.size > 1) {
          inconsistencies.push({
            type: 'similar_name',
            description: `Nomes similares (diferença de acentuação/maiúsculas): ${name}`,
            municipalities: muns,
          });
        }
      }
    });
  }

  const getInconsistencyIcon = (type: string) => {
    switch (type) {
      case 'duplicate_cnpj':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'duplicate_name':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'similar_name':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInconsistencyBadge = (type: string) => {
    switch (type) {
      case 'duplicate_cnpj':
        return <Badge variant="destructive">CNPJ Duplicado</Badge>;
      case 'duplicate_name':
        return <Badge variant="destructive">Nome Duplicado</Badge>;
      case 'similar_name':
        return <Badge variant="secondary">Nome Similar</Badge>;
      default:
        return <Badge variant="outline">Outro</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/municipalities">Municípios</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Relatório de Inconsistências</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/municipalities">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Municípios
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Inconsistências Territoriais</h1>
          <p className="text-muted-foreground">
            Análise de dados cadastrais de municípios
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total de Municípios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{municipalities?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Inconsistências Encontradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inconsistencies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Status da Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Concluída</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Inconsistências */}
      {inconsistencies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma inconsistência encontrada
            </h3>
            <p className="text-gray-600">
              Os dados dos municípios parecem estar consistentes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inconsistencies.map((inc, index) => (
            <Card key={index} className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getInconsistencyIcon(inc.type)}
                    <CardTitle className="text-lg">{inc.description}</CardTitle>
                  </div>
                  {getInconsistencyBadge(inc.type)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inc.municipalities.map((m) => (
                    <div key={m.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-sm text-gray-600">
                            ID: {m.id} • CNPJ: {m.cnpj || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Região: {m.regioes?.nome || 'N/A'} • Núcleo: {m.regional_nuclei?.name || 'N/A'}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/municipalities/${m.id}`}>
                            Ver Detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Nota */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong>Nota:</strong> Este relatório identifica inconsistências nos dados cadastrais, mas não realiza correções automáticas.
              As inconsistências encontradas devem ser revisadas manualmente e corrigidas conforme necessário.
              Nenhuma alteração foi feita nos dados originais.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
