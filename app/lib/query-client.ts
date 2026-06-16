"use client";

import { QueryClient } from "@tanstack/react-query";

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        gcTime: THIRTY_MINUTES,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function farmEntityQueryKey(entity: string, farmId?: string) {
  return farmId ? (["farm-entity", farmId, entity] as const) : (["farm-entity", entity] as const);
}

export function clearFarmQueries(queryClient: QueryClient, farmId?: string) {
  if (farmId) {
    queryClient.removeQueries({ queryKey: ["farm-entity", farmId] });
  } else {
    queryClient.removeQueries({ queryKey: ["farm-entity"] });
  }
}

export const authMeQueryKey = ["auth-me"] as const;
