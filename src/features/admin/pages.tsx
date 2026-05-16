"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, simple-import-sort/imports */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, Download, FileText, Filter, GraduationCap, MessageSquare, Search, ShieldCheck, Trash2, Upload, UserPlus, Users, type LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { adminApi } from "@/src/api/admin";
import { communicationApi } from "@/src/api/communication";
import { Alert } from "@/src/components/ui/alert";
import type { AttendanceStudentPoint } from "@/src/components/ui/attendance-geofence-map";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { DataTable } from "@/src/components/ui/data-table";
import { EmptyState } from "@/src/components/ui/empty-state";
import { FileLauncher } from "@/src/components/ui/file-launcher";
import { Input } from "@/src/components/ui/input";
import { DetailHero, PageControlCard, PageIntro } from "@/src/components/ui/page-intro";
import { StatCard } from "@/src/components/ui/stat-card";
import { Textarea } from "@/src/components/ui/textarea";
import type { AttendanceSessionLiveView } from "@/src/types/domain";
import { downloadBlob, getFilenameFromDisposition } from "@/src/utils/download";
import { getErrorMessage } from "@/src/utils/error";
import { formatDate } from "@/src/utils/format";
import { openSseStream } from "@/src/utils/live-stream";

const AttendanceGeofenceMap = dynamic(
  () => import("@/src/components/ui/attendance-geofence-map").then((mod) => mod.AttendanceGeofenceMap),
  { ssr: false },
);

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a8194]">{label}</p>
      <div>{children}</div>
    </div>
  );
}

function RowDelete({
  onDelete,
}: {
  onDelete: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 rounded-[5px] border border-[#f6d5dd] bg-[#fff4f6] px-0 text-[#e04663] hover:bg-[#fde9ed] hover:text-[#d73657]"
      onClick={onDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function RowEdit({
  onEdit,
}: {
  onEdit: () => void;
}) {
  return (
    <Button variant="secondary" size="sm" className="h-8 rounded-[5px] px-3 text-xs" onClick={onEdit}>
      Edit
    </Button>
  );
}

const adminMetricToneStyles: Record<"blue" | "teal" | "amber" | "green" | "rose", { surface: string; icon: string }> = {
  blue: {
    surface: "bg-[#eef4ff]",
    icon: "text-[#255ac8]",
  },
  teal: {
    surface: "bg-[#ebf9ff]",
    icon: "text-[#0997c2]",
  },
  amber: {
    surface: "bg-[#fff7e8]",
    icon: "text-[#d79a00]",
  },
  green: {
    surface: "bg-[#edf8ee]",
    icon: "text-[#23a148]",
  },
  rose: {
    surface: "bg-[#fff0f4]",
    icon: "text-[#e04663]",
  },
};

function AdminMetricTile({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone: keyof typeof adminMetricToneStyles;
}) {
  const styles = adminMetricToneStyles[tone];

  return (
    <Card className="rounded-[18px] border-[#dce6f3] bg-white shadow-[0_10px_26px_rgba(15,37,71,0.05)]">
      <CardContent className="flex min-h-[104px] items-center gap-3 p-4 sm:p-5">
        <div className={`flex h-11 w-11 shrink-0 self-start items-center justify-center rounded-2xl ${styles.surface}`}>
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
          <p className="text-[11px] font-medium uppercase leading-5 tracking-[0.12em] text-[#7a8194] break-words">
            {title}
          </p>
          <p className="mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.04em] text-[#202c4b]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getUnitName(unit: unknown) {
  if (unit && typeof unit === "object" && "name" in unit) {
    return (unit as { name?: string }).name || "--";
  }
  if (typeof unit === "string") return unit;
  return "--";
}

function getScalarEntries(record: Record<string, unknown>) {
  return Object.entries(record).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value) || value === null,
  );
}

type SeedStudentInput = {
  matricNumber: string;
  fullName: string;
  faculty: string;
  department: string;
  level: number;
  email?: string;
  phone?: string;
};

type SeedLecturerInput = {
  employeeId: string;
  fullName: string;
  email: string;
  faculty: string;
  department: string;
  phone?: string;
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function parseSeededStudentsCsv(text: string): SeedStudentInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("CSV file is empty.");
  }

  const headers = lines[0].split(",").map((header) => normalizeHeader(header));
  const getIndex = (headerNames: string[]) => headers.findIndex((header) => headerNames.includes(header));
  const required = {
    matricNumber: getIndex(["matricnumber", "matricno", "matric"]),
    fullName: getIndex(["fullname", "name"]),
    faculty: getIndex(["faculty", "facultyid"]),
    department: getIndex(["department", "departmentid"]),
    level: getIndex(["level"]),
  };

  const missing = Object.entries(required)
    .filter(([, index]) => index < 0)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required CSV columns: ${missing.join(", ")}.`);
  }

  const emailIndex = getIndex(["email"]);
  const phoneIndex = getIndex(["phone", "phonenumber"]);

  return lines.slice(1).map((line, rowIndex) => {
    const values = line.split(",").map((value) => value.trim());
    const level = Number(values[required.level]);

    if (!values[required.matricNumber] || !values[required.fullName] || !values[required.faculty] || !values[required.department] || Number.isNaN(level)) {
      throw new Error(`Row ${rowIndex + 2} is invalid. Check required values and level.`);
    }

    return {
      matricNumber: values[required.matricNumber],
      fullName: values[required.fullName],
      faculty: values[required.faculty],
      department: values[required.department],
      level,
      email: emailIndex >= 0 ? values[emailIndex] || "" : "",
      phone: phoneIndex >= 0 ? values[phoneIndex] || "" : "",
    };
  });
}

function downloadSeededStudentCsvTemplate() {
  const csvRows = [
    "matricNumber,fullName,faculty,department,level,email,phone",
    "BU22CSC1001,Adaobi Okafor,Engineering,Computer Science,300,adaobi@example.edu,+234800000001",
    "BU22CSC1002,David Yusuf,Engineering,Software Engineering,200,david@example.edu,+234800000002",
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student-roster-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function parseSeededLecturersCsv(text: string): SeedLecturerInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("CSV file is empty.");
  }

  const headers = lines[0].split(",").map((header) => normalizeHeader(header));
  const getIndex = (headerNames: string[]) => headers.findIndex((header) => headerNames.includes(header));
  const required = {
    employeeId: getIndex(["employeeid", "staffid", "staff", "lecturerid"]),
    fullName: getIndex(["fullname", "name"]),
    email: getIndex(["email"]),
    faculty: getIndex(["faculty", "facultyid"]),
    department: getIndex(["department", "departmentid"]),
  };

  const missing = Object.entries(required)
    .filter(([, index]) => index < 0)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required CSV columns: ${missing.join(", ")}.`);
  }

  const phoneIndex = getIndex(["phone", "phonenumber"]);

  return lines.slice(1).map((line, rowIndex) => {
    const values = line.split(",").map((value) => value.trim());

    if (
      !values[required.employeeId] ||
      !values[required.fullName] ||
      !values[required.email] ||
      !values[required.faculty] ||
      !values[required.department]
    ) {
      throw new Error(`Row ${rowIndex + 2} is invalid. Check employee ID, name, email, faculty, and department.`);
    }

    return {
      employeeId: values[required.employeeId],
      fullName: values[required.fullName],
      email: values[required.email],
      faculty: values[required.faculty],
      department: values[required.department],
      phone: phoneIndex >= 0 ? values[phoneIndex] || "" : "",
    };
  });
}

function downloadSeededLecturerCsvTemplate() {
  const csvRows = [
    "employeeId,fullName,email,faculty,department,phone",
    "ENG-L-001,Dr Ada Nwosu,ada.nwosu@campusflow.edu,Engineering,Computer Science,+234800000101",
    "BUS-L-004,Mr David Bello,david.bello@campusflow.edu,Management Sciences,Accounting,+234800000102",
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lecturer-roster-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function SummaryGrid({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const entries = getScalarEntries(data);

  if (!entries.length) {
    return (
      <EmptyState
        title="No summary values"
        description="This response does not expose any top-level scalar values."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="relative overflow-hidden rounded-[5px] border border-[var(--border)] bg-white px-4 py-3">
          <span className="absolute left-0 top-0 h-full w-1 bg-[rgba(61,94,225,0.2)]" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{key}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{String(value ?? "--")}</p>
        </div>
      ))}
    </div>
  );
}

function KeyValueList({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const entries = getScalarEntries(data);

  if (!entries.length) {
    return (
      <EmptyState
        title="No scalar details"
        description="The selected record only contains nested objects or arrays."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="panel-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{key}</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{String(value ?? "--")}</p>
        </div>
      ))}
    </div>
  );
}

