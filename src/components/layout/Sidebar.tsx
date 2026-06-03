import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  BarChart3,
  FileText,
  Building,
  MapPin,
  Map,
  Settings,
  Calendar,
  Clock,
  BookOpen,
  Star,
  ClipboardCheck,
  GitBranch,
  BellRing,
  Shield,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Processos", href: "/processes", icon: FileText },
  { name: "Timeline", href: "/process-timeline", icon: Clock },
  { name: "Calendário", href: "/process-calendar", icon: Calendar },
  { name: "Municípios", href: "/municipalities", icon: Building },
  { name: "DART", href: "/dart", icon: ClipboardCheck },
  { name: "Núcleos Regionais", href: "/regional-nuclei", icon: MapPin },
  { name: "Documentação", href: "/documents", icon: BookOpen },
  { name: "Mapa", href: "/map", icon: Map },
  { name: "Fluxograma", href: "/fluxograma", icon: GitBranch },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { userRole } = useAuth();
  const handleContractsDueClick = () => {
    // TODO: implementar ação de vencimentos de contratos.
  };

  return (
    <aside className="flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-colors duration-200">
      <div className="flex h-20 items-center border-b border-border px-4">
        <Link to="/" className="flex min-w-0 items-center gap-3 font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-[var(--accent-green)]">
            <Shield className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-sidebar-foreground">Transfer Radar</span>
            <span className="block truncate text-xs font-medium text-muted-foreground">Santa Catarina</span>
          </span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1.5 p-3">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "h-10 justify-start rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
                  isActive && "border border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)] hover:bg-[var(--accent-green-muted)] hover:text-[var(--accent-green)]"
                )}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            );
          })}

          <Button
            variant="default"
            className="mt-2 h-10 justify-start rounded-xl bg-[var(--accent-green)] px-3 text-sm font-semibold text-black hover:bg-[var(--accent-green)]/90"
            onClick={handleContractsDueClick}
          >
            <BellRing className="mr-2 h-4 w-4" />
            Vencimentos de Contratos
          </Button>

          {userRole === "technical" && (
            <Button
              variant="ghost"
              className={cn(
                "h-10 justify-start rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
                location.pathname === "/favorites" && "border border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)]"
              )}
              asChild
            >
              <Link to="/favorites">
                <Star className="mr-2 h-4 w-4" />
                Favoritos
              </Link>
            </Button>
          )}

          <Separator className="my-3" />

          <Button
            variant="ghost"
            className={cn(
              "h-10 justify-start rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
              location.pathname === "/app-settings" && "border border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)]"
            )}
            asChild
          >
            <Link to="/app-settings">
              <Settings className="mr-2 h-4 w-4" />
              Config. Aplicação
            </Link>
          </Button>
        </nav>
      </ScrollArea>
    </aside>
  );
}
