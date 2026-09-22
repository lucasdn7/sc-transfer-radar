/**
 * Configuração da nova hierarquia de navegação do menu lateral
 * 
 * Esta estrutura define a organização dos itens do menu por grupos.
 * A rota /monitoring/alerts será implementada em etapa futura (Etapa 5/6).
 * 
 * NOTA: /auth e /technical-auth não estão incluídos aqui pois são telas
 * de autenticação fora do shell principal do aplicativo.
 */

import {
  Home,
  FileText,
  Clock,
  Calendar,
  BellRing,
  Building,
  MapPin,
  Map,
  BarChart3,
  ClipboardCheck,
  BookOpen,
  GitBranch,
  Settings,
  Star,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  requiresAuth?: boolean;
  requiredRole?: 'technical' | 'admin' | 'user';
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    title: "Visão geral",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
      },
    ],
  },
  {
    title: "Monitoramento",
    items: [
      {
        name: "Processos",
        href: "/processes",
        icon: FileText,
      },
      {
        name: "Timeline",
        href: "/process-timeline",
        icon: Clock,
      },
      {
        name: "Calendário",
        href: "/process-calendar",
        icon: Calendar,
      },
      {
        name: "Alertas e vencimentos",
        href: "/monitoring/alerts",
        icon: BellRing,
        // Rota NOVA - será implementada na Etapa 5/6
      },
    ],
  },
  {
    title: "Território",
    items: [
      {
        name: "Municípios",
        href: "/municipalities",
        icon: Building,
      },
      {
        name: "Núcleos regionais",
        href: "/regional-nuclei",
        icon: MapPin,
      },
      {
        name: "Mapa",
        href: "/map",
        icon: Map,
      },
    ],
  },
  {
    title: "Análises e relatórios",
    items: [
      {
        name: "Indicadores",
        href: "/indicators",
        icon: TrendingUp,
      },
      {
        name: "Gráficos",
        href: "/charts",
        icon: BarChart3,
      },
      {
        name: "Relatórios e exportações",
        href: "/reports",
        icon: FileText,
      },
    ],
  },
  {
    title: "Apoio",
    items: [
      {
        name: "DART",
        href: "/dart",
        icon: ClipboardCheck,
      },
      {
        name: "Documentação",
        href: "/documents",
        icon: BookOpen,
      },
      {
        name: "Fluxograma",
        href: "/fluxograma",
        icon: GitBranch,
      },
    ],
  },
  {
    title: "Administração",
    items: [
      {
        name: "Configurações",
        href: "/settings",
        icon: Settings,
      },
      {
        name: "Configuração da aplicação",
        href: "/app-settings",
        icon: Settings,
      },
      {
        name: "Favoritos",
        href: "/favorites",
        icon: Star,
        requiredRole: "technical", // Apenas usuários com role "technical"
      },
    ],
  },
];
