import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { PageBreadcrumb } from "./Breadcrumb";
import { useTheme } from "@/hooks/useTheme";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { layoutPosition } = useTheme();

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSidebarClose = () => {
    setIsMobileMenuOpen(false);
  };

  if (layoutPosition === "top") {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <TopHeader />
        <main className="pt-32">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 lg:px-10">
            <PageBreadcrumb />
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={handleSidebarClose}></div>
          <div className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="hidden md:fixed md:inset-y-0 md:flex md:flex-col">
        <Sidebar />
      </div>

      <main className="pt-20 md:pl-16 transition-all duration-200">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 lg:px-10">
          <PageBreadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
