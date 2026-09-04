import { useLocation, Link } from "react-router-dom";
import { navigationConfig } from "@/config/navigation.config";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent: boolean;
}

export function PageBreadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;

  // Find the current page in the navigation config
  const breadcrumbItems: BreadcrumbItem[] = [];

  // Add home as first item
  breadcrumbItems.push({
    label: "Início",
    href: "/",
    isCurrent: pathname === "/",
  });

  // Find the group and item for current path
  for (const group of navigationConfig) {
    const item = group.items.find((i) => i.href === pathname);
    if (item) {
      // Add group level
      breadcrumbItems.push({
        label: group.title,
        href: undefined, // Group is not clickable
        isCurrent: false,
      });
      // Add item level
      breadcrumbItems.push({
        label: item.name,
        href: item.href,
        isCurrent: true,
      });
      break;
    }
  }

  // If not found in navigation config, just show the path
  if (breadcrumbItems.length === 1 && pathname !== "/") {
    const pathSegments = pathname.split("/").filter(Boolean);
    pathSegments.forEach((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      breadcrumbItems.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: index === pathSegments.length - 1 ? undefined : href,
        isCurrent: index === pathSegments.length - 1,
      });
    });
  }

  // Don't show breadcrumb on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <div key={index} className="flex items-center">
              {index === 0 && (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={item.href || "/"} className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span className="sr-only">Início</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {index > 0 && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {item.isCurrent ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={item.href || "#"}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </>
              )}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}
