"use client";

import { useAuthMe } from "@/app/base/hooks/useAuthMe";
import { type CurrentUser, UserProvider } from "@/app/lib/user-context";
import { authMeQueryKey } from "@/app/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppTopBar from "./AppTopBar";
import Sidebar from "./Sidebar";

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/features" ||
    pathname === "/farms" ||
    pathname === "/products" ||
    pathname === "/login" ||
    pathname === "/onboard" ||
    pathname === "/roles" ||
    pathname === "/pricing" ||
    pathname === "/traceability" ||
    pathname.startsWith("/traceability/")
  );
}

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLogin = pathname === "/login";
  const isOnboard = pathname === "/onboard";
  const publicPath = isPublicPath(pathname);
  const shouldCheckSession = !publicPath || isLogin || isOnboard;
  const sessionQuery = useAuthMe(shouldCheckSession);
  const me = sessionQuery.data ?? null;

  useEffect(() => {
    if (!shouldCheckSession) return;

    if (sessionQuery.isError) {
      router.replace("/login");
      return;
    }

    if (!sessionQuery.data) return;

    if (!sessionQuery.data.authenticated && !publicPath) {
      router.replace(sessionQuery.data.setupRequired ? "/onboard" : "/login");
    }

    if (sessionQuery.data.authenticated && (isLogin || isOnboard)) {
      router.replace("/dashboard");
    }
  }, [isLogin, isOnboard, publicPath, router, sessionQuery.data, sessionQuery.isError, shouldCheckSession]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (sessionQuery.isError && !publicPath) {
    return null;
  }

  if (publicPath) {
    return <>{children}</>;
  }

  const sessionResolved = !shouldCheckSession || sessionQuery.isSuccess;
  const currentUser = me?.user ?? null;

  return (
    <UserProvider
      user={currentUser}
      setUser={(user) => {
        queryClient.setQueryData(authMeQueryKey, (current: typeof me) =>
          current
            ? { ...current, authenticated: Boolean(user), user }
            : { authenticated: Boolean(user), setupRequired: false, user },
        );
      }}
    >
      <div className="min-h-screen bg-background lg:flex">
        <Sidebar
          user={currentUser}
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
            user={currentUser}
            onOpenNavigation={() => setMobileNavOpen(true)}
          />
          {sessionResolved ? (
            children
          ) : (
            <div className="px-4 py-6 sm:px-6 lg:px-6">
              <div className="mx-auto max-w-6xl space-y-4">
                <div className="h-8 w-48 animate-pulse rounded-xl bg-card-hover" />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="surface-panel h-24 animate-pulse"
                    />
                  ))}
                </div>
                <div className="surface-panel h-[420px] animate-pulse" />
              </div>
            </div>
          )}
        </main>
      </div>
    </UserProvider>
  );
}
