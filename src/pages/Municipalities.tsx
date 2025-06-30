
import { MunicipalityList } from "@/components/MunicipalityList";

export default function Municipalities() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Municípios</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie informações dos municípios de Santa Catarina
        </p>
      </div>
      
      <MunicipalityList />
    </div>
  );
}
