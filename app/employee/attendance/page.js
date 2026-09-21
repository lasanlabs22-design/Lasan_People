import { Clock3, MapPin, Timer, CalendarCheck2 } from "lucide-react";
import { load } from "@/lib/api";
import { isMonth, todayIso } from "@/lib/dates";
import { fmtDate, fmtDuration, fmtTime } from "@/lib/format";
import { Legend, MonthCalendar, MonthNav } from "@/components/calendar";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui";

export const metadata = { title: "Attendance" };

export default async function MyAttendance({ searchParams }) {
  const sp = await searchParams;
  const month = isMonth(sp.month) ? sp.month : todayIso().slice(0, 7);
  const [{ records }, { holidays }, config] = await Promise.all([
    load("/attendance/mine", { query: { month } }),
    load("/holidays", { query: { year: month.slice(0, 4) } }),
    load("/config"),
  ]);

  const complete = records.filter((r) => r.checkOutAt);
  const totalMins = complete.reduce((s, r) => s + (new Date(r.checkOutAt) - new Date(r.checkInAt)) / 60000, 0);
  const avgMins = complete.length ? totalMins / complete.length : 0;
  const events = Object.fromEntries(
    records.map((r) => [
      r.date,
      [{ label: `${fmtTime(r.checkInAt)}${r.checkOutAt ? `–${fmtTime(r.checkOutAt)}` : ""}`, color: r.source === "geo" ? "#34d399" : "#fbbf24" }],
    ]),
  );

  return (
    <>
      <PageHeader eyebrow="History" title="My attendance" description="Every check-in and check-out you've made." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Days present" value={records.length} icon={CalendarCheck2} accent="emerald" />
        <StatCard label="Avg. day" value={complete.length ? `${Math.floor(avgMins / 60)}h ${String(Math.round(avgMins % 60)).padStart(2, "0")}m` : "—"} icon={Timer} accent="brand" />
        <StatCard label="Total hours" value={`${Math.round(totalMins / 60)}h`} icon={Clock3} accent="cyan" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Legend items={[{ label: "At office", color: "#34d399" }, { label: "Remote", color: "#fbbf24" }, { label: "Holiday", color: "#67e8f9" }]} />
            <MonthNav month={month} basePath="/employee/attendance" />
          </div>
          <MonthCalendar month={month} events={events} holidays={Object.fromEntries(holidays.map((h) => [h.date, h]))} weekendDays={config.weekendDays} />
        </Card>
        <Card className="h-fit">
          <CardHeader title="Log" icon={Clock3} />
          <div className="mt-3 divide-y divide-white/[0.05]">
            {records.length === 0 && <EmptyState icon={Clock3} title="No punches this month" />}
            {[...records].reverse().map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <MapPin className={`size-4 shrink-0 ${r.source === "geo" ? "text-emerald-300" : "text-amber-300"}`} />
                <span className="flex-1">{fmtDate(r.date, { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className="tabular-nums text-muted">
                  {fmtTime(r.checkInAt)} → {fmtTime(r.checkOutAt)}
                </span>
                <span className="w-16 text-right text-xs tabular-nums text-subtle">{fmtDuration(r.checkInAt, r.checkOutAt)}</span>
              </div>
            ))}
          </div>
          <div className="h-2" />
        </Card>
      </div>
    </>
  );
}