function CollectionPreview({
  title,
  items,
}: {
  title: string;
  items: unknown[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{items.length} records available</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.slice(0, 8).map((item, index) => {
            if (item && typeof item === "object") {
              return (
                <div key={index} className="panel-soft">
                  <KeyValueList data={item as Record<string, unknown>} />
                </div>
              );
            }

            return (
              <div key={index} className="panel-soft text-sm text-slate-700">
                {String(item)}
              </div>
            );
          })
        ) : (
          <EmptyState
            title={`No ${title.toLowerCase()}`}
            description="There are no items in this section right now."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ReportSection({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) {
  if (Array.isArray(data)) {
    return <CollectionPreview title={title} items={data} />;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const nestedCollections = Object.entries(record).filter(([, value]) => Array.isArray(value));

    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Structured backend report output for this section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SummaryGrid data={record} />
          {nestedCollections.length ? (
            <div className="grid gap-6 xl:grid-cols-2">
              {nestedCollections.map(([key, value]) => (
                <CollectionPreview key={key} title={key} items={(value as unknown[]) || []} />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">{data == null ? "No data available." : String(data)}</p>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { data } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApi.dashboard });
  const metrics = data?.data || {};
  const overviewMetrics = [
    { title: "Students", value: metrics.students || 0, icon: Users, tone: "rose" as const },
    { title: "Lecturers", value: metrics.lecturers || 0, icon: Users, tone: "teal" as const },
    { title: "Courses", value: metrics.courses || 0, icon: BookOpen, tone: "amber" as const },
    { title: "Assignments", value: metrics.assignments || 0, icon: FileText, tone: "green" as const },
    { title: "Assessments", value: metrics.assessments || 0, icon: ShieldCheck, tone: "blue" as const },
    { title: "Attendance records", value: metrics.submissions || 0, icon: GraduationCap, tone: "teal" as const },
    { title: "Attempts", value: metrics.attempts || 0, icon: ShieldCheck, tone: "amber" as const },
    { title: "Materials", value: metrics.materials || 0, icon: FileText, tone: "blue" as const },
    { title: "Messages", value: metrics.messages || 0, icon: MessageSquare, tone: "rose" as const },
    { title: "Announcements", value: metrics.announcements || 0, icon: Bell, tone: "green" as const },
  ];

  const chartValues = [
    metrics.students || 0,
    metrics.lecturers || 0,
    metrics.courses || 0,
    metrics.assignments || 0,
    metrics.assessments || 0,
    metrics.attempts || 0,
  ];
  const maxValue = Math.max(...chartValues, 1);
  const chartPoints = chartValues
    .map((value, index) => {
      const x = 28 + index * 118;
      const y = 220 - (Number(value) / maxValue) * 150;
      return `${x},${y}`;
    })
    .join(" ");
  const chartLabels = ["Students", "Lecturers", "Courses", "Assignments", "Assessments", "Attempts"];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {overviewMetrics.map((metric) => (
          <AdminMetricTile key={metric.title} title={metric.title} value={metric.value} icon={metric.icon} tone={metric.tone} />
        ))}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Performance overview</CardTitle>
              <CardDescription>Student, course, and assessment totals across the institution.</CardDescription>
            </div>
            <Badge tone="info">Live summary</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <svg viewBox="0 0 650 250" className="h-[260px] w-full">
                  {[0, 1, 2, 3].map((index) => (
                    <line
                      key={`h-${index}`}
                      x1="28"
                      y1={50 + index * 45}
                      x2="620"
                      y2={50 + index * 45}
                      stroke="rgba(15,37,71,0.08)"
                      strokeDasharray="4 6"
                    />
                  ))}
                  {chartLabels.map((label, index) => {
                    const x = 28 + index * 118;
                    return (
                      <text key={label} x={x} y="238" fill="#65748b" fontSize="13">
                        {label}
                      </text>
                    );
                  })}
                  <polyline
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints}
                  />
                  {chartValues.map((value, index) => {
                    const x = 28 + index * 118;
                    const y = 220 - (Number(value) / maxValue) * 150;
                    return (
                      <g key={index}>
                        <circle cx={x} cy={y} r="6" fill="var(--accent)" />
                        <text x={x} y={y - 14} textAnchor="middle" fill="#0f2547" fontSize="12" fontWeight="600">
                          {value}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminFacultiesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "faculties"], queryFn: adminApi.faculties });
  const [form, setForm] = useState({ name: "", code: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const createFaculty = useMutation({
    mutationFn: () => adminApi.createFaculty(form),
    onSuccess: async () => {
      toast.success("Faculty created");
      setForm({ name: "", code: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "faculties"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const updateFaculty = useMutation({
    mutationFn: () => adminApi.updateFaculty(editingId!, form),
    onSuccess: async () => {
      toast.success("Faculty updated");
      setForm({ name: "", code: "" });
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "faculties"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteFaculty = useMutation({
    mutationFn: (id: string) => adminApi.deleteFaculty(id),
    onSuccess: async () => {
      toast.success("Faculty deleted");
      await queryClient.invalidateQueries({ queryKey: ["admin", "faculties"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-4">
      <PageIntro
        kicker="Academic structure"
        title="Faculties"
        description="Create and maintain top-level academic units that structure departments and courses."
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit faculty" : "Create faculty"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledField label="Faculty name">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </LabeledField>
          <LabeledField label="Code">
            <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </LabeledField>
          <div className="flex gap-3">
            <Button
              onClick={() => (editingId ? updateFaculty.mutate() : createFaculty.mutate())}
              disabled={!form.name || !form.code || createFaculty.isPending || updateFaculty.isPending}
            >
              {editingId ? "Update faculty" : "Save faculty"}
            </Button>
            {editingId ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", code: "" });
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <DataTable
        data={data?.data || []}
        columns={[
          { key: "name", header: "Name", render: (item) => item.name },
          { key: "code", header: "Code", render: (item) => item.code || "--" },
          {
            key: "actions",
            header: "",
            render: (item: any) => (
              <div className="flex gap-1">
                <RowEdit
                  onEdit={() => {
                    setEditingId(item._id);
                    setForm({ name: item.name || "", code: item.code || "" });
                  }}
                />
                <RowDelete onDelete={() => deleteFaculty.mutate(item._id)} />
              </div>
            ),
          },
        ]}
      />
      </div>
    </div>
  );
}

export function AdminDepartmentsPage() {
  const queryClient = useQueryClient();
  const faculties = useQuery({ queryKey: ["admin", "faculties"], queryFn: adminApi.faculties });
  const { data } = useQuery({ queryKey: ["admin", "departments"], queryFn: adminApi.departments });
  const [form, setForm] = useState({ name: "", code: "", faculty: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const createDepartment = useMutation({
    mutationFn: () => adminApi.createDepartment(form),
    onSuccess: async () => {
      toast.success("Department created");
      setForm({ name: "", code: "", faculty: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const updateDepartment = useMutation({
    mutationFn: () => adminApi.updateDepartment(editingId!, form),
    onSuccess: async () => {
      toast.success("Department updated");
      setEditingId(null);
      setForm({ name: "", code: "", faculty: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteDepartment = useMutation({
    mutationFn: (id: string) => adminApi.deleteDepartment(id),
    onSuccess: async () => {
      toast.success("Department deleted");
      await queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-4">
      <PageIntro
        kicker="Academic structure"
        title="Departments"
        description="Manage departmental units and their faculty relationships for course organization."
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit department" : "Create department"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledField label="Department name">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </LabeledField>
          <LabeledField label="Code">
            <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </LabeledField>
          <LabeledField label="Faculty">
            <select className="portal-select" value={form.faculty} onChange={(event) => setForm({ ...form, faculty: event.target.value })}>
              <option value="">Select faculty</option>
              {(faculties.data?.data || []).map((faculty) => <option key={faculty._id} value={faculty._id}>{faculty.name}</option>)}
            </select>
          </LabeledField>
          <div className="flex gap-3">
            <Button
              onClick={() => (editingId ? updateDepartment.mutate() : createDepartment.mutate())}
              disabled={!form.name || !form.code || !form.faculty || createDepartment.isPending || updateDepartment.isPending}
            >
              {editingId ? "Update department" : "Save department"}
            </Button>
            {editingId ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", code: "", faculty: "" });
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <DataTable
        data={data?.data || []}
        columns={[
          { key: "name", header: "Department", render: (item) => item.name },
          { key: "code", header: "Code", render: (item) => item.code || "--" },
          { key: "faculty", header: "Faculty", render: (item: any) => getUnitName(item.faculty) },
          {
            key: "actions",
            header: "",
            render: (item: any) => (
              <div className="flex gap-1">
                <RowEdit
                  onEdit={() => {
                    setEditingId(item._id);
                    setForm({
                      name: item.name || "",
                      code: item.code || "",
                      faculty:
                        typeof item.faculty === "object" && item.faculty && "_id" in item.faculty
                          ? String((item.faculty as { _id?: string })._id || "")
                          : "",
                    });
                  }}
                />
                <RowDelete onDelete={() => deleteDepartment.mutate(item._id)} />
              </div>
            ),
          },
        ]}
      />
      </div>
    </div>
  );
}

export function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "courses"], queryFn: adminApi.courses });
  const faculties = useQuery({ queryKey: ["admin", "faculties"], queryFn: adminApi.faculties });
  const departments = useQuery({ queryKey: ["admin", "departments"], queryFn: adminApi.departments });
  const [form, setForm] = useState({
    title: "",
    code: "",
    faculty: "",
    department: "",
    level: "100",
    semester: "first",
    academicSession: "",
    courseType: "core",
  });
  const createCourse = useMutation({
    mutationFn: () =>
      adminApi.createCourse({
        ...form,
        level: Number(form.level),
      }),
    onSuccess: async () => {
      toast.success("Course created");
      setForm({
        title: "",
        code: "",
        faculty: "",
        department: "",
        level: "100",
        semester: "first",
        academicSession: "",
        courseType: "core",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteCourse = useMutation({
    mutationFn: (id: string) => adminApi.deleteCourse(id),
    onSuccess: async () => {
      toast.success("Course deleted");
      await queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-4">
      <PageIntro
        kicker="Course catalog"
        title="Courses"
        description="Define institutional courses, their academic units, delivery semester, and core or elective status."
      />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create course</CardTitle>
          <CardDescription>Set the academic unit, level, semester, and course type for institutional delivery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledField label="Course title">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </LabeledField>
          <LabeledField label="Course code">
            <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </LabeledField>
          <LabeledField label="Faculty">
            <select className="portal-select" value={form.faculty} onChange={(event) => setForm({ ...form, faculty: event.target.value })}>
              <option value="">Select faculty</option>
              {(faculties.data?.data || []).map((faculty) => <option key={faculty._id} value={faculty._id}>{faculty.name}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Department">
            <select className="portal-select" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>
              <option value="">Select department</option>
              {(departments.data?.data || []).map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </LabeledField>
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Level">
              <Input value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} />
            </LabeledField>
            <LabeledField label="Academic session">
              <Input value={form.academicSession} onChange={(event) => setForm({ ...form, academicSession: event.target.value })} />
            </LabeledField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Semester">
              <select className="portal-select" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })}>
                <option value="first">First</option>
                <option value="second">Second</option>
              </select>
            </LabeledField>
            <LabeledField label="Course type">
              <select className="portal-select" value={form.courseType} onChange={(event) => setForm({ ...form, courseType: event.target.value })}>
                <option value="core">Core</option>
                <option value="elective">Elective</option>
              </select>
            </LabeledField>
          </div>
          <Button
            onClick={() => createCourse.mutate()}
            disabled={!form.title || !form.code || !form.department || !form.faculty || createCourse.isPending}
          >
            Save course
          </Button>
        </CardContent>
      </Card>
      <DataTable
        data={data?.data || []}
        columns={[
          { key: "title", header: "Course", render: (item) => item.title },
          { key: "code", header: "Code", render: (item) => item.code },
          { key: "type", header: "Type", render: (item) => <Badge>{item.courseType || "--"}</Badge> },
          { key: "semester", header: "Semester", render: (item) => item.semester || "--" },
          { key: "department", header: "Department", render: (item) => getUnitName(item.department) },
          {
            key: "actions",
            header: "",
            render: (item) => (
              <div className="flex gap-2">
                <Button asChild variant="secondary" size="sm" className="h-8 rounded-[5px] px-3 text-xs">
                  <Link href={`/staff/admin/courses/${item._id}`}>Manage</Link>
                </Button>
                <RowDelete onDelete={() => deleteCourse.mutate(item._id)} />
              </div>
            ),
          },
        ]}
      />
      </div>
    </div>
  );
}

export function AdminCourseDetailPage({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "course", courseId], queryFn: () => adminApi.courseDetail(courseId) });
  const faculties = useQuery({ queryKey: ["admin", "faculties"], queryFn: adminApi.faculties });
  const departments = useQuery({ queryKey: ["admin", "departments"], queryFn: adminApi.departments });
  const lecturers = useQuery({ queryKey: ["admin", "lecturers"], queryFn: adminApi.lecturers });
  const [lecturerId, setLecturerId] = useState("");
  const [courseForm, setCourseForm] = useState({
    title: "",
    code: "",
    faculty: "",
    department: "",
    level: "100",
    semester: "first",
    academicSession: "",
    courseType: "core",
  });
  const updateCourse = useMutation({
    mutationFn: () =>
      adminApi.updateCourse(courseId, {
        ...courseForm,
        level: Number(courseForm.level),
      }),
    onSuccess: async () => {
      toast.success("Course updated");
      await queryClient.invalidateQueries({ queryKey: ["admin", "course", courseId] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const assignLecturer = useMutation({
    mutationFn: () => adminApi.assignLecturer({ courseId, lecturerId }),
    onSuccess: async () => {
      toast.success("Lecturer assigned to course");
      setLecturerId("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "course", courseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const course = data?.data.course;
  const assignedLecturers = data?.data.lecturers || [];
  const enrollments = data?.data.enrollments || [];

  useEffect(() => {
    if (course) {
      setCourseForm({
        title: course.title || "",
        code: course.code || "",
        faculty: typeof course.faculty === "object" && course.faculty && "_id" in course.faculty ? String((course.faculty as { _id?: string })._id || "") : "",
        department: typeof course.department === "object" && course.department && "_id" in course.department ? String((course.department as { _id?: string })._id || "") : "",
        level: String(course.level || "100"),
        semester: course.semester || "first",
        academicSession: course.academicSession || "",
        courseType: course.courseType || "core",
      });
    }
  }, [course]);

  return (
    <div className="space-y-6">
      <DetailHero
        title={course?.title || "Course detail"}
        subtitle={course?.code || "Administrative view of assignments, enrollments, and lecturer ownership for this course."}
        badges={
          <>
            <Badge>{course?.courseType || "--"}</Badge>
            <Badge tone="neutral">{course?.semester || "--"}</Badge>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <CardTitle>{course?.title || "Course detail"}</CardTitle>
          <CardDescription>{course?.code || "Administrative overview"}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="panel-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Course type</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{course?.courseType || "--"}</p>
          </div>
          <div className="panel-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Semester</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{course?.semester || "--"}</p>
          </div>
          <div className="panel-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Faculty</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{getUnitName(course?.faculty)}</p>
          </div>
          <div className="panel-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Department</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{getUnitName(course?.department)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Edit course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledField label="Course title">
            <Input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} />
          </LabeledField>
          <LabeledField label="Course code">
            <Input value={courseForm.code} onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value })} />
          </LabeledField>
          <LabeledField label="Faculty">
            <select className="portal-select" value={courseForm.faculty} onChange={(event) => setCourseForm({ ...courseForm, faculty: event.target.value })}>
              <option value="">Select faculty</option>
              {(faculties.data?.data || []).map((faculty) => <option key={faculty._id} value={faculty._id}>{faculty.name}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Department">
            <select className="portal-select" value={courseForm.department} onChange={(event) => setCourseForm({ ...courseForm, department: event.target.value })}>
              <option value="">Select department</option>
              {(departments.data?.data || []).map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </LabeledField>
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Level">
              <Input value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })} />
            </LabeledField>
            <LabeledField label="Academic session">
              <Input value={courseForm.academicSession} onChange={(event) => setCourseForm({ ...courseForm, academicSession: event.target.value })} />
            </LabeledField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Semester">
              <select className="portal-select" value={courseForm.semester} onChange={(event) => setCourseForm({ ...courseForm, semester: event.target.value })}>
                <option value="first">First</option>
                <option value="second">Second</option>
              </select>
            </LabeledField>
            <LabeledField label="Course type">
              <select className="portal-select" value={courseForm.courseType} onChange={(event) => setCourseForm({ ...courseForm, courseType: event.target.value })}>
                <option value="core">Core</option>
                <option value="elective">Elective</option>
              </select>
            </LabeledField>
          </div>
          <Button onClick={() => updateCourse.mutate()} disabled={updateCourse.isPending || !courseForm.title || !courseForm.code}>
            Save updates
          </Button>
        </CardContent>
      </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Assign lecturer</CardTitle>
            <CardDescription>One course can be managed by multiple lecturers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LabeledField label="Lecturer">
              <select
                className="portal-select"
                value={lecturerId}
                onChange={(event) => setLecturerId(event.target.value)}
              >
                <option value="">Select lecturer</option>
                {(lecturers.data?.data || []).map((lecturer) => (
                  <option key={lecturer._id} value={lecturer._id}>
                    {lecturer.fullName}
                  </option>
                ))}
              </select>
            </LabeledField>
            <Button onClick={() => assignLecturer.mutate()} disabled={!lecturerId || assignLecturer.isPending}>
              Assign lecturer
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assigned lecturers</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={assignedLecturers}
              columns={[
                { key: "lecturer", header: "Lecturer", render: (item: any) => item.lecturer?.fullName || item.fullName || "--" },
                { key: "email", header: "Email", render: (item: any) => item.lecturer?.email || item.email || "--" },
                { key: "role", header: "Role", render: (item: any) => <Badge>{item.role || item.lecturer?.role || "lecturer"}</Badge> },
              ]}
              emptyTitle="No lecturers assigned"
              emptyDescription="Assign teaching staff to activate the course workspace."
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
          <CardDescription>Approval status across core and elective participation.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={enrollments}
            columns={[
              { key: "student", header: "Student", render: (item: any) => item.student?.fullName || "--" },
              { key: "matric", header: "Matric", render: (item: any) => item.student?.matricNumber || "--" },
              { key: "status", header: "Approval", render: (item: any) => <Badge>{item.approvalStatus || "--"}</Badge> },
              { key: "date", header: "Created", render: (item: any) => formatDate(item.createdAt, true) },
            ]}
            emptyTitle="No enrollments"
            emptyDescription="No students are enrolled in this course yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminSeededStudentsPage() {
  const queryClient = useQueryClient();
  const faculties = useQuery({ queryKey: ["admin", "faculties"], queryFn: adminApi.faculties });
  const departments = useQuery({ queryKey: ["admin", "departments"], queryFn: adminApi.departments });
  const { data } = useQuery({ queryKey: ["admin", "seeded-students"], queryFn: adminApi.seededStudents });
  const [bulkRows, setBulkRows] = useState("");
  const [csvRows, setCsvRows] = useState<SeedStudentInput[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [form, setForm] = useState({
    matricNumber: "",
    fullName: "",
    faculty: "",
    department: "",
    level: "100",
    email: "",
    phone: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const parsedRows = bulkRows
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [matricNumber, fullName, faculty, department, level, email, phone] = line.split(",").map((part) => part.trim());
      return { matricNumber, fullName, faculty, department, level: Number(level), email, phone };
    });
  const seedStudents = useMutation({
    mutationFn: (students: Array<Record<string, unknown>>) => adminApi.seedStudents(students),
    onSuccess: async () => {
      toast.success("Seeded student records saved");
      setBulkRows("");
      setCsvRows([]);
      setCsvFileName("");
      setForm({ matricNumber: "", fullName: "", faculty: "", department: "", level: "100", email: "", phone: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "seeded-students"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const updateSeededStudent = useMutation({
    mutationFn: () => adminApi.updateSeededStudent(editingId!, { ...form, level: Number(form.level) }),
    onSuccess: async () => {
      toast.success("Seeded student updated");
      setEditingId(null);
      setForm({ matricNumber: "", fullName: "", faculty: "", department: "", level: "100", email: "", phone: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "seeded-students"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteSeededStudent = useMutation({
    mutationFn: (id: string) => adminApi.deleteSeededStudent(id),
    onSuccess: async () => {
      toast.success("Seeded student deleted");
      await queryClient.invalidateQueries({ queryKey: ["admin", "seeded-students"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a CSV file.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const rows = parseSeededStudentsCsv(text);
      setCsvRows(rows);
      setCsvFileName(file.name);
      toast.success(`${rows.length} student row${rows.length === 1 ? "" : "s"} ready to upload.`);
    } catch (error) {
      setCsvRows([]);
      setCsvFileName("");
      toast.error(error instanceof Error ? error.message : "Failed to parse CSV file.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Student records"
        title="Student roster"
        description="Add, import, and manage the student records used for portal access."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit student record" : "Add student record"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Matric number"><Input value={form.matricNumber} onChange={(event) => setForm({ ...form, matricNumber: event.target.value })} /></LabeledField>
            <LabeledField label="Full name"><Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></LabeledField>
            <LabeledField label="Faculty">
            <select className="portal-select" value={form.faculty} onChange={(event) => setForm({ ...form, faculty: event.target.value })}>
                <option value="">Select faculty</option>
                {(faculties.data?.data || []).map((faculty) => <option key={faculty._id} value={faculty._id}>{faculty.name}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Department">
            <select className="portal-select" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>
                <option value="">Select department</option>
                {(departments.data?.data || []).map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Level"><Input value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} /></LabeledField>
            <LabeledField label="Email"><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></LabeledField>
            <LabeledField label="Phone"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></LabeledField>
            <div className="md:col-span-2">
              <div className="flex gap-3">
                <Button
                  onClick={() => (editingId ? updateSeededStudent.mutate() : seedStudents.mutate([{ ...form, level: Number(form.level) }]))}
                  disabled={!form.matricNumber || !form.fullName || !form.faculty || !form.department || seedStudents.isPending || updateSeededStudent.isPending}
                >
                  {editingId ? "Save changes" : "Add student"}
                </Button>
                {editingId ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(null);
                      setForm({ matricNumber: "", fullName: "", faculty: "", department: "", level: "100", email: "", phone: "" });
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Import student records</CardTitle>
              <Button
                type="button"
                variant="secondary"
                className="w-full shrink-0 justify-center rounded-[14px] sm:w-auto sm:self-start sm:whitespace-nowrap"
                onClick={downloadSeededStudentCsvTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download template
              </Button>
            </div>
            <CardDescription>Upload a CSV file or paste rows as `matricNumber,fullName,faculty,department,level,email,phone`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[#f8fafc] p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">CSV upload</p>
                <p className="text-sm text-slate-600">Use header names like `matricNumber,fullName,faculty,department,level,email,phone` and enter real faculty and department names.</p>
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[rgba(0,74,173,0.2)] hover:bg-[rgba(0,74,173,0.04)]">
                <Upload className="h-4 w-4" />
                Choose CSV file
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
              </label>
              {csvFileName ? (
                <div className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-medium">{csvFileName}</p>
                  <p>{csvRows.length} row(s) parsed and ready for upload.</p>
                </div>
              ) : null}
              {csvRows.length ? (
                <div className="space-y-3 rounded-[1.25rem] border border-[rgba(0,27,58,0.08)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">CSV preview</p>
                      <p className="text-sm text-slate-600">Showing the first 5 parsed rows before import.</p>
                    </div>
                    <Button type="button" onClick={() => seedStudents.mutate(csvRows)} disabled={seedStudents.isPending}>
                      Import CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2 pr-4 font-medium">Matric</th>
                          <th className="py-2 pr-4 font-medium">Student</th>
                          <th className="py-2 pr-4 font-medium">Faculty</th>
                          <th className="py-2 pr-4 font-medium">Department</th>
                          <th className="py-2 pr-4 font-medium">Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvRows.slice(0, 5).map((row) => (
                          <tr key={`${row.matricNumber}-${row.department}`}>
                            <td className="py-2 pr-4 text-slate-900">{row.matricNumber}</td>
                            <td className="py-2 pr-4 text-slate-900">{row.fullName}</td>
                            <td className="py-2 pr-4 text-slate-600">{row.faculty}</td>
                            <td className="py-2 pr-4 text-slate-600">{row.department}</td>
                            <td className="py-2 pr-4 text-slate-600">{row.level}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
            <Textarea
              value={bulkRows}
              onChange={(event) => setBulkRows(event.target.value)}
              placeholder="BU22CSC1001,Adaobi Okafor,Engineering,Computer Science,300,adaobi@example.edu,+234800000001"
            />
            <Button onClick={() => seedStudents.mutate(parsedRows)} disabled={!parsedRows.length || seedStudents.isPending}>
              Upload pasted rows
            </Button>
          </CardContent>
        </Card>
      </div>
      <DataTable
        data={data?.data || []}
        columns={[
          { key: "student", header: "Student", render: (item) => item.fullName || "--" },
          { key: "matric", header: "Matric", render: (item) => item.matricNumber || "--" },
          { key: "faculty", header: "Faculty", render: (item) => getUnitName(item.faculty) },
          { key: "department", header: "Department", render: (item) => getUnitName(item.department) },
          { key: "level", header: "Level", render: (item) => item.level || "--" },
          {
            key: "actions",
            header: "",
            render: (item: any) => (
              <div className="flex gap-1">
                <RowEdit
                  onEdit={() => {
                    setEditingId(item._id);
                    setForm({
                      matricNumber: item.matricNumber || "",
                      fullName: item.fullName || "",
                      faculty: typeof item.faculty === "object" && item.faculty && "_id" in item.faculty ? String((item.faculty as { _id?: string })._id || "") : "",
                      department: typeof item.department === "object" && item.department && "_id" in item.department ? String((item.department as { _id?: string })._id || "") : "",
                      level: String(item.level || "100"),
                      email: item.email || "",
                      phone: item.phone || "",
                    });
                  }}
                />
                <RowDelete onDelete={() => deleteSeededStudent.mutate(item._id)} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export function AdminStudentsPage() {
  const { data } = useQuery({ queryKey: ["admin", "students"], queryFn: adminApi.students });
  return (
    <DataTable
      data={data?.data || []}
      columns={[
        { key: "name", header: "Student", render: (item) => item.fullName || "--" },
        { key: "matric", header: "Matric", render: (item) => item.matricNumber || "--" },
        { key: "email", header: "Email", render: (item) => item.email || "--" },
        { key: "department", header: "Department", render: (item) => getUnitName(item.department) },
        { key: "level", header: "Level", render: (item) => item.level || "--" },
      ]}
    />
  );
}

export function AdminSeededLecturersPage() {
  const queryClient = useQueryClient();
  const faculties = useQuery({ queryKey: ["admin", "faculties"], queryFn: adminApi.faculties });
  const departments = useQuery({ queryKey: ["admin", "departments"], queryFn: adminApi.departments });
  const seededLecturers = useQuery({ queryKey: ["admin", "seeded-lecturers"], queryFn: adminApi.seededLecturers });
  const [bulkRows, setBulkRows] = useState("");
  const [csvRows, setCsvRows] = useState<SeedLecturerInput[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [seedForm, setSeedForm] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    phone: "",
    faculty: "",
    department: "",
  });
  const [seedEditingId, setSeedEditingId] = useState<string | null>(null);
  const parsedRows = bulkRows
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [employeeId, fullName, email, faculty, department, phone] = line.split(",").map((part) => part.trim());
      return { employeeId, fullName, email, faculty, department, phone };
    });

  const seedLecturers = useMutation({
    mutationFn: (lecturers: Array<Record<string, unknown>>) => adminApi.seedLecturers(lecturers),
    onSuccess: async () => {
      toast.success("Lecturer records saved");
      setBulkRows("");
      setCsvRows([]);
      setCsvFileName("");
      setSeedEditingId(null);
      setSeedForm({ fullName: "", employeeId: "", email: "", phone: "", faculty: "", department: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "seeded-lecturers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "lecturers"] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const updateSeededLecturer = useMutation({
    mutationFn: () => adminApi.updateSeededLecturer(seedEditingId!, { ...seedForm }),
    onSuccess: async () => {
      toast.success("Lecturer record updated");
      setSeedEditingId(null);
      setSeedForm({ fullName: "", employeeId: "", email: "", phone: "", faculty: "", department: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "seeded-lecturers"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteSeededLecturer = useMutation({
    mutationFn: (id: string) => adminApi.deleteSeededLecturer(id),
    onSuccess: async () => {
      toast.success("Lecturer record removed");
      await queryClient.invalidateQueries({ queryKey: ["admin", "seeded-lecturers"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a CSV file.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const rows = parseSeededLecturersCsv(text);
      setCsvRows(rows);
      setCsvFileName(file.name);
      toast.success(`${rows.length} lecturer row${rows.length === 1 ? "" : "s"} ready to upload.`);
    } catch (error) {
      setCsvRows([]);
      setCsvFileName("");
      toast.error(error instanceof Error ? error.message : "Failed to parse CSV file.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Teaching staff"
        title="Lecturer roster"
        description="Add one lecturer at a time or bulk import approved lecturer records for first-time account activation."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{seedEditingId ? "Edit lecturer record" : "Add lecturer record"}</CardTitle>
            <CardDescription>
              Every lecturer added here is activation-ready. The admin enters the official identity details once, then the lecturer finishes account setup from the activation page with a personal password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LabeledField label="Full name"><Input value={seedForm.fullName} onChange={(event) => setSeedForm({ ...seedForm, fullName: event.target.value })} /></LabeledField>
            <LabeledField label="Employee ID"><Input value={seedForm.employeeId} onChange={(event) => setSeedForm({ ...seedForm, employeeId: event.target.value })} /></LabeledField>
            <LabeledField label="Institutional email"><Input type="email" value={seedForm.email} onChange={(event) => setSeedForm({ ...seedForm, email: event.target.value })} /></LabeledField>
            <LabeledField label="Phone"><Input value={seedForm.phone} onChange={(event) => setSeedForm({ ...seedForm, phone: event.target.value })} /></LabeledField>
            <LabeledField label="Faculty">
              <select className="portal-select" value={seedForm.faculty} onChange={(event) => setSeedForm({ ...seedForm, faculty: event.target.value })}>
                <option value="">Select faculty</option>
                {(faculties.data?.data || []).map((faculty) => <option key={faculty._id} value={faculty._id}>{faculty.name}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Department">
              <select className="portal-select" value={seedForm.department} onChange={(event) => setSeedForm({ ...seedForm, department: event.target.value })}>
                <option value="">Select department</option>
                {(departments.data?.data || []).map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
              </select>
            </LabeledField>
            <div className="flex gap-3">
              <Button
                onClick={() => (seedEditingId ? updateSeededLecturer.mutate() : seedLecturers.mutate([{ ...seedForm }]))}
                disabled={
                  !seedForm.fullName ||
                  !seedForm.employeeId ||
                  !seedForm.email ||
                  !seedForm.faculty ||
                  !seedForm.department ||
                  seedLecturers.isPending ||
                  updateSeededLecturer.isPending
                }
              >
                {seedEditingId ? "Save lecturer record" : "Add lecturer"}
              </Button>
              {seedEditingId ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSeedEditingId(null);
                    setSeedForm({ fullName: "", employeeId: "", email: "", phone: "", faculty: "", department: "" });
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Import lecturer records</CardTitle>
              <Button
                type="button"
                variant="secondary"
                className="w-full shrink-0 justify-center rounded-[14px] sm:w-auto sm:self-start sm:whitespace-nowrap"
                onClick={downloadSeededLecturerCsvTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download template
              </Button>
            </div>
            <CardDescription>Upload a CSV file or paste rows as `employeeId,fullName,email,faculty,department,phone`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[#f8fafc] p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">CSV upload</p>
                <p className="text-sm text-slate-600">Use real faculty and department names so each lecturer can be matched correctly during import.</p>
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[rgba(0,74,173,0.2)] hover:bg-[rgba(0,74,173,0.04)]">
                <Upload className="h-4 w-4" />
                Choose CSV file
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
              </label>
              {csvFileName ? (
                <div className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-medium">{csvFileName}</p>
                  <p>{csvRows.length} row(s) parsed and ready for upload.</p>
                </div>
              ) : null}
              {csvRows.length ? (
                <div className="space-y-3 rounded-[1.25rem] border border-[rgba(0,27,58,0.08)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">CSV preview</p>
                      <p className="text-sm text-slate-600">Showing the first 5 parsed lecturer rows before import.</p>
                    </div>
                    <Button type="button" onClick={() => seedLecturers.mutate(csvRows)} disabled={seedLecturers.isPending}>
                      Import CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2 pr-4 font-medium">Employee ID</th>
                          <th className="py-2 pr-4 font-medium">Lecturer</th>
                          <th className="py-2 pr-4 font-medium">Email</th>
                          <th className="py-2 pr-4 font-medium">Faculty</th>
                          <th className="py-2 pr-4 font-medium">Department</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvRows.slice(0, 5).map((row) => (
                          <tr key={`${row.employeeId}-${row.email}`}>
                            <td className="py-2 pr-4 text-slate-900">{row.employeeId}</td>
                            <td className="py-2 pr-4 text-slate-900">{row.fullName}</td>
                            <td className="py-2 pr-4 text-slate-600">{row.email}</td>
                            <td className="py-2 pr-4 text-slate-600">{row.faculty}</td>
                            <td className="py-2 pr-4 text-slate-600">{row.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
            <Textarea
              value={bulkRows}
              onChange={(event) => setBulkRows(event.target.value)}
              placeholder="ENG-L-001,Dr Ada Nwosu,ada.nwosu@campusflow.edu,Engineering,Computer Science,+234800000101"
            />
            <Button onClick={() => seedLecturers.mutate(parsedRows)} disabled={!parsedRows.length || seedLecturers.isPending}>
              Upload pasted rows
            </Button>
          </CardContent>
        </Card>
      </div>

      <Alert variant="info">
        Lecturer records listed here are the approved roster. When a lecturer completes first-time activation, the record stays on file and is marked as activated.
      </Alert>

      <DataTable
        data={seededLecturers.data?.data || []}
        emptyTitle="No lecturer records yet"
        emptyDescription="Add a lecturer manually or bulk import a roster before lecturers can activate their own accounts."
        columns={[
          { key: "name", header: "Lecturer", render: (item) => item.fullName || "--" },
          { key: "employeeId", header: "Employee ID", render: (item) => item.employeeId || "--" },
          { key: "email", header: "Email", render: (item) => item.email || "--" },
          { key: "faculty", header: "Faculty", render: (item) => getUnitName(item.faculty) },
          { key: "department", header: "Department", render: (item) => getUnitName(item.department) },
          {
            key: "activation",
            header: "Activation",
            render: (item) => <Badge tone={item.isActivated ? "success" : "warning"}>{item.isActivated ? "Activated" : "Pending activation"}</Badge>,
          },
          {
            key: "actions",
            header: "",
            render: (item: any) => (
              item.isActivated ? (
                <span className="text-xs font-medium text-slate-400">Locked</span>
              ) : (
                <div className="flex gap-1">
                  <RowEdit
                    onEdit={() => {
                      setSeedEditingId(item._id);
                      setSeedForm({
                        fullName: item.fullName || "",
                        employeeId: item.employeeId || "",
                        email: item.email || "",
                        phone: item.phone || "",
                        faculty:
                          typeof item.faculty === "object" && item.faculty && "_id" in item.faculty
                            ? String((item.faculty as { _id?: string })._id || "")
                            : "",
                        department:
                          typeof item.department === "object" && item.department && "_id" in item.department
                            ? String((item.department as { _id?: string })._id || "")
                            : "",
                      });
                    }}
                  />
                  <RowDelete onDelete={() => deleteSeededLecturer.mutate(item._id)} />
                </div>
              )
            ),
          },
        ]}
      />
    </div>
  );
}

export function AdminLecturersPage() {
  const queryClient = useQueryClient();
  const lecturerAccounts = useQuery({ queryKey: ["admin", "lecturers"], queryFn: adminApi.lecturers });
  const [accountEditingId, setAccountEditingId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    employeeId: "",
  });

  const updateLecturer = useMutation({
    mutationFn: () =>
      adminApi.updateLecturer(accountEditingId!, {
        fullName: accountForm.fullName,
        email: accountForm.email,
        phone: accountForm.phone,
      }),
    onSuccess: async () => {
      toast.success("Lecturer account updated");
      setAccountEditingId(null);
      setAccountForm({ fullName: "", email: "", phone: "", employeeId: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "lecturers"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteLecturer = useMutation({
    mutationFn: (id: string) => adminApi.deleteLecturer(id),
    onSuccess: async () => {
      toast.success("Lecturer account deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "lecturers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "seeded-lecturers"] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Teaching staff"
        title="Lecturers"
        description="Manage activated lecturer accounts. Use the lecturer roster page to add new lecturers or bulk import activation-ready records."
      />
      <Alert variant="info">
        This page is only for live lecturer accounts. New lecturers should first be added from Lecturer Roster, then they activate access with their employee ID and institutional email.
      </Alert>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{accountEditingId ? "Edit lecturer account" : "Active lecturer accounts"}</CardTitle>
            <CardDescription>
              Update contact details for activated lecturers. Removing an account reopens the lecturer record for future activation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountEditingId ? (
              <>
                <LabeledField label="Full name"><Input value={accountForm.fullName} onChange={(event) => setAccountForm({ ...accountForm, fullName: event.target.value })} /></LabeledField>
                <LabeledField label="Email"><Input type="email" value={accountForm.email} onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })} /></LabeledField>
                <LabeledField label="Phone"><Input value={accountForm.phone} onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })} /></LabeledField>
                <LabeledField label="Employee ID"><Input value={accountForm.employeeId} disabled /></LabeledField>
                <div className="flex gap-3">
                  <Button onClick={() => updateLecturer.mutate()} disabled={!accountForm.fullName || !accountForm.email || updateLecturer.isPending}>
                    Save lecturer
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAccountEditingId(null);
                      setAccountForm({ fullName: "", email: "", phone: "", employeeId: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState
                title="Select an active lecturer"
                description="Use the table to the right to edit or remove an activated lecturer account."
              />
            )}
          </CardContent>
        </Card>

        <DataTable
          data={lecturerAccounts.data?.data || []}
          emptyTitle="No activated lecturers yet"
          emptyDescription="Activated lecturer accounts will appear here after staff complete their first-time registration."
          columns={[
            { key: "name", header: "Lecturer", render: (item) => item.fullName || "--" },
            { key: "employeeId", header: "Employee ID", render: (item) => item.employeeId || "--" },
            { key: "email", header: "Email", render: (item) => item.email || "--" },
            { key: "phone", header: "Phone", render: (item) => item.phone || "--" },
            { key: "status", header: "Status", render: (item) => <Badge tone={item.status === "active" ? "success" : "warning"}>{item.status || "--"}</Badge> },
            {
              key: "actions",
              header: "",
              render: (item) => (
                <div className="flex gap-1">
                  <RowEdit
                    onEdit={() => {
                      setAccountEditingId(item._id);
                      setAccountForm({
                        fullName: item.fullName || "",
                        email: item.email || "",
                        phone: item.phone || "",
                        employeeId: item.employeeId || "",
                      });
                    }}
                  />
                  <RowDelete onDelete={() => deleteLecturer.mutate(item._id)} />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const students = useQuery({ queryKey: ["admin", "students"], queryFn: adminApi.students });
  const lecturers = useQuery({ queryKey: ["admin", "lecturers"], queryFn: adminApi.lecturers });
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const createAdmin = useMutation({
    mutationFn: () => adminApi.createAdmin(form),
    onSuccess: () => {
      toast.success("Admin user created");
      setForm({ fullName: "", email: "", password: "" });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = [
    ...(students.data?.data || []).map((item) => ({
      id: item._id,
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      role: "student",
      status: "active",
    })),
    ...(lecturers.data?.data || []).map((item) => ({
      id: item._id,
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      role: "lecturer",
      status: "active",
    })),
  ].filter((item) => {
    const matchesQuery = [item.fullName, item.email, item.phone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : item.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Platform access"
        title="User management"
        description="Search institution-wide users, review active student and lecturer accounts, and create new internal administrators."
        actions={(
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add new user
          </Button>
        )}
      />

      <PageControlCard>
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-[3.75rem] rounded-[1.3rem] pl-12"
              placeholder="Search by name or email..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select className="portal-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="lecturer">Teachers</option>
          </select>
          <Button variant="secondary" className="h-[3.75rem]">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </PageControlCard>

      <Card>
        <CardHeader>
          <CardTitle>Showing {rows.length} users</CardTitle>
          <CardDescription>Operational list of student and lecturer accounts currently available to the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={rows}
            emptyTitle="No matching users"
            emptyDescription="Try adjusting the search query or selected role filter."
            columns={[
              {
                key: "name",
                header: "Name",
                render: (item) => (
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                      {item.fullName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.phone || item.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Role",
                render: (item) => (
                  <Badge tone={item.role === "lecturer" ? "info" : "success"}>
                    {item.role === "lecturer" ? "Teacher" : "Student"}
                  </Badge>
                ),
              },
              { key: "email", header: "Email", render: (item) => item.email || "--" },
              { key: "status", header: "Status", render: () => <Badge tone="success">Active</Badge> },
              {
                key: "actions",
                header: "Actions",
                render: () => (
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="secondary">Edit</Button>
                    <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700">Delete</Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create admin user</CardTitle>
          <CardDescription>
            Create internal administrators with direct access to the admin console.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
        <LabeledField label="Full name">
          <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        </LabeledField>
        <LabeledField label="Email">
          <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </LabeledField>
        <LabeledField label="Password">
          <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </LabeledField>
        <div className="md:col-span-2">
          <Button onClick={() => createAdmin.mutate()} disabled={!form.fullName || !form.email || !form.password || createAdmin.isPending}>
            Create admin
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminElectiveApprovalsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "elective-requests"], queryFn: adminApi.electiveRequests });
  const requests = data?.data || [];
  const pendingCount = requests.filter((item) => item.approvalStatus === "pending").length;
  const approvedCount = requests.filter((item) => item.approvalStatus === "approved").length;
  const rejectedCount = requests.filter((item) => item.approvalStatus === "rejected").length;
  const updateApproval = useMutation({
    mutationFn: ({
      id,
      approvalStatus,
      rejectionReason,
    }: {
      id: string;
      approvalStatus: "approved" | "rejected";
      rejectionReason?: string;
    }) => adminApi.approveElectiveRequest(id, { approvalStatus, rejectionReason }),
    onSuccess: async () => {
      toast.success("Elective request updated");
      await queryClient.invalidateQueries({ queryKey: ["admin", "elective-requests"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Enrollment governance"
        title="Elective approvals"
        description="Review pending elective requests and accept or reject them with administrative authority."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} title="Pending requests" value={pendingCount} />
        <StatCard icon={ShieldCheck} title="Approved" value={approvedCount} />
        <StatCard icon={Bell} title="Rejected" value={rejectedCount} />
      </div>
      <PageControlCard>
        <Alert>
          Review each request against the student&apos;s department, level, and course eligibility before approval.
        </Alert>
      </PageControlCard>
      <DataTable
        data={requests}
        columns={[
          { key: "student", header: "Student", render: (item) => item.student?.fullName || "--" },
          { key: "matric", header: "Matric", render: (item) => item.student?.matricNumber || "--" },
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "type", header: "Type", render: (item) => <Badge>{item.course?.courseType || "--"}</Badge> },
          {
            key: "actions",
            header: "Actions",
            render: (item) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateApproval.mutate({ id: item._id, approvalStatus: "approved" })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    updateApproval.mutate({
                      id: item._id,
                      approvalStatus: "rejected",
                      rejectionReason: "Rejected by administrator",
                    })
                  }
                >
                  Reject
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export function AdminAttendanceSessionsPage() {
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({ queryKey: ["admin", "courses"], queryFn: adminApi.courses });
  const { data } = useQuery({ queryKey: ["admin", "attendance-sessions"], queryFn: adminApi.attendanceSessions });
  const [reportCourseId, setReportCourseId] = useState("");
  const [liveSessionId, setLiveSessionId] = useState("");
  const [liveStreamData, setLiveStreamData] = useState<AttendanceSessionLiveView | null>(null);
  const [liveStreamStatus, setLiveStreamStatus] = useState<"idle" | "connecting" | "live" | "reconnecting" | "error">("idle");
  const [liveHeartbeatAt, setLiveHeartbeatAt] = useState<string | null>(null);
  const [presenceTrails, setPresenceTrails] = useState<Record<string, Array<{ latitude: number; longitude: number }>>>({});
  const sessions = data?.data || [];
  const activeCount = sessions.filter((item) => item.status === "active").length;
  const activeReportCourseId = reportCourseId || coursesQuery.data?.data?.[0]?._id || "";
  const activeLiveSessionId = liveSessionId || sessions.find((item) => item.status === "active")?._id || "";
  const attendancePercentagesQuery = useQuery({
    queryKey: ["admin", "attendance-percentages", activeReportCourseId],
    enabled: Boolean(activeReportCourseId),
    queryFn: () => adminApi.reportsCourseAttendancePercentages(activeReportCourseId),
  });
  const liveSessionQuery = useQuery({
    queryKey: ["admin", "attendance-session-live", activeLiveSessionId],
    enabled: Boolean(activeLiveSessionId),
    queryFn: () => adminApi.attendanceSessionLive(activeLiveSessionId),
  });
  const liveView = liveStreamData || liveSessionQuery.data?.data;

  useEffect(() => {
    if (!activeLiveSessionId) {
      setLiveStreamData(null);
      setLiveStreamStatus("idle");
      setLiveHeartbeatAt(null);
      setPresenceTrails({});
      return;
    }

    const controller = new AbortController();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:10000/api/v1";
    setLiveStreamStatus((current) => (current === "idle" ? "connecting" : "reconnecting"));

    openSseStream<AttendanceSessionLiveView>(
      `${baseUrl}/admin/attendance-sessions/${activeLiveSessionId}/live/stream`,
      {
        onOpen: () => setLiveStreamStatus("live"),
        onHeartbeat: () => setLiveHeartbeatAt(new Date().toISOString()),
        onMessage: (payload) => {
          setLiveStreamStatus("live");
          setLiveHeartbeatAt(new Date().toISOString());
          setLiveStreamData(payload);
        },
        onClose: () => setLiveStreamStatus("reconnecting"),
        onError: (error) => {
          setLiveStreamStatus("error");
          console.error("Admin live attendance stream error:", error);
        },
      },
      controller.signal,
    ).catch((error) => {
      if (!controller.signal.aborted) {
        setLiveStreamStatus("error");
        console.error("Admin live attendance stream failed:", error);
      }
    });

    return () => controller.abort();
  }, [activeLiveSessionId]);

  useEffect(() => {
    if (!liveView?.presences?.length) return;

    setPresenceTrails((current) => {
      const next = { ...current };

      liveView.presences.forEach((presence) => {
        if (typeof presence.latitude !== "number" || typeof presence.longitude !== "number") return;

        const existing = next[presence._id] || [];
        const latest = existing[existing.length - 1];
        const samePoint =
          latest &&
          Math.abs(latest.latitude - presence.latitude) < 0.00001 &&
          Math.abs(latest.longitude - presence.longitude) < 0.00001;

        if (!samePoint) {
          next[presence._id] = [...existing, { latitude: presence.latitude, longitude: presence.longitude }].slice(-6);
        } else {
          next[presence._id] = existing;
        }
      });

      return next;
    });
  }, [liveView]);
  const cancelSession = useMutation({
    mutationFn: (id: string) => adminApi.cancelAttendanceSession(id),
    onSuccess: async () => {
      toast.success("Attendance session cancelled");
      await queryClient.invalidateQueries({ queryKey: ["admin", "attendance-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "attendance-percentages"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const exportSession = async (sessionId: string, format: "csv" | "pdf" | "docx") => {
    try {
      const response =
        format === "csv"
          ? await adminApi.exportAttendanceSessionCsv(sessionId)
          : format === "docx"
            ? await adminApi.exportAttendanceSessionDocx(sessionId)
            : await adminApi.exportAttendanceSessionPdf(sessionId);
      downloadBlob(
        response.data,
        getFilenameFromDisposition(
          response.headers["content-disposition"],
          format === "csv"
            ? "attendance-session.csv"
            : format === "docx"
              ? "attendance-session.docx"
              : "attendance-session.pdf",
        ),
      );
      toast.success(`Attendance ${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const attendanceReport = attendancePercentagesQuery.data?.data;
  const liveStudentPoints: AttendanceStudentPoint[] =
    liveView?.presences
      ?.filter((presence) => typeof presence.latitude === "number" && typeof presence.longitude === "number")
      .map((presence) => ({
        id: presence._id,
        name: presence.student?.fullName || "Unknown student",
        matricNumber: presence.student?.matricNumber || undefined,
        latitude: presence.latitude!,
        longitude: presence.longitude!,
        trail: presenceTrails[presence._id] || [{ latitude: presence.latitude!, longitude: presence.longitude! }],
        distanceFromSession: presence.distanceFromSession,
        accuracy: presence.accuracy,
        status: presence.submittedAttendance ? "submitted" : "joined",
        lastSeenAt: presence.lastSeenAt ? formatDate(presence.lastSeenAt, true) : undefined,
        connectionState: presence.connectionState,
      })) || [];

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Attendance oversight"
        title="Attendance sessions"
        description="Review live and historical attendance sessions across courses, lecturers, and access windows."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={GraduationCap} title="Total sessions" value={sessions.length} />
        <StatCard icon={ShieldCheck} title="Active sessions" value={activeCount} />
        <StatCard icon={Bell} title="Closed sessions" value={Math.max(sessions.length - activeCount, 0)} />
      </div>
      <DataTable
        data={sessions}
        columns={[
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "lecturer", header: "Lecturer", render: (item) => item.lecturer?.fullName || "--" },
          { key: "code", header: "Code", render: (item) => item.sessionCode || "--" },
          { key: "window", header: "Window", render: (item) => `${formatDate(item.startTime, true)} - ${formatDate(item.endTime, true)}` },
          { key: "status", header: "Status", render: (item) => <Badge>{item.status || "--"}</Badge> },
          {
            key: "actions",
            header: "",
            render: (item) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => exportSession(item._id, "pdf")}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button size="sm" variant="secondary" onClick={() => exportSession(item._id, "csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button size="sm" variant="secondary" onClick={() => exportSession(item._id, "docx")}>
                  <Download className="mr-2 h-4 w-4" />
                  DOCX
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:text-rose-700"
                  onClick={() => cancelSession.mutate(item._id)}
                  disabled={cancelSession.isPending || item.status === "cancelled"}
                >
                  Cancel
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Live session monitor</CardTitle>
          <CardDescription>
            View joined devices before submission and track which students have already submitted attendance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledField label="Session">
            <select className="portal-select" value={activeLiveSessionId} onChange={(event) => setLiveSessionId(event.target.value)}>
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.course?.title || "--"} - {session.sessionCode}
                </option>
              ))}
            </select>
          </LabeledField>
          {liveView ? (
            <>
              <Alert variant={liveStreamStatus === "error" ? "danger" : liveStreamStatus === "live" ? "success" : "warning"}>
                Stream status: {liveStreamStatus}
                {liveHeartbeatAt ? ` • Last update ${formatDate(liveHeartbeatAt, true)}` : ""}
              </Alert>
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard icon={Users} title="Joined devices" value={liveView.summary.joinedCount} />
                <StatCard icon={GraduationCap} title="Submitted" value={liveView.summary.submittedCount} />
                <StatCard icon={Bell} title="Joined not submitted" value={liveView.summary.joinedNotSubmittedCount} />
                <StatCard icon={Filter} title="Outside geofence" value={liveView.summary.outsideGeofenceCount} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard icon={Users} title="Live devices" value={Math.max(liveView.summary.joinedCount - liveView.summary.staleCount, 0)} />
                <StatCard icon={Bell} title="Stale devices" value={liveView.summary.staleCount} />
              </div>
              <AttendanceGeofenceMap
                latitude={liveView.session.latitude}
                longitude={liveView.session.longitude}
                radius={liveView.session.radius}
                venueLabel={liveView.session.roomLabel || liveView.session.detectedVenueLabel}
                studentPoints={liveStudentPoints}
              />
              <DataTable
                data={liveView.presences || []}
                columns={[
                  { key: "student", header: "Student", render: (item) => item.student?.fullName || "--" },
                  { key: "matric", header: "Matric", render: (item) => item.student?.matricNumber || "--" },
                  {
                    key: "session",
                    header: "State",
                    render: (item) => (
                      <Badge tone={item.connectionState === "stale" ? "neutral" : item.submittedAttendance ? "success" : "warning"}>
                        {item.connectionState === "stale"
                          ? "stale"
                          : item.submittedAttendance
                            ? "submitted"
                            : "joined"}
                      </Badge>
                    ),
                  },
                  { key: "lastSeen", header: "Last seen", render: (item) => formatDate(item.lastSeenAt, true) },
                  { key: "distance", header: "Distance", render: (item) => typeof item.distanceFromSession === "number" ? `${Math.round(item.distanceFromSession)}m` : "--" },
                ]}
              />
            </>
          ) : (
            <EmptyState title="No live session selected" description="Choose a session above to monitor joined devices and submitted attendance." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course attendance percentages</CardTitle>
          <CardDescription>
            Review current student attendance percentages by course at any point in the term.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <LabeledField label="Course">
                <select className="portal-select" value={activeReportCourseId} onChange={(event) => setReportCourseId(event.target.value)}>
                  <option value="">Select course</option>
                  {(coursesQuery.data?.data || []).map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} {course.title ? `- ${course.title}` : ""}
                    </option>
                  ))}
                </select>
              </LabeledField>
            </div>
            <StatCard icon={GraduationCap} title="Sessions" value={attendanceReport?.totalSessions || 0} />
            <StatCard icon={Users} title="Enrolled students" value={attendanceReport?.enrolledStudents || 0} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard icon={ShieldCheck} title="Avg attendance" value={`${attendanceReport?.averageAttendancePercentage || 0}%`} />
            <StatCard icon={Users} title="Meeting 75%" value={attendanceReport?.studentsMeetingThreshold || 0} />
            <StatCard icon={Bell} title="Below 75%" value={attendanceReport?.studentsBelowThreshold || 0} />
          </div>
          <DataTable
            data={attendanceReport?.students || []}
            columns={[
              { key: "student", header: "Student", render: (item) => item.student?.fullName || "--" },
              { key: "matric", header: "Matric", render: (item) => item.student?.matricNumber || "--" },
              { key: "submitted", header: "Successful submissions", render: (item) => item.submittedSessions ?? 0 },
              { key: "missed", header: "Missed sessions", render: (item) => item.missedSessions ?? 0 },
              {
                key: "rate",
                header: "Attendance %",
                render: (item) => (
                  <Badge tone={item.attendancePercentage >= 75 ? "success" : "warning"}>
                    {item.attendancePercentage?.toFixed?.(2) ?? item.attendancePercentage}%
                  </Badge>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminAttendanceRecordsPage() {
  const { data } = useQuery({ queryKey: ["admin", "attendance-records"], queryFn: adminApi.attendanceRecords });
  const records = data?.data || [];

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Attendance oversight"
        title="Attendance records"
        description="Inspect submitted attendance records across students, courses, and session codes for audit and compliance review."
      />
      <PageControlCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#838a9b]">{records.length} attendance record{records.length === 1 ? "" : "s"} available</p>
          <Badge tone="info">Audit-ready view</Badge>
        </div>
      </PageControlCard>
      <DataTable
        data={records}
        columns={[
          { key: "student", header: "Student", render: (item) => item.student?.fullName || "--" },
          { key: "matric", header: "Matric", render: (item) => item.student?.matricNumber || "--" },
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "session", header: "Session", render: (item) => item.session?.sessionCode || "--" },
          { key: "date", header: "Submitted", render: (item) => formatDate(item.createdAt, true) },
        ]}
      />
    </div>
  );
}

export function AdminMaterialsPage() {
  const { data } = useQuery({ queryKey: ["admin", "materials"], queryFn: adminApi.materials });
  const materials = data?.data || [];

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Academic oversight"
        title="Published materials"
        description="Track learning resources uploaded across the institution and inspect who published them and where they belong."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={FileText} title="Published materials" value={materials.length} />
        <StatCard icon={BookOpen} title="Courses represented" value={new Set(materials.map((item) => item.course?._id).filter(Boolean)).size} />
        <StatCard icon={Upload} title="Uploaders represented" value={new Set(materials.map((item) => item.uploader?._id).filter(Boolean)).size} />
      </div>
      <DataTable
        data={materials}
        columns={[
          { key: "title", header: "Title", render: (item) => item.title || "--" },
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "uploader", header: "Uploader", render: (item) => item.uploader?.fullName || "--" },
          {
            key: "file",
            header: "File",
            render: (item) =>
              item.fileUrl ? <FileLauncher fileUrl={item.fileUrl} fileName={item.fileName || item.title} triggerLabel="Open" /> : "--",
          },
        ]}
      />
    </div>
  );
}

export function AdminAssignmentsPage() {
  const { data } = useQuery({ queryKey: ["admin", "assignments"], queryFn: adminApi.assignments });
  const assignments = data?.data || [];
  const overdueCount = assignments.filter((item) => item.dueDate && new Date(item.dueDate) < new Date()).length;

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Academic oversight"
        title="Assignments"
        description="Inspect assignment publishing across courses, lecturers, and active due-date windows."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} title="Assignments" value={assignments.length} />
        <StatCard icon={Bell} title="Overdue" value={overdueCount} />
        <StatCard icon={Users} title="Active windows" value={Math.max(assignments.length - overdueCount, 0)} />
      </div>
      <DataTable
        data={assignments}
        columns={[
          { key: "title", header: "Assignment", render: (item) => item.title || "--" },
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "lecturer", header: "Lecturer", render: (item) => item.lecturer?.fullName || "--" },
          { key: "dueDate", header: "Due", render: (item) => formatDate(item.dueDate, true) },
        ]}
      />
    </div>
  );
}

export function AdminAssessmentAttemptsPage() {
  const { data } = useQuery({ queryKey: ["admin", "assessment-attempts"], queryFn: adminApi.assessmentAttempts });
  const attempts = data?.data || [];
  const gradedCount = attempts.filter((item) => item.score !== null && item.score !== undefined).length;

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Academic oversight"
        title="Assessment attempts"
        description="Track student attempt flow, grading progress, and returned scores across timed assessments."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={ShieldCheck} title="Attempts" value={attempts.length} />
        <StatCard icon={GraduationCap} title="Graded" value={gradedCount} />
        <StatCard icon={Bell} title="Awaiting score" value={Math.max(attempts.length - gradedCount, 0)} />
      </div>
      <DataTable
        data={attempts}
        columns={[
          { key: "assessment", header: "Assessment", render: (item) => item.assessment?.title || "--" },
          { key: "student", header: "Student", render: (item) => item.student?.fullName || "--" },
          { key: "status", header: "Status", render: (item) => <Badge>{item.status || "--"}</Badge> },
          { key: "score", header: "Score", render: (item) => item.score ?? "--" },
        ]}
      />
    </div>
  );
}

export function AdminCommunicationsPage() {
  const [page, setPage] = useState(1);
  const [selectedThread, setSelectedThread] = useState("");
  const threads = useQuery({ queryKey: ["admin", "message-threads", page], queryFn: () => communicationApi.threads(page) });
  const messages = useQuery({
    queryKey: ["admin", "thread-messages", selectedThread],
    enabled: Boolean(selectedThread),
    queryFn: () => communicationApi.threadMessages(selectedThread),
  });
  const announcements = useQuery({ queryKey: ["admin", "communication-announcements"], queryFn: communicationApi.announcements });
  const overview = useQuery({ queryKey: ["admin", "communications"], queryFn: adminApi.communications });

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Oversight"
        title="Communications"
        description="Monitor message threads and announcement streams across the academic system."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={MessageSquare} title="Message threads" value={threads.data?.data.total || 0} />
        <StatCard icon={Bell} title="Announcements" value={announcements.data?.data.length || 0} />
        <StatCard
          icon={Users}
          title="Communication totals"
          value={Object.keys((overview.data?.data as Record<string, unknown>) || {}).length}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thread summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(threads.data?.data.items || []).map((thread) => (
              <button
                key={thread.threadKey}
                type="button"
                onClick={() => setSelectedThread(thread.threadKey)}
                className="interactive-panel"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{thread.threadKey}</p>
                  {thread.unreadCount ? <Badge tone="warning">{thread.unreadCount}</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-slate-500">{thread.latestMessage?.body || "No preview available"}</p>
              </button>
            ))}
            <div className="flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {threads.data?.data.page || 1} of {threads.data?.data.totalPages || 1}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page >= (threads.data?.data.totalPages || 1)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Thread detail</CardTitle>
            <CardDescription>Academic messaging oversight across student and lecturer channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(messages.data?.data.items || []).map((message) => (
              <div key={message._id} className="panel-soft">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{message.sender?.fullName || "Unknown sender"}</p>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{formatDate(message.createdAt, true)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{message.body}</p>
              </div>
            ))}
            {!selectedThread ? (
              <EmptyState
                title="Select a thread"
                description="Open a message thread to inspect communication history."
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Announcement stream</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={announcements.data?.data || []}
            columns={[
              { key: "title", header: "Title", render: (item: any) => item.title || "--" },
              { key: "course", header: "Course", render: (item: any) => item.course?.title || "--" },
              { key: "body", header: "Body", render: (item: any) => item.body || "--" },
              { key: "date", header: "Published", render: (item: any) => formatDate(item.createdAt, true) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminAuditLogsPage() {
  const { data } = useQuery({ queryKey: ["admin", "audit-logs"], queryFn: adminApi.auditLogs });
  const logs = data?.data || [];

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Audit and compliance"
        title="Audit logs"
        description="Review actor activity, administrative events, and system actions recorded for accountability and traceability."
      />
      <PageControlCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#838a9b]">{logs.length} audit entr{logs.length === 1 ? "y" : "ies"} loaded</p>
          <Badge tone="warning">Compliance surface</Badge>
        </div>
      </PageControlCard>
      <DataTable
        data={logs}
        columns={[
          { key: "actor", header: "Actor", render: (item) => item.actor?.fullName || "--" },
          { key: "action", header: "Action", render: (item) => item.action || item.event || "--" },
          { key: "date", header: "Date", render: (item) => formatDate(item.createdAt, true) },
        ]}
      />
    </div>
  );
}

export function AdminReportsPage() {
  const system = useQuery({ queryKey: ["admin", "reports-system"], queryFn: adminApi.reportsSystem });
  const courses = useQuery({ queryKey: ["admin", "courses"], queryFn: adminApi.courses });
  const [courseId, setCourseId] = useState("");
  const attendance = useQuery({
    queryKey: ["admin", "reports-course-attendance", courseId],
    enabled: Boolean(courseId),
    queryFn: () => adminApi.reportsCourseAttendance(courseId!),
  });
  const academic = useQuery({
    queryKey: ["admin", "reports-course-academic", courseId],
    enabled: Boolean(courseId),
    queryFn: () => adminApi.reportsCourseAcademic(courseId!),
  });
  const enrollments = useQuery({ queryKey: ["admin", "reports-enrollments"], queryFn: adminApi.reportsEnrollments });
  const assignmentReport = useQuery({
    queryKey: ["admin", "reports-assignments", courseId],
    enabled: Boolean(courseId),
    queryFn: () => adminApi.reportsAssignments(courseId!),
  });
  const assessmentReport = useQuery({
    queryKey: ["admin", "reports-assessments", courseId],
    enabled: Boolean(courseId),
    queryFn: () => adminApi.reportsAssessments(courseId!),
  });
  const selectedCourse = (courses.data?.data || []).find((course: any) => course._id === courseId);
  const loadedCourseReports = [
    attendance.data?.data,
    academic.data?.data,
    assignmentReport.data?.data,
    assessmentReport.data?.data,
  ].filter(Boolean).length;

  const download = async (type: "csv" | "pdf") => {
    if (!courseId) return;
    try {
      const response =
        type === "csv"
          ? await adminApi.exportCourseAcademicCsv(courseId)
          : await adminApi.exportCourseAcademicPdf(courseId);
      downloadBlob(
        response.data as Blob,
        getFilenameFromDisposition(response.headers["content-disposition"], `report.${type}`),
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Reports and exports"
        title="Institutional reporting"
        description="Load course reports, review summaries, and export the available files."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={BookOpen}
          title="Selected course"
          value={selectedCourse ? 1 : 0}
          helper={selectedCourse?.code || "none"}
          tone="info"
        />
        <StatCard
          icon={FileText}
          title="Loaded course reports"
          value={loadedCourseReports}
          helper={courseId ? "course scope" : "select course"}
          tone="warning"
        />
        <StatCard icon={Download} title="Export formats" value={2} helper="CSV + PDF" tone="success" />
      </div>
      <PageControlCard>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <LabeledField label="Course filter">
            <select
              className="portal-select min-w-0"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="">Select course</option>
              {(courses.data?.data || []).map((course) => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </LabeledField>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => download("csv")} disabled={!courseId}>Export CSV</Button>
            <Button variant="secondary" onClick={() => download("pdf")} disabled={!courseId}>Export PDF</Button>
          </div>
        </div>
      </PageControlCard>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>System reports</CardTitle>
          <CardDescription>Top-level metrics returned by the reporting service.</CardDescription>
        </CardHeader>
        <CardContent>
          <SummaryGrid data={(system.data?.data as Record<string, unknown>) || {}} />
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportSection title="Course attendance report" data={attendance.data?.data || {}} />
        <ReportSection title="Course academic report" data={academic.data?.data || {}} />
        <ReportSection title="Enrollment report" data={enrollments.data?.data || {}} />
        <ReportSection title="Assignment report" data={assignmentReport.data?.data || {}} />
        <ReportSection title="Assessment report" data={assessmentReport.data?.data || {}} />
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  const [form, setForm] = useState({ key: "", value: "", description: "" });
  const saveSetting = useMutation({
    mutationFn: () => adminApi.saveSetting(form),
    onSuccess: () => {
      toast.success("Setting saved");
      setForm({ key: "", value: "", description: "" });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Operational policy"
        title="Settings"
        description="Manage system settings used by the platform."
      />
      <PageControlCard>
        <Alert>
          Use stable key names (e.g. `attendance.strict_mode`, `policy.terms_url`, `semester.active`) so downstream services can resolve configuration safely.
        </Alert>
      </PageControlCard>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Settings editor</CardTitle>
            <CardDescription>
              Save one setting at a time using a simple key and value format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LabeledField label="Key">
              <Input value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} />
            </LabeledField>
            <LabeledField label="Value">
              <Textarea value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
            </LabeledField>
            <LabeledField label="Description">
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </LabeledField>
            <Button
              onClick={() => saveSetting.mutate()}
              disabled={!form.key || !form.value || saveSetting.isPending}
            >
              Save settings
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configuration guidelines</CardTitle>
            <CardDescription>Recommended structure for maintainable administrative settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="panel-muted">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Naming</p>
              <p className="mt-2 text-sm text-slate-700">Use dot-separated namespaces like `attendance.*`, `policy.*`, and `semester.*`.</p>
            </div>
            <div className="panel-muted">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Value strategy</p>
              <p className="mt-2 text-sm text-slate-700">Store booleans as `true/false`, numeric limits as plain numbers, and URLs as full absolute links.</p>
            </div>
            <div className="panel-muted">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Audit readiness</p>
              <p className="mt-2 text-sm text-slate-700">Write concise descriptions so policy changes remain understandable during future compliance reviews.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
