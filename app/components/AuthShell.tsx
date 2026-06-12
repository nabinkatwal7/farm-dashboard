"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppTopBar from "./AppTopBar";
import Sidebar from "./Sidebar";
import { type CurrentUser, UserProvider } from "@/app/lib/user-context";

type MeResponse = {
  authenticated: boolean;
  setupRequired: boolean;
  user: CurrentUser | null;
};

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);

  const isLogin = pathname === "/login";

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as MeResponse;
      if (!active) return;

      setMe(data);

      if (!data.authenticated && !isLogin) {
        router.replace("/login");
      }

      if (data.authenticated && isLogin) {
        router.replace("/");
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [isLogin, router]);

  if (!me && !isLogin) return null;

  if (isLogin) {
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
        <Sidebar user={me?.user ?? null} />
        <main className="min-h-screen flex-1 overflow-x-hidden lg:ml-[var(--sidebar-width)]">
          <AppTopBar user={me?.user ?? null} />
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
