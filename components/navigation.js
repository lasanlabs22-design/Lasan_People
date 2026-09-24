"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import NextLink, { useLinkStatus } from "next/link";

// Navigations that stay on the same page (tabs, filters, month/day pickers) keep the old
// screen up until the server answers, with no loading.js fallback. These helpers let the
// shell show one consistent "working on it" state for every kind of navigation.

const TrackContext = createContext(() => {});

/** Shell-side state: whether any link or router transition is still pending. */
export function useNavigationPending() {
  const [count, setCount] = useState(0);
  const track = useCallback((delta) => setCount((n) => n + delta), []);
  return [count > 0, track];
}

export function NavigationTracker({ track, children }) {
  return <TrackContext value={track}>{children}</TrackContext>;
}

/** Reports `pending` to the shell for as long as it stays true. */
export function useReportPending(pending) {
  const track = useContext(TrackContext);
  useEffect(() => {
    if (!pending) return;
    track(1);
    return () => track(-1);
  }, [pending, track]);
}

function PendingReporter() {
  useReportPending(useLinkStatus().pending);
  return null;
}

/** Drop-in for next/link that feeds the shell's pending state. */
export function Link({ children, ...props }) {
  return (
    <NextLink {...props}>
      {children}
      <PendingReporter />
    </NextLink>
  );
}

/**
 * Drops a one-shot query param (?new=1 that opened a dialog, ?welcome=1 after first sign-in)
 * once it has done its job, so a refresh or a shared link doesn't replay it.
 */
export function useConsumeSearchParam(name, present) {
  useEffect(() => {
    if (!present) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(name);
    window.history.replaceState(null, "", url);
  }, [name, present]);
}

export function ConsumeSearchParam({ name }) {
  useConsumeSearchParam(name, true);
  return null;
}

/** Thin progress bar along the top edge while a navigation is in flight. */
export function NavigationProgress({ active }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-200 ${active ? "opacity-100 delay-150" : "opacity-0"}`}
    >
      {active && <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-brand-400 to-cyan-glow animate-progress" />}
    </div>
  );
}
