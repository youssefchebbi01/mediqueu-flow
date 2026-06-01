import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Rows3, Rows2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./loading";
import { EmptyState } from "./empty-state";

export type Column<T> = {
  id: string;
  header: string;
  accessor?: (row: T) => any;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  /** Hide on small screens; values: 'sm' | 'md' | 'lg' */
  hideBelow?: "sm" | "md" | "lg";
  align?: "left" | "right";
};

type Sort = { id: string; dir: "asc" | "desc" } | null;

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading = false,
  empty,
  pageSize = 10,
  selectable = false,
  bulkActions,
  rowActions,
  storageKey,
  initialSort,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  empty?: { icon?: any; title: string; description?: string; action?: ReactNode };
  pageSize?: number;
  selectable?: boolean;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => ReactNode;
  storageKey?: string;
  initialSort?: Sort;
  onRowClick?: (row: T) => void;
}) {
  const [sort, setSort] = useState<Sort>(() => {
    if (!storageKey) return initialSort ?? null;
    try {
      const raw = localStorage.getItem(`mq_tbl_${storageKey}_sort`);
      return raw ? JSON.parse(raw) : initialSort ?? null;
    } catch {
      return initialSort ?? null;
    }
  });
  const [dense, setDense] = useState<boolean>(() => {
    if (!storageKey) return false;
    try {
      return localStorage.getItem(`mq_tbl_${storageKey}_dense`) === "1";
    } catch {
      return false;
    }
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.accessor) return rows;
    const out = [...rows].sort((a, b) => {
      const av = col.accessor!(a);
      const bv = col.accessor!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sort.dir === "asc" ? 1 : -1);
    });
    return out;
  }, [rows, sort, columns]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allChecked = paged.length > 0 && paged.every((r) => selected.has(r.id));
  const someChecked = paged.some((r) => selected.has(r.id)) && !allChecked;

  const toggleSort = (id: string) => {
    setSort((s) => {
      let next: Sort;
      if (!s || s.id !== id) next = { id, dir: "asc" };
      else if (s.dir === "asc") next = { id, dir: "desc" };
      else next = null;
      if (storageKey) {
        try {
          if (next) localStorage.setItem(`mq_tbl_${storageKey}_sort`, JSON.stringify(next));
          else localStorage.removeItem(`mq_tbl_${storageKey}_sort`);
        } catch {}
      }
      return next;
    });
  };

  const toggleDense = () => {
    setDense((d) => {
      const next = !d;
      if (storageKey) {
        try {
          localStorage.setItem(`mq_tbl_${storageKey}_dense`, next ? "1" : "0");
        } catch {}
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (allChecked) paged.forEach((r) => next.delete(r.id));
      else paged.forEach((r) => next.add(r.id));
      return next;
    });
  };
  const toggleOne = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const selectedRows = sorted.filter((r) => selected.has(r.id));

  const hideClass = (v?: "sm" | "md" | "lg") =>
    v === "sm" ? "hidden sm:table-cell" : v === "md" ? "hidden md:table-cell" : v === "lg" ? "hidden lg:table-cell" : "";

  const padY = dense ? "py-1.5" : "py-3";

  if (loading) return <TableSkeleton rows={6} cols={columns.length + (selectable ? 1 : 0)} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {selectedRows.length > 0 ? (
            <>
              <span className="font-medium text-foreground">{selectedRows.length}</span> selected
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={clearSelection}>Clear</Button>
              {bulkActions && <div className="ml-2 flex gap-1">{bulkActions(selectedRows, clearSelection)}</div>}
            </>
          ) : (
            <span>{total} {total === 1 ? "row" : "rows"}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={toggleDense}
            title={dense ? "Comfortable" : "Compact"}
            aria-label="Toggle row density"
          >
            {dense ? <Rows3 className="h-3.5 w-3.5" /> : <Rows2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="relative max-h-[640px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
            <tr className="border-b border-border">
              {selectable && (
                <th className={cn("w-10 px-4 text-left font-medium", padY)}>
                  <Checkbox
                    checked={allChecked || (someChecked && "indeterminate")}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows on page"
                  />
                </th>
              )}
              {columns.map((c) => {
                const isSorted = sort?.id === c.id;
                return (
                  <th
                    key={c.id}
                    className={cn(
                      "px-4 text-left font-medium sm:px-6",
                      padY,
                      c.align === "right" && "text-right",
                      hideClass(c.hideBelow),
                      c.className
                    )}
                  >
                    {c.sortable && c.accessor ? (
                      <button
                        onClick={() => toggleSort(c.id)}
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        {c.header}
                        {!isSorted && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                        {isSorted && sort?.dir === "asc" && <ArrowUp className="h-3 w-3 text-primary" />}
                        {isSorted && sort?.dir === "desc" && <ArrowDown className="h-3 w-3 text-primary" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th className={cn("px-4 sm:px-6", padY)} />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="p-0">
                  <div className="p-4">
                    <EmptyState
                      icon={empty?.icon}
                      title={empty?.title ?? "Nothing here yet"}
                      description={empty?.description}
                      action={empty?.action}
                    />
                  </div>
                </td>
              </tr>
            )}
            {paged.map((row) => {
              const isSel = selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    isSel && "bg-primary/5",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {selectable && (
                    <td className={cn("w-10 px-4", padY)} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSel} onCheckedChange={() => toggleOne(row.id)} aria-label="Select row" />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={cn(
                        "px-4 sm:px-6",
                        padY,
                        c.align === "right" && "text-right",
                        hideClass(c.hideBelow),
                        c.className
                      )}
                    >
                      {c.cell ? c.cell(row) : c.accessor ? String(c.accessor(row) ?? "—") : null}
                    </td>
                  ))}
                  {rowActions && (
                    <td className={cn("px-4 text-right sm:px-6", padY)} onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            Page {safePage} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}