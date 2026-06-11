"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

type MeResponse = {
  authenticated: boolean;
  setupRequired: boolean;
  user: null | {
    id: string;
    email: string;
    name: string;
    role: string;
    farm: {
      name: string;
      location: string | null;
      acreage: number | null;
    };
  };
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
    <>
      <Sidebar user={me?.user ?? null} />
      <main
        style={{
          flex: 1,
          marginLeft: "var(--sidebar-width)",
          minHeight: "100vh",
          overflow: "auto",
        }}
      >
        {children}
      </main>
    </>
  );
}
