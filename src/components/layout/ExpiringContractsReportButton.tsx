import { useState } from "react";
import { AlertTriangle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type ContractRow = {
  numero?: string;
  objeto?: string;
  municipio?: string;
  dataVencimento?: string;
  diasParaVencer?: number | string;
};

type ReportResponse = {
  contracts?: ContractRow[];
  contratos?: ContractRow[];
  report?: ContractRow[];
  generatedAt?: string;
  generated_at?: string;
};

function sanitize(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r?\n|;/g, " ").trim();
}

function buildCsv(contracts: ContractRow[]) {
  const header = ["Número", "Objeto", "Município", "Data de vencimento", "Dias para vencer"];

  const rows = contracts.map((contract) => [
    sanitize(contract.numero),
    sanitize(contract.objeto),
    sanitize(contract.municipio),
    sanitize(contract.dataVencimento),
    sanitize(contract.diasParaVencer),
  ]);

  return [header, ...rows].map((row) => row.join(";")).join("\n");
}

function downloadReportCsv(content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `relatorio-vencimentos-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExpiringContractsReportButton() {
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/vencimento-relatorio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "transfer-radar" }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        const fallbackText = await response.text();
        throw new Error(fallbackText || "Falha ao emitir o relatório de vencimento.");
      }

      if (!contentType.includes("application/json")) {
        throw new Error("O serviço externo não retornou um JSON válido.");
      }

      const data: ReportResponse = await response.json();
      const contracts = data.contracts || data.contratos || data.report || [];

      if (!Array.isArray(contracts) || contracts.length === 0) {
        toast({
          title: "Relatório emitido",
          description: "Nenhum contrato próximo do vencimento foi encontrado.",
        });
        return;
      }

      const csvContent = buildCsv(contracts);
      downloadReportCsv(csvContent);

      toast({
        title: "Relatório emitido com sucesso",
        description: `${contracts.length} contrato(s) com vencimento próximo foram exportados em CSV.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao emitir relatório",
        description: error instanceof Error ? error.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleGenerateReport}
      disabled={loading}
      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
    >
      {loading ? (
        <>
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          Emitindo relatório...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Enviar relatório de vencimento
        </>
      )}
    </Button>
  );
}
