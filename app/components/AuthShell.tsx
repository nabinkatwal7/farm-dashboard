"use client";

import { type CurrentUser, UserProvider } from "@/app/lib/user-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppTopBar from "./AppTopBar";
import Sidebar from "./Sidebar";

type MeResponse = {
  authenticated: boolean;
  setupRequired: boolean;
  user: CurrentUser | null;
};

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/features" ||
    pathname === "/farms" ||
    pathname === "/products" ||
    pathname === "/login" ||
    pathname === "/onboard" ||
    pathname === "/traceability" ||
    pathname.startsWith("/traceability/") ||
    pathname === "/roles" ||
    pathname === "/pricing"
  );
}

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLogin = pathname === "/login";
  const isOnboard = pathname === "/onboard";
  const publicPath = isPublicPath(pathname);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as MeResponse;
      if (!active) return;

      setMe(data);

      if (!data.authenticated && !publicPath) {
        router.replace(data.setupRequired ? "/onboard" : "/login");
      }

      if (data.authenticated && (isLogin || isOnboard)) {
        router.replace("/dashboard");
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [isLogin, isOnboard, publicPath, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (!me && !publicPath) return null;

  if (publicPath) {
    return <>{children}</>;
  }

  return (
    <UserProvider
      user={me?.user ?? null}
      setUser={(user) =>
        setMe((current) => (current ? { ...current, user } : current))
      }
    >
      <div className="min-h-screen lg:flex">
        <Sidebar
          user={me?.user ?? null}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <main
          className={`min-h-screen flex-1 overflow-x-hidden transition-[margin] duration-200 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-[var(--sidebar-width)]"
          }`}
        >
          <AppTopBar
            user={me?.user ?? null}
            onOpenNavigation={() => setMobileNavOpen(true)}
          />
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
