
import { useState, useEffect, ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CollapsibleCardProps {
  id: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleCard({ id, children, defaultOpen = true }: CollapsibleCardProps) {
  const storageKey = `dashboard-card-${id}`;
  
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === 'true' : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(isOpen));
    } catch {}
  }, [isOpen, storageKey]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label={isOpen ? "Recolher card" : "Expandir card"}
      >
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-[60px] opacity-100'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
