
import { ProcessList } from "@/components/ProcessList";

export default function Processes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os processos de transferência financeira
        </p>
      </div>
      
      <ProcessList />
    </div>
  );
}
