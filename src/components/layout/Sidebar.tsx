import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight, ChevronDown, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/config/navigation.config";
import { useState, useEffect } from "react";

export function Sidebar() {
  const location = useLocation();
  const { userRole } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Auto-expand group containing current page
  useEffect(() => {
    const currentPath = location.pathname;
    navigationConfig.forEach((group) => {
      const hasActiveRoute = group.items.some(
        (item) => item.href === currentPath
      );
      if (hasActiveRoute) {
        setExpandedGroups((prev) => new Set([...prev, group.title]));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return newSet;
    });
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={cn(
      "flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-colors duration-200",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-20 items-center border-b border-border px-4">
        <Link to="/" className="flex min-w-0 items-center gap-3 font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-[var(--accent-green)] flex-shrink-0">
            <Shield className="h-5 w-5" />
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-sidebar-foreground">Transfer Radar</span>
              <span className="block truncate text-xs font-medium text-muted-foreground">Santa Catarina</span>
            </span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-1 p-2">
            {navigationConfig.map((group) => {
              const isExpanded = expandedGroups.has(group.title);
              const hasActiveRoute = group.items.some(
                (item) => item.href === location.pathname
              );

              // Filter items based on user role
              const filteredItems = group.items.filter((item) => {
                if (item.requiredRole === "technical" && userRole !== "technical") {
                  return false;
                }
                return true;
              });

              // Skip group if no items after filtering
              if (filteredItems.length === 0) return null;

              return (
                <Collapsible
                  key={group.title}
                  open={isExpanded || hasActiveRoute}
                  onOpenChange={() => toggleGroup(group.title)}
                  className="group"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex h-8 w-8 items-center justify-center">
                              <ChevronRight className="h-4 w-4 transition-transform" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{group.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <>
                          <span className="flex-1 text-left">{group.title}</span>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-2">
                    {filteredItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Button
                          key={item.name}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-foreground",
                            isActive && "border border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)] hover:bg-[var(--accent-green-muted)] hover:text-[var(--accent-green)]",
                            isCollapsed && "justify-center px-2"
                          )}
                          asChild
                        >
                          <Link to={item.href}>
                            {isCollapsed ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex h-8 w-8 items-center justify-center">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>{item.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <>
                                <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="flex-1">{item.name}</span>
                              </>
                            )}
                          </Link>
                        </Button>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Collapse toggle button */}
      <div className="border-t border-border p-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-center rounded-lg",
                  !isCollapsed && "justify-start px-2"
                )}
                onClick={toggleCollapse}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    <span>Recolher menu</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" hidden={isCollapsed}>
              <p>Expandir menu</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
