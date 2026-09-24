import { ArrowLeft } from "lucide-react";
import { Link } from "./navigation";
import { Card, PageHeader, cn } from "./ui";

// Route-level loading states. Each one mirrors the real screen's layout so content lands
// where the placeholders were, and titles we already know are shown for real straight away.

export function Bone({ className, style }) {
  return <span className={cn("bone", className)} style={style} />;
}

const Circle = ({ size }) => <Bone className="shrink-0 rounded-full" style={{ width: size, height: size }} />;

function Skeleton({ header, children }) {
  return (
    <>
      {header}
      <div data-skeleton aria-busy="true" aria-label="Loading">
        {children}
      </div>
    </>
  );
}

/** PageHeader with placeholders for whatever depends on data. */
function Header({ eyebrow, title, description, action }) {
  return (
    <PageHeader
      eyebrow={eyebrow ?? <Bone className="inline-block h-3 w-28 align-middle" />}
      title={title ?? <Bone className="inline-block h-7 w-64 max-w-full align-middle sm:h-8" />}
      description={description ?? <Bone className="inline-block h-3.5 w-72 max-w-full align-middle" />}
      actions={action && <Bone className={cn("h-10 rounded-xl", action === true ? "w-36" : action)} />}
    />
  );
}

function StatCards({ count, className }) {
  return (
    <div className={cn("grid gap-3 sm:gap-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-4 sm:p-5">
          <Bone className="h-3 w-20" />
          <Bone className="mt-3 h-7 w-14 sm:h-8" />
          <Bone className="mt-2 h-3 w-24" />
        </Card>
      ))}
    </div>
  );
}

function BalanceCards({ count = 4, className }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
          <Bone className="size-16 shrink-0 rounded-full sm:size-20" />
          <div className="w-full min-w-0 space-y-2">
            <Bone className="h-4 w-24" />
            <Bone className="h-3 w-32 max-w-full" />
            <Bone className="h-2.5 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function CardTitle({ action }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div className="flex items-center gap-3">
        <Bone className="size-9 rounded-xl" />
        <div className="space-y-1.5">
          <Bone className="h-3.5 w-36" />
          <Bone className="h-2.5 w-20" />
        </div>
      </div>
      {action && <Bone className="h-3 w-14" />}
    </div>
  );
}

function Row({ avatar, badge }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      {avatar ? <Circle size={avatar} /> : <Bone className="size-2 rounded-full" />}
      <div className="min-w-0 flex-1 space-y-1.5">
        <Bone className="h-3.5 w-2/5" />
        <Bone className="h-2.5 w-3/5" />
      </div>
      {badge && <Bone className="h-5 w-16 rounded-full" />}
    </div>
  );
}

function ListCard({ rows = 5, avatar, badge, action, className }) {
  return (
    <Card className={className}>
      <CardTitle action={action} />
      <div className="mt-3 divide-y divide-white/[0.05] pb-2">
        {Array.from({ length: rows }, (_, i) => (
          <Row key={i} avatar={avatar} badge={badge} />
        ))}
      </div>
    </Card>
  );
}

function DateListCard({ rows = 5, className }) {
  return (
    <Card className={className}>
      <CardTitle action />
      <div className="space-y-1 px-3 pb-4 pt-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Bone className="size-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3.5 w-1/2" />
              <Bone className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MonthCalendarCard({ className }) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Bone className="h-4 w-48" />
        <Bone className="h-9 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-7 gap-1 pb-2 sm:gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Bone key={i} className="mx-auto h-2.5 w-6" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: 35 }, (_, i) => (
          <Bone key={i} className="min-h-14 rounded-lg sm:min-h-24 sm:rounded-xl" />
        ))}
      </div>
    </Card>
  );
}

function YearCalendarCard({ className }) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <Bone className="mb-2 h-4 w-20" />
            <Bone className="aspect-[7/6] w-full rounded-xl" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function FormCard({ fields = 4, className }) {
  return (
    <Card className={className}>
      <CardTitle />
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-3 w-24" />
            <Bone className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function TabBar({ className }) {
  return <Bone className={cn("h-[42px] rounded-xl", className)} />;
}

/* ---------------------------------------------------------------- admin */

export function AdminOverviewSkeleton() {
  return (
    <Skeleton header={<Header action />}>
      <StatCards count={4} className="grid-cols-2 xl:grid-cols-4" />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ListCard rows={6} avatar={36} badge action />
        <div className="grid gap-6">
          <Card className="p-5">
            <CardTitle action />
            <Bone className="mt-5 h-2.5 w-full rounded-full" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex justify-between">
                  <Bone className="h-3.5 w-32" />
                  <Bone className="h-3 w-20" />
                </div>
              ))}
            </div>
          </Card>
          <DateListCard rows={3} />
        </div>
      </div>
    </Skeleton>
  );
}

export function EmployeesSkeleton() {
  return (
    <Skeleton
      header={<Header eyebrow="People" title="Employees" description="Add teammates, share their login, and manage access." action />}
    >
      <Card>
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <Bone className="h-10 w-full rounded-xl sm:max-w-xs" />
          <Bone className="h-9 w-48 rounded-xl" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {Array.from({ length: 7 }, (_, i) => (
            <Row key={i} avatar={38} badge />
          ))}
        </div>
      </Card>
    </Skeleton>
  );
}

