import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";
import { load } from "@/lib/api";
import { fmtDate, STATUS_TONE } from "@/lib/format";
import { Avatar, Badge, Card, EmptyState, PageHeader, Stars, Table, Td, Th, cn } from "@/components/ui";
import { AddEmployee } from "./add-employee";

export const metadata = { title: "Employees" };

const FILTERS = [
  ["all", "All"],
  ["active", "Active"],
  ["revoked", "Revoked"],
];

export default async function EmployeesPage({ searchParams }) {
  const { q = "", status = "all", new: openNew } = await searchParams;
  const { employees } = await load("/admin/employees", { query: { q, status } });

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Employees"
        description="Add teammates, share their login, and manage access."
        actions={<AddEmployee defaultOpen={openNew === "1"} />}
      />

      <Card className="animate-fade-up">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <form className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input name="q" defaultValue={q} placeholder="Search name, ID, email, team…" className="field pl-9" />
            <input type="hidden" name="status" value={status} />
          </form>
          <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {FILTERS.map(([value, label]) => (
              <Link
                key={value}
                href={`/admin/employees?${new URLSearchParams({ q, status: value })}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  status === value ? "bg-white/10 text-fg" : "text-muted hover:text-fg",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {employees.length === 0 ? (
          <EmptyState icon={Users} title={q ? "No matches" : "No employees yet"} description={q ? "Try a different search." : "Add your first teammate to get started."} />
        ) : (
          <Table>
            <thead className="border-b border-white/[0.06]">
              <tr>
                <Th>Employee</Th>
                <Th className="hidden md:table-cell">Role</Th>
                <Th className="hidden lg:table-cell">Joined</Th>
                <Th className="hidden sm:table-cell">Rating</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {employees.map((e) => (
                <tr key={e.id} className="group relative transition-colors hover:bg-white/[0.025]">
                  <Td>
                    <Link href={`/admin/employees/${e.id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                      <Avatar src={e.avatar} name={e.name} size={38} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {e.name} {e.role === "admin" && <Badge tone="brand" className="ml-1">Admin</Badge>}
                        </p>
                        <p className="truncate text-xs text-muted">
                          <span className="font-mono">{e.employeeCode}</span> · {e.email}
                        </p>
                      </div>
                    </Link>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <p className="text-sm">{e.designation || "—"}</p>
                    <p className="text-xs text-muted">{e.department || ""}</p>
                  </Td>
                  <Td className="hidden text-muted lg:table-cell">{fmtDate(e.dateOfJoining)}</Td>
                  <Td className="hidden sm:table-cell">
                    {e.rating ? (
                      <span className="inline-flex items-center gap-2">
                        <Stars value={e.rating} size={13} />
                        <span className="text-xs text-muted tabular-nums">{e.rating}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-subtle">Not rated</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[e.status]} dot>
                      {e.status}
                    </Badge>
                  </Td>
                  <Td className="w-8 text-subtle">
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
