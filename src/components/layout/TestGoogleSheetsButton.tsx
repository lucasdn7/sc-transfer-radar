import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function TestGoogleSheetsButton() {
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sheets/test");
      const data = await response.json();
      toast({
        title: "Resultado do Teste Google Sheets",
        description: <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(data, null, 2)}</pre>,
        duration: 8000,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao testar Google Sheets",
        description: error.message || String(error),
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleTest} disabled={loading}>
      {loading ? "Testando..." : "Testar Google Sheets"}
    </Button>
  );
}