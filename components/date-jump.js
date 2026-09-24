"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useReportPending } from "./navigation";

/** Date input that navigates to ?date=… as soon as a day is picked. */
export function DateJump({ value, max }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useReportPending(pending);
  return (
    <input
      type="date"
      aria-label="Pick a date"
      defaultValue={value}
      max={max}
      onChange={(e) => {
        const date = e.target.value;
        if (date) startTransition(() => router.push(`?date=${date}`));
      }}
      className="field h-9 w-40 py-1"
    />
  );
}
