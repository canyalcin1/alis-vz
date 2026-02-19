"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FlaskConical, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left - decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
            <FlaskConical className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              Kansai Altan
            </h2>
            <p className="text-[11px] text-sidebar-foreground/50 uppercase tracking-widest">
              Analiz Laboratuvari
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-sidebar-foreground leading-tight text-balance">
            Laboratuvar Yonetim Sistemi
          </h1>
          <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-md">
            Excel analiz raporlarini yukleyin, numune verilerini yonetin ve analiz sonuclarini takip edin.
          </p>
        </div>

        <p className="text-sidebar-foreground/30 text-xs">
          Kansai Altan Lab v1.0
        </p>
      </div>

      {/* Right - login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <FlaskConical className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Kansai Altan
            </span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Giris Yap
            </h2>
            <p className="text-sm text-muted-foreground">
              Hesabiniza giris yapin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@kansaialtan.com"
                required
                className="w-full px-3 py-2.5 rounded-md border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Parola
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolanizi girin"
                  required
                  className="w-full px-3 py-2.5 rounded-md border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Giris yapiliyor..." : "Giris Yap"}
            </button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Demo: admin@kansaialtan.com / lab123456
            </p>
            <p className="text-sm text-muted-foreground">
              Hesabiniz yok mu?{" "}
              <a href="/register" className="text-primary hover:underline font-medium">
                Kayit Ol
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
