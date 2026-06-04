import type { Tables } from "@/integrations/supabase/types";

export type Appt = Tables<"appointments">;
export type Queue = Tables<"queue_entries">;

export type DateRange = { from: Date; to: Date };

export function rangePreset(key: "7d" | "30d" | "90d" | "mtd" | "ytd"): DateRange {
  const to = new Date();
  const from = new Date();
  switch (key) {
    case "7d": from.setDate(to.getDate() - 6); break;
    case "30d": from.setDate(to.getDate() - 29); break;
    case "90d": from.setDate(to.getDate() - 89); break;
    case "mtd": from.setDate(1); break;
    case "ytd": from.setMonth(0, 1); break;
  }
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function inRange(d: string | Date, r: DateRange) {
  const t = new Date(d).getTime();
  return t >= r.from.getTime() && t <= r.to.getTime();
}

export function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export function groupByDay(appts: Appt[], range: DateRange) {
  const days: { day: string; date: string; total: number; completed: number; cancelled: number; noShow: number }[] = [];
  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({
      day: cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      date: key,
      total: 0, completed: 0, cancelled: 0, noShow: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  const idx = new Map(days.map((d, i) => [d.date, i] as const));
  for (const a of appts) {
    const k = new Date(a.scheduled_at).toISOString().slice(0, 10);
    const i = idx.get(k);
    if (i == null) continue;
    days[i].total++;
    if (a.status === "Completed") days[i].completed++;
    if (a.status === "Cancelled") days[i].cancelled++;
    if (a.status === "No Show") days[i].noShow++;
  }
  return days;
}

export function hourlyDistribution(appts: Appt[]) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ h: `${String(h).padStart(2, "0")}:00`, v: 0 }));
  for (const a of appts) hours[new Date(a.scheduled_at).getHours()].v++;
  return hours.slice(6, 22); // clinic hours
}

export function bySpecialty(appts: Appt[]) {
  const m = new Map<string, number>();
  for (const a of appts) m.set(a.specialty, (m.get(a.specialty) ?? 0) + 1);
  return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function byDoctor(appts: Appt[]) {
  const m = new Map<string, { name: string; total: number; completed: number; cancelled: number }>();
  for (const a of appts) {
    const cur = m.get(a.doctor_name) ?? { name: a.doctor_name, total: 0, completed: 0, cancelled: 0 };
    cur.total++;
    if (a.status === "Completed") cur.completed++;
    if (a.status === "Cancelled" || a.status === "No Show") cur.cancelled++;
    m.set(a.doctor_name, cur);
  }
  return Array.from(m.values()).sort((a, b) => b.total - a.total);
}

export function averageWaitMin(queue: Queue[]) {
  const eligible = queue.filter((q) => q.eta_min != null);
  if (!eligible.length) return 0;
  return Math.round(eligible.reduce((s, q) => s + (q.eta_min ?? 0), 0) / eligible.length);
}

export function bookingLeadDays(appts: Appt[]) {
  if (!appts.length) return 0;
  const sum = appts.reduce((s, a) => {
    const lead = (new Date(a.scheduled_at).getTime() - new Date(a.created_at).getTime()) / 86_400_000;
    return s + Math.max(0, lead);
  }, 0);
  return Math.round((sum / appts.length) * 10) / 10;
}

export function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(title: string, sections: { heading: string; rows: (string | number)[][]; head: string[] }[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 25);
  let y = 32;
  for (const s of sections) {
    doc.setTextColor(20);
    doc.setFontSize(12);
    doc.text(s.heading, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [s.head],
      body: s.rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      theme: "striped",
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 260) { doc.addPage(); y = 20; }
  }
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}