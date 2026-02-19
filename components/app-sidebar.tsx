"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  FileText,
  ClipboardList,
  User,
  LogOut,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "Panel",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "analiz_member", "lab_member"],
  },
  {
    label: "Dosya Yukle",
    href: "/dashboard/upload",
    icon: Upload,
    roles: ["admin", "analiz_member"],
  },
  {
    label: "Dokumanlar",
    href: "/dashboard/documents",
    icon: FileText,
    roles: ["admin", "analiz_member", "lab_member"],
  },
  {
    label: "Dokumanlarim",
    href: "/dashboard/my-documents",
    icon: FileText,
    roles: ["lab_member"],
  },
  {
    label: "Talepler",
    href: "/dashboard/requests",
    icon: ClipboardList,
    roles: ["admin", "analiz_member", "lab_member"],
  },
  {
    label: "Profil",
    href: "/dashboard/profile",
    icon: User,
    roles: ["admin", "analiz_member", "lab_member"],
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    analiz_member: "Analiz",
    lab_member: "Proses",
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-sidebar-primary">
          <FlaskConical className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate tracking-tight">
              Kansai Altan
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">
              Lab Sistemi
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-3">
        {navItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
        {/* User info */}
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium truncate text-sidebar-foreground/90">
              {user.name}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50">
              {roleLabels[user.role]}
            </p>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && <span>Cikis Yap</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
