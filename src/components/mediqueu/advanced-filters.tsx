import { useEffect, useState } from "react";
import { Bookmark, BookmarkPlus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type FilterField =
  | { kind: "search"; id: string; placeholder?: string }
  | { kind: "select"; id: string; label: string; options: { value: string; label: string }[] }
  | { kind: "date"; id: string; label: string };

export type FilterValues = Record<string, string>;

export function AdvancedFilters({
  fields,
  values,
  onChange,
  storageKey,
}: {
  fields: FilterField[];
  values: FilterValues;
  onChange: (v: FilterValues) => void;
  /** When set, current values + named presets persist to localStorage */
  storageKey?: string;
}) {
  const [presets, setPresets] = useState<Record<string, FilterValues>>({});

  // Hydrate persisted values + presets once.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const v = localStorage.getItem(`mq_flt_${storageKey}_v`);
      if (v) onChange({ ...values, ...JSON.parse(v) });
      const p = localStorage.getItem(`mq_flt_${storageKey}_p`);
      if (p) setPresets(JSON.parse(p));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist values on change.
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(`mq_flt_${storageKey}_v`, JSON.stringify(values));
    } catch {}
  }, [values, storageKey]);

  const set = (id: string, val: string) => onChange({ ...values, [id]: val });
  const activeCount = Object.values(values).filter((v) => v && v !== "all").length;

  const savePreset = () => {
    const name = window.prompt("Name this filter preset");
    if (!name) return;
    const next = { ...presets, [name]: values };
    setPresets(next);
    if (storageKey) {
      try { localStorage.setItem(`mq_flt_${storageKey}_p`, JSON.stringify(next)); } catch {}
    }
    toast.success(`Preset "${name}" saved`);
  };

  const applyPreset = (name: string) => {
    const p = presets[name];
    if (p) onChange(p);
  };

  const deletePreset = (name: string) => {
    const next = { ...presets };
    delete next[name];
    setPresets(next);
    if (storageKey) {
      try { localStorage.setItem(`mq_flt_${storageKey}_p`, JSON.stringify(next)); } catch {}
    }
  };

  const clearAll = () => {
    const cleared: FilterValues = {};
    fields.forEach((f) => (cleared[f.id] = f.kind === "select" ? "all" : ""));
    onChange(cleared);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-medium text-primary">{activeCount}</span>
        )}
      </div>

      {fields.map((f) => {
        if (f.kind === "search") {
          return (
            <Input
              key={f.id}
              placeholder={f.placeholder ?? "Search"}
              value={values[f.id] ?? ""}
              onChange={(e) => set(f.id, e.target.value)}
              className="h-9 w-40 sm:w-52"
            />
          );
        }
        if (f.kind === "select") {
          return (
            <Select key={f.id} value={values[f.id] ?? "all"} onValueChange={(v) => set(f.id, v)}>
              <SelectTrigger className="h-9 w-auto min-w-[140px] gap-2">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return (
          <Input
            key={f.id}
            type="date"
            value={values[f.id] ?? ""}
            onChange={(e) => set(f.id, e.target.value)}
            className="h-9 w-[150px]"
            aria-label={f.label}
          />
        );
      })}

      {activeCount > 0 && (
        <Button size="sm" variant="ghost" onClick={clearAll} className="h-9 px-2 text-xs">
          <X className="mr-1 h-3.5 w-3.5" />Clear
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-9 gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            Presets
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">Saved presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.keys(presets).length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">No presets yet</div>
          )}
          {Object.keys(presets).map((name) => (
            <DropdownMenuItem
              key={name}
              onSelect={(e) => { e.preventDefault(); applyPreset(name); }}
              className="flex items-center justify-between"
            >
              <span className="truncate">{name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deletePreset(name); }}
                className="ml-2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Delete preset ${name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); savePreset(); }}>
            <BookmarkPlus className="mr-2 h-3.5 w-3.5" />Save current as preset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}