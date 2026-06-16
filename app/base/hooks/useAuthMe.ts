"use client";

import { useQuery } from "@tanstack/react-query";
import { authMeQueryKey } from "@/app/lib/query-client";
import type { CurrentUser } from "@/app/lib/user-context";

export type AuthMeResponse = {
  authenticated: boolean;
  setupRequired: boolean;
  user: CurrentUser | null;
};

async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Unable to load session (${response.status})`);
  }

  return response.json() as Promise<AuthMeResponse>;
}

export function useAuthMe(enabled: boolean) {
  return useQuery({
    queryKey: authMeQueryKey,
    queryFn: fetchAuthMe,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
