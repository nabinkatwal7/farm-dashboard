"use client";

import { useCallback, useEffect, useState } from "react";
import { getData } from "@/app/base/services/farm-client";

type EntityMap = Record<string, string>;

type FarmDataResult<T extends EntityMap> = {
  data: { [K in keyof T]: unknown[] };
  reload: () => Promise<void>;
};

export function useFarmData<T extends EntityMap>(
  entities: T,
): FarmDataResult<T> {
  const [data, setData] = useState<{ [K in keyof T]: unknown[] }>(() => {
    const initial = {} as { [K in keyof T]: unknown[] };
    for (const key of Object.keys(entities) as Array<keyof T>) {
      initial[key] = [];
    }
    return initial;
  });

  const reload = useCallback(async () => {
    const entries = await Promise.all(
      (Object.entries(entities) as Array<[keyof T, string]>).map(
        async ([key, entity]) => [key, await getData(entity)] as const,
      ),
    );

    setData(Object.fromEntries(entries) as { [K in keyof T]: unknown[] });
  }, [entities]);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  return { data, reload };
}

