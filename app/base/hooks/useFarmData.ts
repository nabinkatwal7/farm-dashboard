"use client";

import { useCallback, useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/app/base/services/farm-client";
import { farmEntityQueryKey } from "@/app/lib/query-client";

type EntityMap = Record<string, string>;

type FarmDataResult<T extends EntityMap> = {
  data: { [K in keyof T]: unknown[] };
  reload: () => Promise<void>;
  loading: boolean;
};

export function useFarmData<T extends EntityMap>(
  entities: T,
): FarmDataResult<T> {
  const queryClient = useQueryClient();

  const entries = useMemo(
    () =>
      (Object.entries(entities) as Array<[keyof T, string]>).map(
        ([key, entity]) => ({ key, entity }),
      ),
    [entities],
  );

  const queries = useQueries({
    queries: entries.map(({ entity }) => ({
      queryKey: farmEntityQueryKey(entity),
      queryFn: () => getData(entity),
    })),
  });

  const data = useMemo(() => {
    const initial = {} as { [K in keyof T]: unknown[] };

    entries.forEach(({ key }, index) => {
      initial[key] = (queries[index]?.data as unknown[] | undefined) ?? [];
    });

    return initial;
  }, [entries, queries]);

  const loading = queries.some(
    (query) => query.isPending && typeof query.data === "undefined",
  );

  const reload = useCallback(async () => {
    const uniqueEntities = [...new Set(entries.map(({ entity }) => entity))];

    await Promise.all(
      uniqueEntities.map((entity) =>
        queryClient.invalidateQueries({
          queryKey: farmEntityQueryKey(entity),
          refetchType: "active",
        }),
      ),
    );
  }, [entries, queryClient]);

  return { data, reload, loading };
}
