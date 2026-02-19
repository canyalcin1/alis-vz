"use client";

import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth-context";
import { UserManagement } from "@/components/user-management";
import { User, Mail, Building, Shield } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  analiz_member: "Analiz Lab. Uyesi",
  lab_member: "Laboratuvar Uyesi",
};

const LAB_LABELS: Record<string, string> = {
  admin: "Yonetim",
  analiz: "Analiz Laboratuvari",
  proses: "Proses Laboratuvari",
  otomotiv: "Otomotiv Laboratuvari",
};

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const infoItems = [
    {
      icon: User,
      label: "Ad Soyad",
      value: user.name,
    },
    {
      icon: Mail,
      label: "E-posta",
      value: user.email,
    },
    {
      icon: Building,
      label: "Departman",
      value: user.department || LAB_LABELS[user.lab] || user.lab,
    },
    {
      icon: Shield,
      label: "Rol",
      value: ROLE_LABELS[user.role] || user.role,
    },
  ];

  return (
    <div>
      <AppHeader title="Profil" />
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Avatar card */}
        <div className="flex items-center gap-4 p-6 rounded-lg bg-card border border-border">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              {user.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div className="rounded-lg bg-card border border-border divide-y divide-border">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-5 py-4"
            >
              <item.icon className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-card-foreground mt-0.5">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Role capabilities */}
        <div className="rounded-lg bg-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-medium text-card-foreground">
            Yetki Bilgisi
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            {user.role === "admin" && (
              <>
                <Capability text="Tum sayfalara erisim" />
                <Capability text="Dosya yukleme ve silme" />
                <Capability text="Erisim taleplerini yonetme" />
                <Capability text="Kullanici yonetimi" />
                <Capability text="Tum numune verilerine erisim" />
              </>
            )}
            {user.role === "analiz_member" && (
              <>
                <Capability text="Dosya yukleme" />
                <Capability text="Erisim taleplerini yonetme" />
                <Capability text="Tum numune verilerine erisim" />
                <Capability text="Dokumanlara not ekleme" />
              </>
            )}
            {user.role === "lab_member" && (
              <>
                <Capability text="Dokumanlari goruntuleme (kisitli)" />
                <Capability text="Erisim talebi olusturma" />
                <Capability text="Dokumanlara not ekleme" />
              </>
            )}
          </div>
        </div>

        {/* User Management for Admins */}
        {user.role === "admin" && (
          <div className="pt-4">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  );
}

function Capability({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-success" />
      <span>{text}</span>
    </div>
  );
}
