import { Link, useLocation } from "wouter";
import { Shield, FileText, Activity, Home, Search, LogOut } from "lucide-react";
import { ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-sidebar-foreground">EVIDENCE_CHAIN</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">v2.1.0-secure</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-2 mt-4 space-y-1">
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton isActive={location === "/"} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-medium tracking-wide">
                    <Home className="h-4 w-4" />
                    <span>Command Center</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/evidence">
                  <SidebarMenuButton isActive={location.startsWith("/evidence") && !location.startsWith("/evidence/new")} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-medium tracking-wide">
                    <FileText className="h-4 w-4" />
                    <span>Evidence Vault</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/custody">
                  <SidebarMenuButton isActive={location === "/custody"} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-medium tracking-wide">
                    <Activity className="h-4 w-4" />
                    <span>Custody Ledger</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/verify">
                  <SidebarMenuButton isActive={location === "/verify"} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-medium tracking-wide">
                    <Search className="h-4 w-4" />
                    <span>Public Verification</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center border border-border">
                <span className="text-xs font-bold">OP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Operator_74</span>
                <span className="text-[10px] text-muted-foreground font-mono">ID: 9481-A</span>
              </div>
              <LogOut className="h-4 w-4 text-muted-foreground ml-auto cursor-pointer hover:text-primary transition-colors" />
            </div>
          </div>
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger className="-ml-2 mr-4" />
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground ml-auto">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]"></span>
              NODE: CONNECTED_SECURE
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
