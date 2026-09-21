"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Info, Loader2 } from "lucide-react";
import { applyLeave, previewLeave } from "@/app/actions/employee";
import { Modal, SubmitButton, useFormAction } from "@/components/client";
import { Alert, Button, Field, Input, Select, Textarea, cn } from "@/components/ui";
import { fmtDays } from "@/lib/format";
import { todayIso } from "@/lib/dates";

export function ApplyLeave({ balances, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [key, setKey] = useState(0);
  return (
    <>
      <Button
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
      >
        <CalendarPlus className="size-4" /> Apply for leave
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Apply for leave" description="Your admin will be notified and can approve or reject it.">
        <ApplyForm key={key} balances={balances} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function ApplyForm({ balances, onDone }) {
  const today = todayIso();
  const [form, setForm] = useState({ leaveTypeId: balances[0]?.leaveTypeId ?? "", startDate: today, endDate: today, halfDay: "none" });
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [state, onSubmit, pending] = useFormAction(async (prev, fd) => {
    const res = await applyLeave(prev, fd);
    if (res.ok) onDone();
    return res;
  });

  const type = balances.find((b) => b.leaveTypeId === form.leaveTypeId);
  const single = form.startDate === form.endDate;
  const set = (k) => (e) =>
    setForm((f) => {
      const next = { ...f, [k]: e.target.value };
      if (k === "startDate" && next.endDate < next.startDate) next.endDate = next.startDate;
      if (next.startDate !== next.endDate) next.halfDay = "none";
      return next;
    });

  // Ask the API how many days this will cost (skips weekends/holidays) as the form changes.
  useEffect(() => {
    if (!form.leaveTypeId || !form.startDate || !form.endDate || form.endDate < form.startDate) return;
    let stale = false;
    const t = setTimeout(async () => {
      setPreviewing(true);
      const res = await previewLeave(form);
      if (!stale) {
        setPreview(res);
        setPreviewing(false);
      }
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [form]);

  const f = state?.fields ?? {};
  if (balances.length === 0) return <Alert tone="amber">No leave types are available for you yet. Contact your admin.</Alert>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Alert>{state?.error}</Alert>

      <fieldset>
        <legend className="mb-2 text-xs font-medium text-muted">Leave type</legend>
        <div className="grid grid-cols-2 gap-2">
          {balances.map((b) => (
            <label
              key={b.leaveTypeId}
              className={cn(
                "cursor-pointer rounded-xl border p-3 transition-colors",
                form.leaveTypeId === b.leaveTypeId ? "border-transparent" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
              )}
              style={form.leaveTypeId === b.leaveTypeId ? { background: `${b.color}1f`, boxShadow: `inset 0 0 0 1.5px ${b.color}` } : undefined}
            >
              <input type="radio" name="leaveTypeId" value={b.leaveTypeId} checked={form.leaveTypeId === b.leaveTypeId} onChange={set("leaveTypeId")} className="sr-only" />
              <span className="block text-sm font-medium">{b.name}</span>
              <span className="text-xs text-muted">{fmtDays(b.available)} left</span>
            </label>
          ))}
        </div>
        {f.leaveTypeId && <p className="mt-1.5 text-xs text-rose-300">{f.leaveTypeId}</p>}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="From" name="startDate" error={f.startDate}>
          <Input name="startDate" type="date" required value={form.startDate} onChange={set("startDate")} error={f.startDate} />
        </Field>
        <Field label="To" name="endDate" error={f.endDate}>
          <Input name="endDate" type="date" required min={form.startDate} value={form.endDate} onChange={set("endDate")} error={f.endDate} />
        </Field>
      </div>

      {single && type?.allowHalfDay && (
        <Field label="Duration" name="halfDay" error={f.halfDay}>
          <Select name="halfDay" value={form.halfDay} onChange={set("halfDay")}>
            <option value="none">Full day</option>
            <option value="first_half">First half</option>
            <option value="second_half">Second half</option>
          </Select>
        </Field>
      )}
      {!(single && type?.allowHalfDay) && <input type="hidden" name="halfDay" value="none" />}

      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
          preview?.ok === false || (preview?.ok && !preview.sufficient)
            ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
            : "border-brand-500/25 bg-brand-500/10 text-brand-50",
        )}
      >
        {previewing ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Info className="size-4 shrink-0" />}
        <span>
          {!preview
            ? "Calculating…"
            : preview.ok
              ? preview.sufficient
                ? `This uses ${fmtDays(preview.days)} · ${fmtDays(preview.available - preview.days)} will remain`
                : `This needs ${fmtDays(preview.days)} but only ${fmtDays(preview.available)} are available`
              : preview.error}
        </span>
      </div>

      <Field label="Reason" name="reason" error={f.reason}>
        <Textarea name="reason" required minLength={3} placeholder="A short note for your admin" error={f.reason} />
      </Field>

      <SubmitButton pending={pending} className="w-full" pendingText="Submitting…" disabled={preview?.ok && !preview.sufficient}>
        Submit request
      </SubmitButton>
    </form>
  );
}
