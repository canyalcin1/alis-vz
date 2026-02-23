"use client";

import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth-context";
import { UserManagement } from "@/components/user-management";
import { User, Mail, Building, Shield } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  analiz_member: "Analiz Lab. Üyesi",
  lab_member: "Laboratuvar Üyesi",
};

const LAB_LABELS: Record<string, string> = {
  admin: "Yönetim",
  analiz: "Analiz Laboratuvarı",
  proses: "Proses Laboratuvarı",
  otomotiv: "Otomotiv Laboratuvarı",
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
      <div className="p-6 max-w-5xl mx-auto space-y-8">

        {/* Avatar Kartı */}
        <div className="flex items-center gap-4 p-6 rounded-xl bg-card border border-border shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-sm">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              {user.name}
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>

        {/* Bilgi Grid'i */}
        <div className="rounded-xl bg-card border border-border divide-y divide-border shadow-sm">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 px-6 py-4"
            >
              <item.icon className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-card-foreground mt-1">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Rol Yetkileri */}
        <div className="rounded-xl bg-card border border-border p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">
            Sahip Olduğunuz Yetkiler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
            {user.role === "admin" && (
              <>
                <Capability text="Tüm sayfalara erişim" />
                <Capability text="Dosya yükleme ve silme" />
                <Capability text="Erişim taleplerini yönetme" />
                <Capability text="Kullanıcı ve Yetki yönetimi" />
                <Capability text="Tüm numune verilerine tam erişim" />
              </>
            )}
            {user.role === "analiz_member" && (
              <>
                <Capability text="Dosya yükleme" />
                <Capability text="Erişim taleplerini yönetme" />
                <Capability text="Tüm numune verilerine tam erişim" />
                <Capability text="Dokümanlara lab içi not ekleme" />
                <Capability text="Kullanıcı ve Yetki yönetimi" />
              </>
            )}
            {user.role === "lab_member" && (
              <>
                <Capability text="Dokümanları görüntüleme (Kısıtlı)" />
                <Capability text="Kısıtlı analizler için erişim talebi oluşturma" />
                <Capability text="Kendine ait erişim onaylarını görüntüleme" />
              </>
            )}
          </div>
        </div>

        {/* Sadece Admin ve Analiz Lab Üyeleri İçin Kullanıcı Yönetimi Tablosu */}
        {(user.role === "admin" || user.role === "analiz_member") && (
          <div className="pt-6">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  );
}

// Ufak yeşil onay noktalı yetki componenti
function Capability({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-success shrink-0" />
      <span className="font-medium text-foreground">{text}</span>
    </div>
  );
}