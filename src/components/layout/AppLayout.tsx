
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
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

  if (layoutPosition === 'top') {
    return (
      <div className="min-h-screen bg-background">
        <TopHeader />
        <main className="pt-28">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      <Sidebar isOpen={isMobileMenuOpen} onClose={handleSidebarClose} />
      
      <main className="md:pl-64 pt-16">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
