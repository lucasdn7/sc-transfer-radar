import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, Filter, Layers, Settings, ZoomIn, ZoomOut, RotateCcw, Link2, ArrowRight, Building, MapPin as MapPinIcon, ExternalLink } from "lucide-react";
import { ExternalMapIframe } from "@/components/map/ExternalMapIframe";
import { Link } from "react-router-dom";

export default function Map() {
  const [mapUrl, setMapUrl] = useState<string>(import.meta.env.VITE_MAPA_URL || 'https://mapa-de-convenios.vercel.app/');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa Interativo</h1>
        <p className="text-muted-foreground">
          Visualize as transferências financeiras geograficamente
        </p>
      </div>

      {/* Navegação contextual para outras telas de Território */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Navegação Rápida - Território</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/municipalities">
                <Building className="h-3 w-3 mr-1" />
                Municípios
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/regional-nuclei">
                <MapPinIcon className="h-3 w-3 mr-1" />
                Núcleos Regionais
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Área do Mapa */}
        <Card className="h-[800px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Convênios
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="ml-auto"
              >
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em nova aba
                </a>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full p-4">
            <ExternalMapIframe mapUrl={mapUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
