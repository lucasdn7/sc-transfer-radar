import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { PageBreadcrumb } from "./Breadcrumb";
import { useTheme } from "@/hooks/useTheme";
import { Assistente } from "@/pages/Assistente";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { layoutPosition } = useTheme();

  const handleMenuToggle = () => setIsMobileMenuOpen((open) => !open);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  if (layoutPosition === "top") {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <TopHeader />
        <main className="min-w-0 pt-20 lg:pt-32">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6 lg:px-8 xl:px-10">
            <PageBreadcrumb />
            {children}
          </div>
        </main>
        <Assistente />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Header
        onMenuToggle={handleMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[min(16rem,85vw)] p-0 sm:max-w-none lg:hidden">
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <Sidebar collapsible={false} onNavigate={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <Sidebar onCollapseChange={handleSidebarCollapse} />
      </div>

      <main className={`min-w-0 pt-20 transition-all duration-200 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6 lg:px-8 xl:px-10">
          <PageBreadcrumb />
          {children}
        </div>
      </main>
      <Assistente />
    </div>
  );
}