export function EmployeeDetailSkeleton() {
  return (
    <>
      <Link data-page-header href="/admin/employees" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> All employees
      </Link>
      <div data-skeleton aria-busy="true" aria-label="Loading">
        <Card className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <Circle size={84} />
            <div className="flex-1 space-y-3">
              <Bone className="h-7 w-56" />
              <Bone className="h-3.5 w-40" />
              <Bone className="h-3 w-80 max-w-full" />
            </div>
            <div className="space-y-3 md:w-48">
              <Bone className="h-5 w-40" />
              <Bone className="h-9 w-full rounded-xl" />
            </div>
          </div>
        </Card>
        <TabBar className="mt-6 w-full" />
        <BalanceCards className="mt-6 xl:grid-cols-4" />
        <YearCalendarCard className="mt-6" />
      </div>
    </>
  );
}

export function LeaveRequestsSkeleton() {
  return (
    <Skeleton
      header={
        <Header
          eyebrow="Time off"
          title="Leave requests"
          description="Approve with an optional note, or reject with a reason the employee will see."
        />
      }
    >
      <TabBar className="mb-6 w-full sm:w-[440px]" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start gap-3">
              <Circle size={40} />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-48" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Bone className="h-6 w-20 rounded-lg" />
              <Bone className="h-6 w-28 rounded-lg" />
              <Bone className="h-6 w-16 rounded-lg" />
            </div>
            <Bone className="mt-3 h-10 w-full rounded-xl" />
            <div className="mt-4 flex gap-2">
              <Bone className="h-9 flex-1 rounded-xl" />
              <Bone className="h-9 flex-1 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </Skeleton>
  );
}

export function AdminAttendanceSkeleton() {
  return (
    <Skeleton header={<Header eyebrow="Roll-call" title="Attendance" action="w-56" />}>
      <StatCards count={3} className="mb-6 grid-cols-3" />
      <Card className="divide-y divide-white/[0.04]">
        {Array.from({ length: 7 }, (_, i) => (
          <Row key={i} avatar={32} badge />
        ))}
      </Card>
    </Skeleton>
  );
}

export function AdminHolidaysSkeleton() {
  return (
    <Skeleton
      header={
        <Header
          eyebrow="Calendar"
          title="Holiday calendar"
          description="Click any date to add a holiday. Mandatory holidays are skipped when counting leave days; optional ones aren't."
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <MonthCalendarCard />
        <DateListCard rows={6} className="h-fit" />
      </div>
    </Skeleton>
  );
}

export function SettingsSkeleton() {
  return (
    <Skeleton header={<Header eyebrow="Organisation" title="Settings" description="Geofencing, work week and leave policy." />}>
      <div className="grid gap-6 xl:grid-cols-2">
        <FormCard fields={4} />
        <FormCard fields={4} />
        <FormCard fields={6} className="xl:col-span-2" />
      </div>
    </Skeleton>
  );
}

/* ------------------------------------------------------------- employee */

export function EmployeeDashboardSkeleton() {
  return (
    <Skeleton header={<Header action="w-40" />}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="p-5 sm:p-6">
          <Bone className="h-3 w-24" />
          <Bone className="mt-3 h-9 w-40" />
          <Bone className="mt-2 h-3 w-48" />
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <Bone className="mt-6 h-12 w-full rounded-xl" />
        </Card>
        <BalanceCards className="h-fit" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ListCard rows={4} badge action />
        <DateListCard rows={4} />
      </div>
    </Skeleton>
  );
}

export function MyLeavesSkeleton() {
  return (
    <Skeleton
      header={
        <Header
          eyebrow="Time off"
          title="My leaves"
          description="Weekends and company holidays are never deducted from your balance."
          action="w-40"
        />
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="p-4">
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-7 w-16" />
            <Bone className="mt-2 h-1 w-full rounded-full" />
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <MonthCalendarCard />
        <ListCard rows={4} badge className="h-fit" />
      </div>
    </Skeleton>
  );
}

export function MyAttendanceSkeleton() {
  return (
    <Skeleton header={<Header eyebrow="History" title="My attendance" description="Every check-in and check-out you've made." />}>
      <StatCards count={3} className="mb-6 grid-cols-3" />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <MonthCalendarCard />
        <ListCard rows={6} className="h-fit" />
      </div>
    </Skeleton>
  );
}

export function EmployeeHolidaysSkeleton() {
  return (
    <Skeleton
      header={
        <Header
          eyebrow="Calendar"
          description="Company holidays for the year. Optional holidays still count as working days."
          action="w-40"
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <YearCalendarCard />
        <DateListCard rows={6} className="h-fit" />
      </div>
    </Skeleton>
  );
}

export function ProfileSkeleton() {
  return (
    <Skeleton header={<Header eyebrow="You" title="Profile" description="Keep this up to date — HR uses it in emergencies." />}>
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card className="flex flex-col items-center p-6">
            <Circle size={96} />
            <Bone className="mt-4 h-5 w-36" />
            <Bone className="mt-2 h-3.5 w-24" />
            <Bone className="mt-5 h-1.5 w-56 max-w-full rounded-full" />
          </Card>
          <FormCard fields={2} />
        </div>
        <div className="space-y-6">
          <FormCard fields={4} />
          <FormCard fields={2} />
        </div>
      </div>
    </Skeleton>
  );
}
