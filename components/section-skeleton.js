"use client";

import { usePathname } from "next/navigation";
import {
  AdminAttendanceSkeleton,
  AdminHolidaysSkeleton,
  AdminOverviewSkeleton,
  EmployeeDashboardSkeleton,
  EmployeeDetailSkeleton,
  EmployeeHolidaysSkeleton,
  EmployeesSkeleton,
  LeaveRequestsSkeleton,
  MyAttendanceSkeleton,
  MyLeavesSkeleton,
  ProfileSkeleton,
  SettingsSkeleton,
} from "./page-skeleton";

// Each route has its own loading.js, but this section-level fallback is what shows when the
// router hasn't prefetched the destination yet. Match it to the page being opened.
// Most specific first; "/admin/employees/" (trailing slash) only matches a single employee.
const ROUTES = [
  ["/admin/employees/", EmployeeDetailSkeleton],
  ["/admin/employees", EmployeesSkeleton],
  ["/admin/leaves", LeaveRequestsSkeleton],
  ["/admin/attendance", AdminAttendanceSkeleton],
  ["/admin/holidays", AdminHolidaysSkeleton],
  ["/admin/settings", SettingsSkeleton],
  ["/admin", AdminOverviewSkeleton],
  ["/employee/leaves", MyLeavesSkeleton],
  ["/employee/attendance", MyAttendanceSkeleton],
  ["/employee/holidays", EmployeeHolidaysSkeleton],
  ["/employee/profile", ProfileSkeleton],
  ["/employee", EmployeeDashboardSkeleton],
];

export function SectionSkeleton() {
  const pathname = usePathname();
  const Skeleton = ROUTES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? AdminOverviewSkeleton;
  return <Skeleton />;
}
