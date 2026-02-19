"use client";

import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/notification-bell";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import { Search } from "lucide-react";

export function AppHeader({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
      <h1 className="text-lg font-semibold text-card-foreground tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ara..."
            className="pl-9 pr-4 py-1.5 text-sm rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-56"
          />
        </div>
        <NotificationBell />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
