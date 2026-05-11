import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Filter = { column: string; value: string } | null;

/**
 * Subscribe to a Supabase table with optional filter and live updates.
 * Returns rows ordered by `orderBy` (default: created_at desc).
 */
export function useRealtimeTable<T extends { id: string }>(
  table: "queue_entries" | "appointments" | "notifications",
  opts: {
    filter?: Filter;
    orderBy?: { column: string; ascending?: boolean };
    enabled?: boolean;
  } = {}
) {
  const { filter = null, orderBy, enabled = true } = opts;
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const filterKey = filter ? `${filter.column}=${filter.value}` : "";
  const orderKey = orderBy ? `${orderBy.column}:${orderBy.ascending ?? true}` : "";

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchAll = async () => {
      let q = supabase.from(table).select("*");
      if (filter) q = q.eq(filter.column, filter.value);
      if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      const { data } = await q;
      if (!cancelled) {
        setRows((data ?? []) as unknown as T[]);
        setLoading(false);
      }
    };

    fetchAll();

    const channelName = `rt-${table}-${filterKey || "all"}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        (payload) => {
          setRows((prev) => {
            const next = [...prev];
            const newRow = payload.new as unknown as T;
            if (payload.eventType === "INSERT") {
              next.push(newRow);
            } else if (payload.eventType === "UPDATE") {
              const i = next.findIndex((r) => r.id === newRow.id);
              if (i >= 0) next[i] = newRow;
              else next.push(newRow);
            } else if (payload.eventType === "DELETE") {
              const id = (payload.old as unknown as T).id;
              return next.filter((r) => r.id !== id);
            }
            if (orderBy) {
              const { column, ascending = true } = orderBy;
              next.sort((a: any, b: any) => {
                const av = a[column], bv = b[column];
                if (av === bv) return 0;
                return (av > bv ? 1 : -1) * (ascending ? 1 : -1);
              });
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey, orderKey, enabled]);

  return { rows, loading };
}