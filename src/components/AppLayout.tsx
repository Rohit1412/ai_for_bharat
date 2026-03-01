import { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard, BarChart3, AlertTriangle, Users,
  FileText, Settings, Zap, Leaf, Search, Bell, LogOut,
  ClipboardList, Brain, Activity, Earth, Database, Wind,
  Beaker, GitCompareArrows, TrendingUp, Loader2, X
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: Database, label: "Emissions Data", to: "/global-overview" },
  { icon: BarChart3, label: "Analytics", to: "/analytics" },
  { icon: Zap, label: "Action Plans", to: "/action-plans" },
  { icon: AlertTriangle, label: "Alerts", to: "/alerts" },
  { icon: Earth, label: "Emissions Globe", to: "/emissions-globe" },
  { icon: Wind, label: "Air Quality", to: "/air-quality" },
  { icon: Users, label: "Stakeholders", to: "/stakeholders" },
  { icon: Brain, label: "AI Scenarios", to: "/scenarios" },
  { icon: TrendingUp, label: "AI Forecast", to: "/forecast" },
  { icon: Beaker, label: "Researcher Toolkit", to: "/toolkit" },
  { icon: GitCompareArrows, label: "Data Comparison", to: "/compare" },
  { icon: FileText, label: "Reports", to: "/reports" },
  { icon: Activity, label: "Activity Feed", to: "/activity" },
  { icon: Settings, label: "Settings", to: "/settings" },
  { icon: ClipboardList, label: "Audit Log", to: "/audit-log" },
];

function AppSidebar() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground tracking-tight truncate">ClimateAI</h1>
              <p className="text-xs text-muted-foreground truncate">Global Coordinator</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-foreground">System Online</span>
            </div>
            <p className="text-xs text-muted-foreground">Processing 2.4M data points</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sign Out">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}

const AppLayout = () => {
  const { profile } = useProfile();

  // AI Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{ role: string; content: string }>>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    setSearchOpen(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-search", {
        body: { question: searchQuery, history: searchHistory.slice(-6) },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      const newHistory = [
        ...searchHistory,
        { role: "user", content: searchQuery },
        { role: "assistant", content: result.answer },
      ];
      setSearchHistory(newHistory);
      setSearchResult(result);
    } catch (e: any) {
      setSearchResult({ answer: `Error: ${e.message}` });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-4 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Climate Command Center</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last sync: Feb 26, 2026 · 14:32 UTC · <span className="text-primary">All systems nominal</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* AI-Powered Search */}
                <div className="relative hidden sm:block" ref={searchRef}>
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() => searchResult && setSearchOpen(true)}
                    placeholder="Ask AI: emissions, plans, alerts..."
                    className="bg-muted border-none rounded-lg pl-9 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-72"
                  />
                  {searchLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                  {!searchLoading && searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setSearchResult(null); setSearchOpen(false); setSearchHistory([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Search Results Popover */}
                  {searchOpen && searchResult && (
                    <div className="absolute top-full mt-2 right-0 w-96 glass-card rounded-xl p-4 shadow-xl z-50 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-primary flex items-center gap-1.5">
                          <Brain className="w-3 h-3" /> AI Search Result
                        </span>
                        <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{searchResult.answer}</p>
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground">Press Enter to ask another question</p>
                      </div>
                    </div>
                  )}
                </div>

                <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
