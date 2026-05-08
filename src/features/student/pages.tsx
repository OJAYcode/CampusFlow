/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable simple-import-sort/imports */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Camera, ExternalLink, GraduationCap, LoaderCircle, Mic, PlayCircle, ShieldCheck, TimerReset, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { communicationApi } from "@/src/api/communication";
import { sharedApi } from "@/src/api/shared";
import { studentApi } from "@/src/api/student";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRobustUserLocation } from "@/lib/geolocation";
import { requestPushNotifications } from "@/src/lib/push-notifications";
import { getStoredSession } from "@/src/utils/session-storage";
import { apiClient } from "@/src/api/client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Alert } from "@/src/components/ui/alert";
import { Badge } from "@/src/components/ui/badge";
import { Breadcrumb } from "@/src/components/ui/breadcrumb";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { DataTable } from "@/src/components/ui/data-table";
import { EmptyState } from "@/src/components/ui/empty-state";
import { FileUploader } from "@/src/components/ui/file-uploader";
import { FileLauncher } from "@/src/components/ui/file-launcher";
import { Input } from "@/src/components/ui/input";
import { Pagination } from "@/src/components/ui/pagination";
import { DetailHero, PageControlCard, PageIntro } from "@/src/components/ui/page-intro";
import { StatCard } from "@/src/components/ui/stat-card";
import { Textarea } from "@/src/components/ui/textarea";
import type { AssessmentQuestion, OnlineMaterialResult } from "@/src/types/domain";
import { formatDuration } from "@/src/utils/assessment";
import { formatDate, formatNumber } from "@/src/utils/format";
import { getErrorMessage } from "@/src/utils/error";
import { getBrowserFingerprint } from "@/src/utils/fingerprint";
import { useAuthStore } from "@/src/store/auth-store";

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

export function StudentDashboardPage() {
  const isMobile = useIsMobile();
  const profile = useQuery({ queryKey: ["student", "profile"], queryFn: studentApi.profile });
  const enrollments = useQuery({ queryKey: ["student", "enrollments"], queryFn: studentApi.enrollments });
  const electives = useQuery({ queryKey: ["student", "electives"], queryFn: studentApi.electives });
  const announcements = useQuery({ queryKey: ["student", "announcements"], queryFn: studentApi.announcements });
  const assignments = useQuery({ queryKey: ["student", "assignments"], queryFn: studentApi.assignments });
  const assessments = useQuery({ queryKey: ["student", "assessments"], queryFn: studentApi.assessments });
  const attendance = useQuery({ queryKey: ["student", "active-sessions"], queryFn: studentApi.activeSessions });
  const student = profile.data?.data;
  const firstName = student?.fullName?.split(" ")[0] || "student";
  const departmentName =
    typeof student?.department === "object" ? student.department?.name : student?.department || "Department pending";
  const activeAttendanceCount = attendance.data?.data.length || 0;

  return (
    <div className="space-y-6">
      {!isMobile && (
        <Card className="hidden md:block">
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="heading-kicker">Student dashboard</p>
            <CardTitle className="mt-2">Welcome back, {firstName}</CardTitle>
            <CardDescription>
              Check attendance, coursework, and recent class updates from this workspace.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="text-white hover:text-white focus-visible:text-white">
              <Link href="/student/attendance" className="!text-white" style={{ color: "#ffffff" }}>
                Submit attendance
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/student/assignments">View assignments</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="panel-soft">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#838a9b]">Student ID</p>
            <p className="mt-2 text-lg font-bold text-[#202c4b]">{student?.matricNumber || "--"}</p>
            <p className="text-sm text-[#515b73]">{departmentName}</p>
          </div>
          <div className="panel-soft">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#838a9b]">Today&apos;s activity</p>
            <p className="mt-2 text-sm leading-6 text-[#515b73]">
              {activeAttendanceCount
                ? `${activeAttendanceCount} attendance session${activeAttendanceCount > 1 ? "s are" : " is"} open right now.`
                : "No attendance sessions are open right now."}
            </p>
          </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={GraduationCap} title="Enrolled courses" value={enrollments.data?.data.length || 0} tone="danger" />
        <StatCard icon={TimerReset} title="Elective requests" value={electives.data?.data.length || 0} tone="info" />
        <StatCard icon={BookOpen} title="Assignments" value={assignments.data?.data.length || 0} tone="warning" />
        <StatCard icon={PlayCircle} title="Attendance sessions" value={attendance.data?.data.length || 0} tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {!isMobile && (
          <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Academic snapshot</CardTitle>
            <CardDescription>Your record and quick actions for the day.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="panel-muted">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#838a9b]">Student</p>
              <p className="mt-2 text-lg font-bold text-[#202c4b]">{profile.data?.data.fullName || "--"}</p>
              <p className="text-sm text-[#515b73]">{profile.data?.data.matricNumber || "--"}</p>
            </div>
            <div className="panel-gold">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#838a9b]">Quick actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" className="text-white hover:text-white focus-visible:text-white">
                  <Link href="/student/attendance" className="!text-white" style={{ color: "#ffffff" }}>
                    Submit attendance
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/student/assessments">Open assessments</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Current activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendance.data?.data.slice(0, 2).map((session) => (
              <div key={session._id} className="panel-soft">
                <p className="font-medium text-[#202c4b]">{session.course?.title}</p>
                <p className="text-sm text-[#515b73]">Session code {session.sessionCode}</p>
              </div>
            ))}
            {!attendance.data?.data.length ? (
              <EmptyState
                title="No active attendance"
                description="There are no open attendance sessions at the moment."
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ListingCard
          title="Recent announcements"
          items={announcements.data?.data || []}
          renderItem={(item) => (
            <>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-500">{item.course?.title}</p>
            </>
          )}
        />
        <ListingCard
          title="Published assessments"
          items={assessments.data?.data || []}
          renderItem={(item) => (
            <>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-500">{item.course?.title}</p>
            </>
          )}
        />
      </div>
    </div>
  );
}

export function StudentProfilePage() {
  const queryClient = useQueryClient();
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const profile = useQuery({ queryKey: ["student", "profile"], queryFn: studentApi.profile });
  const user = profile.data?.data;
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () => studentApi.updateProfile(form),
    onSuccess: async () => {
      toast.success("Profile updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
        refreshSession(),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const hasChanges =
    form.fullName !== (user?.fullName || "") ||
    form.email !== (user?.email || "") ||
    form.phone !== (user?.phone || "");

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Student profile"
        title="Profile"
        description="View your registered academic and contact details."
      />
      <Card>
        <CardHeader>
          <Breadcrumb items={[{ label: "Student", href: "/student" }, { label: "Profile", current: true }]} />
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal contact details while keeping academic records unchanged.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Full name">
              <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </LabeledField>
            <LabeledField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </LabeledField>
            <LabeledField label="Phone">
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </LabeledField>
            <div className="flex items-end">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => updateProfile.mutate()}
                  disabled={!hasChanges || updateProfile.isPending || !form.fullName.trim() || !form.email.trim()}
                >
                  {updateProfile.isPending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setForm({
                      fullName: user?.fullName || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                    })
                  }
                  disabled={!hasChanges || updateProfile.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
          <Alert variant="info">Matric number, faculty, department, level, and status are managed by the institution and cannot be edited here.</Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Matric number", user?.matricNumber],
              ["Faculty", typeof user?.faculty === "object" ? user.faculty?.name : user?.faculty],
              ["Department", typeof user?.department === "object" ? user.department?.name : user?.department],
              ["Level", user?.level],
              ["Status", user?.status],
            ].map(([label, value]) => (
              <div key={label} className="panel-soft">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-medium text-slate-900">{value || "--"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StudentEnrollmentsPage() {
  const { data } = useQuery({ queryKey: ["student", "enrollments"], queryFn: studentApi.enrollments });
  const enrollments = data?.data || [];
  const approved = enrollments.filter((item) => item.approvalStatus === "approved").length;
  const pending = enrollments.filter((item) => item.approvalStatus === "pending").length;
  const electives = enrollments.filter((item) => item.course?.courseType === "elective").length;

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Enrollments"
        title="Course registrations"
        description="Review your registered courses and approval status for the current session."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={GraduationCap} title="Total enrollments" value={enrollments.length} />
        <StatCard icon={BookOpen} title="Approved courses" value={approved} />
        <StatCard
          icon={TimerReset}
          title="Pending review"
          value={pending}
          helper={`${electives} elective${electives === 1 ? "" : "s"}`}
        />
      </div>
      <DataTable
        data={enrollments}
        columns={[
          { key: "course", header: "Course", render: (item) => <span className="font-medium">{item.course.title}</span> },
          { key: "code", header: "Code", render: (item) => item.course.code },
          { key: "type", header: "Type", render: (item) => <Badge tone={item.course.courseType === "core" ? "info" : "warning"}>{item.course.courseType || "--"}</Badge> },
          { key: "status", header: "Approval", render: (item) => <Badge tone={item.approvalStatus === "approved" ? "success" : item.approvalStatus === "rejected" ? "danger" : "warning"}>{item.approvalStatus}</Badge> },
          { key: "semester", header: "Semester", render: (item) => item.course.semester || "--" },
        ]}
        emptyTitle="No enrollments yet"
        emptyDescription="Approved core and elective courses will appear here."
      />
    </div>
  );
}

export function StudentElectivesPage() {
  const queryClient = useQueryClient();
  const electives = useQuery({ queryKey: ["student", "electives"], queryFn: studentApi.electives });
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCourse = (courseId: string) => {
    setSelected((current) =>
      current.includes(courseId)
        ? current.filter((item) => item !== courseId)
        : [...current, courseId],
    );
  };

  const submit = async () => {
    if (!selected.length) return;
    try {
      await studentApi.selectElectives(selected);
      toast.success("Elective requests submitted");
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["student", "electives"] });
      queryClient.invalidateQueries({ queryKey: ["student", "enrollments"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit elective requests");
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Electives"
        title="Elective selection"
        description="Choose from the electives available to your department and level."
      />
      <PageControlCard>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <Alert>
            You can only request electives that match your current department and level.
          </Alert>
          <Button onClick={submit} disabled={!selected.length}>
            Submit elective requests
          </Button>
        </div>
      </PageControlCard>
      <div className="grid gap-4">
        {(electives.data?.data || []).map((course: any) => (
          <label key={course._id} className="interactive-panel flex items-start gap-4">
            <input
              checked={selected.includes(course._id)}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
              onChange={() => toggleCourse(course._id)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[#202c4b]">{course.title}</p>
                <Badge tone="info">{course.courseType || "elective"}</Badge>
              </div>
              <p className="mt-1 text-sm text-[#838a9b]">
                {course.code} • {course.semester} semester
              </p>
              {course.description ? (
                <p className="mt-2 text-sm leading-6 text-[#515b73]">{course.description}</p>
              ) : null}
            </div>
          </label>
        ))}
        {!electives.data?.data.length ? (
          <EmptyState
            title="No eligible electives"
            description="No elective options are available for your current record."
          />
        ) : null}
      </div>
    </div>
  );
}

function OnlineMaterialCard({ item }: { item: OnlineMaterialResult }) {
  return (
    <Card className="h-full border-[var(--border)] bg-white shadow-[0_12px_28px_rgba(15,37,71,0.05)]">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex min-h-[56px] items-center justify-between gap-3 pt-2">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#eef3ff] p-1 text-[#255ac8]">
            <span className="flex h-full w-full items-center justify-center pt-1">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <Badge tone="info" className="shrink-0">
            {item.source}
          </Badge>
        </div>
        <div className="flex min-h-[120px] flex-col justify-start gap-3">
          <h3 className="min-h-[3rem] text-base font-semibold leading-6 text-[#202c4b]">{item.title}</h3>
          <p className="text-sm leading-6 text-[#667085]">
            {item.authors.length ? item.authors.join(", ") : "Author information is not available for this reference."}
          </p>
          <div className="space-y-1.5 text-sm leading-6 text-[#667085]">
            {item.year ? <p>First published in {item.year}.</p> : null}
            <p>{item.availabilityLabel}</p>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-[rgba(0,27,58,0.08)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b95a7]">Public reference</span>
          <Button asChild size="sm" variant="secondary" className="w-full gap-2 sm:w-auto">
            <a href={item.sourceUrl} target="_blank" rel="noreferrer noopener">
              Open source
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentMaterialsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const normalizedSearch = search.trim().toLowerCase();
  const { data } = useQuery({ queryKey: ["student", "materials"], queryFn: studentApi.materials });
  const materials = useMemo(() => data?.data || [], [data?.data]);
  const filtered = useMemo(
    () =>
      materials.filter((item) =>
        `${item.title} ${item.course?.title || ""}`.toLowerCase().includes(normalizedSearch),
      ),
    [materials, normalizedSearch],
  );
  const shouldSearchOnline = deferredSearch.length >= 2;
  const onlineResultsQuery = useQuery({
    queryKey: ["student", "materials", "online", deferredSearch],
    queryFn: () => studentApi.searchOnlineMaterials(deferredSearch),
    enabled: shouldSearchOnline,
    staleTime: 1000 * 60 * 10,
  });
  const onlineResults = onlineResultsQuery.data?.data || [];

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Course materials"
        title="Learning resources"
        description="Browse your course files and search public references by title."
      />
      <div className="pt-1">
        <Input
          className="sm:h-10"
          placeholder="Search course files or a public title"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="heading-kicker text-[#255ac8]">Registered courses</p>
            <h3 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-[#202c4b]">Your course materials</h3>
            <p className="text-sm leading-6 text-[#667085]">Files from your approved courses only.</p>
          </div>
          <Badge tone="neutral">{filtered.length} visible</Badge>
        </div>
        <DataTable
          data={filtered}
          emptyTitle="No course materials found"
          emptyDescription={
            normalizedSearch
              ? `No registered-course materials match "${deferredSearch}".`
              : "Materials uploaded for your approved course registrations will appear here."
          }
          columns={[
            { key: "title", header: "Title", render: (item) => <span className="font-medium text-[#202c4b]">{item.title}</span> },
            { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
            {
              key: "file",
              header: "File",
              render: (item) => (
                <FileLauncher fileUrl={item.fileUrl} fileName={item.fileName || item.title} triggerLabel="Open material" />
              ),
            },
            { key: "date", header: "Uploaded", render: (item) => formatDate(item.createdAt, true) },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="heading-kicker text-[#255ac8]">Online references</p>
            <h3 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-[#202c4b]">Related public resources</h3>
            <p className="text-sm leading-6 text-[#667085]">Search titles for public books and references.</p>
          </div>
          {shouldSearchOnline ? <Badge tone="info">{onlineResults.length} result{onlineResults.length === 1 ? "" : "s"}</Badge> : null}
        </div>

        {!shouldSearchOnline ? (
          <EmptyState
            title="Search online by title"
            description="Type at least two characters above to search public references."
          />
        ) : onlineResultsQuery.isPending ? (
          <PageControlCard>
            <div className="flex items-center gap-3 text-sm text-[#667085]">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#255ac8]" />
              <span>
                Searching public references for &ldquo;{deferredSearch}&rdquo;...
              </span>
            </div>
          </PageControlCard>
        ) : onlineResultsQuery.isError ? (
          <Alert variant="warning">Online reference search is unavailable right now. Your course materials are still available above.</Alert>
        ) : !onlineResults.length ? (
          <EmptyState
            title="No online references found"
            description={`No public matches for "${deferredSearch}". Try a shorter title.`}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {onlineResults.map((item) => (
              <OnlineMaterialCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentAssignmentsPage() {
  const { data } = useQuery({
    queryKey: ["student", "assignments"],
    queryFn: studentApi.assignments,
    refetchInterval: 10000,
  });
  const assignments = data?.data || [];
  const overdueCount = assignments.filter((item) => new Date(item.dueDate) < new Date()).length;
  const gradedCount = assignments.filter((item) => item.submission?.status === "graded").length;

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Assignments"
        title="Coursework and deadlines"
        description="Review assignment deadlines, status, and submission details."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={BookOpen} title="All assignments" value={assignments.length} />
        <StatCard icon={TimerReset} title="Overdue" value={overdueCount} />
        <StatCard icon={PlayCircle} title="Graded" value={gradedCount} />
      </div>
      <DataTable
        data={assignments}
        columns={[
          { key: "title", header: "Assignment", render: (item) => <span className="font-medium text-[#202c4b]">{item.title}</span> },
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "due", header: "Due date", render: (item) => formatDate(item.dueDate, true) },
          {
            key: "status",
            header: "Status",
            render: (item) => {
              if (item.submission?.status === "graded") {
                return <Badge tone="success">Graded</Badge>;
              }

              if (item.submission?.status === "submitted" || item.submission?.status === "late") {
                return <Badge tone="info">{item.submission.status === "late" ? "Submitted late" : "Submitted"}</Badge>;
              }

              return <Badge tone={new Date(item.dueDate) < new Date() ? "warning" : "info"}>{new Date(item.dueDate) < new Date() ? "Due passed" : item.status || "Open"}</Badge>;
            },
          },
          {
            key: "result",
            header: "Result",
            render: (item) =>
              item.submission?.status === "graded" ? (
                <span className="text-sm font-medium text-slate-900">
                  {item.submission.grade ?? "--"} / {item.totalMarks ?? 100}
                </span>
              ) : (
                <span className="text-sm text-slate-500">Pending</span>
              ),
          },
          {
            key: "action",
            header: "Action",
            render: (item) => (
              <Button asChild size="sm" variant="secondary" className="gap-2">
                <Link href={`/student/assignments/${item._id}`}>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Open assignment
                </Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}

export function StudentAssignmentDetailPage({ assignmentId }: { assignmentId: string }) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [files, setFiles] = useState<File[]>([]);
  const [submissionText, setSubmissionText] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const assignment = useQuery({ queryKey: ["assignment", assignmentId], queryFn: () => sharedApi.assignment(assignmentId) });
  const submissions = useQuery({ queryKey: ["assignment-submissions", assignmentId], queryFn: () => sharedApi.assignmentSubmissions(assignmentId) });
  const latestSubmission = submissions.data?.data?.[0];

  const submit = async () => {
    const formData = new FormData();
    formData.append("submissionText", submissionText);
    files.forEach((file) => formData.append("files", file));
    await sharedApi.submitAssignment(assignmentId, formData);
    await submissions.refetch();
    await queryClient.invalidateQueries({ queryKey: ["student", "assignments"] });
    setSubmissionText("");
    setFiles([]);
    setSuccessOpen(true);
  };

  return (
    <div className="space-y-6">
      <DetailHero
        title={assignment.data?.data.title || "Assignment detail"}
        subtitle={assignment.data?.data.description || "Review the instructions, due date, and your submission for this assignment."}
        badges={<Badge tone="info">{assignment.data?.data.course?.title || "Course"}</Badge>}
        meta={
          <div className="panel-dark">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-200">Due date</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatDate(assignment.data?.data.dueDate, true)}</p>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {!isMobile && (
          <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{assignment.data?.data.title || "Assignment detail"}</CardTitle>
          <CardDescription>{assignment.data?.data.course?.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">{assignment.data?.data.description || "No description provided."}</p>
          <Alert variant="info">Due {formatDate(assignment.data?.data.dueDate, true)}</Alert>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Submit work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestSubmission?.status === "graded" ? (
            <Alert variant="success">
              Graded: {latestSubmission.grade ?? "--"} / {assignment.data?.data.totalMarks ?? 100}
              {latestSubmission.feedback ? ` • ${latestSubmission.feedback}` : ""}
            </Alert>
          ) : null}
          <Textarea placeholder="Write your submission text" value={submissionText} onChange={(event) => setSubmissionText(event.target.value)} />
          <FileUploader files={files} onFilesChange={setFiles} />
          <Button onClick={submit}>Submit assignment</Button>
          {(submissions.data?.data || []).length ? (
            <div className="space-y-3 border-t border-[rgba(0,27,58,0.08)] pt-4">
              <p className="text-sm font-medium text-slate-800">Submission history</p>
              {(submissions.data?.data || []).map((item) => (
                <div key={item._id} className="panel-soft p-3">
                  <p className="text-sm text-slate-700">Status: {item.status || "submitted"}</p>
                  <p className="text-sm text-slate-700">Grade: {item.grade ?? "--"}</p>
                  <p className="text-sm text-slate-700">Feedback: {item.feedback || "--"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      </div>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Assignment submitted</DialogTitle>
            <DialogDescription>
              Your work has been recorded successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              You can stay on this page to review your submission history or return to the assignments list.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setSuccessOpen(false)}>
                Stay here
              </Button>
              <Button asChild onClick={() => setSuccessOpen(false)}>
                <Link href="/student/assignments">Back to assignments</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StudentAssessmentsPage() {
  const { data } = useQuery({
    queryKey: ["student", "assessments"],
    queryFn: studentApi.assessments,
    refetchInterval: 10000,
  });
  const assessments = data?.data || [];
  const activeCount = assessments.filter((item) => !item.availableTo || new Date(item.availableTo) >= new Date()).length;
  const availableNowCount = assessments.filter((item) => {
    const now = new Date();
    const startsOk = !item.availableFrom || new Date(item.availableFrom) <= now;
    const endsOk = !item.availableTo || new Date(item.availableTo) >= now;
    return startsOk && endsOk;
  }).length;

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Assessments"
        title="Assessments"
        description="Start an available assessment, answer the questions, and submit inside the allowed time window."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={PlayCircle} title="Published assessments" value={assessments.length} />
        <StatCard icon={TimerReset} title="Available now" value={availableNowCount} />
        <StatCard icon={BookOpen} title="Closed or unavailable" value={Math.max(assessments.length - availableNowCount, 0)} />
      </div>
      <DataTable
        data={assessments}
        columns={[
          { key: "title", header: "Assessment", render: (item) => <span className="font-medium text-[#202c4b]">{item.title}</span> },
          { key: "type", header: "Type", render: (item) => <Badge>{item.assessmentType}</Badge> },
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "window", header: "Availability", render: (item) => `${formatDate(item.availableFrom, true)} - ${formatDate(item.availableTo, true)}` },
          {
            key: "status",
            header: "Status",
            render: (item) => {
              const now = new Date();
              const notStarted = item.availableFrom && new Date(item.availableFrom) > now;
              const expired = item.availableTo && new Date(item.availableTo) < now;

              if (expired) return <Badge tone="warning">Closed</Badge>;
              if (notStarted) return <Badge tone="info">Upcoming</Badge>;
              return <Badge tone="success">Available now</Badge>;
            },
          },
          {
            key: "action",
            header: "Action",
            render: (item) => {
              const now = new Date();
              const notStarted = item.availableFrom && new Date(item.availableFrom) > now;
              const expired = item.availableTo && new Date(item.availableTo) < now;

              return (
                <Button asChild size="sm" variant="secondary" className="gap-2">
                  <Link href={`/student/assessments/${item._id}`}>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    {expired ? "View only" : notStarted ? "Preview" : "Take assessment"}
                  </Link>
                </Button>
              );
            },
          },
        ]}
      />
    </div>
  );
}

export function StudentAssessmentDetailPage({ assessmentId }: { assessmentId: string }) {
  const queryClient = useQueryClient();
  const details = useQuery({ queryKey: ["assessment", assessmentId], queryFn: () => sharedApi.assessment(assessmentId) });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [remainingTimeMsSnapshot, setRemainingTimeMsSnapshot] = useState<number | null>(null);
  const [remainingTimeAnchorMs, setRemainingTimeAnchorMs] = useState<number | null>(null);
  const [attemptLocked, setAttemptLocked] = useState(false);
  const [penaltyLockUntil, setPenaltyLockUntil] = useState<string | null>(null);
  const [penaltyRemainingSeconds, setPenaltyRemainingSeconds] = useState<number | null>(null);
  const [penaltyCount, setPenaltyCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [syncingProctoring, setSyncingProctoring] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const assessment = details.data?.data.assessment;
  const questions = details.data?.data.questions || [];
  const currentAttempt = details.data?.data.attempt;
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter((question: AssessmentQuestion) => Boolean(answers[question._id])).length;
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const availabilityNotStarted =
    assessment?.availableFrom && new Date(assessment.availableFrom) > new Date();
  const availabilityExpired =
    assessment?.availableTo && new Date(assessment.availableTo) < new Date();
  const canShowQuestions = started || Boolean(currentAttempt);
  const isSubmitted = currentAttempt?.status === "submitted" || currentAttempt?.status === "graded";
  const penaltyDurationMs = assessment?.durationMinutes
    ? Math.max(60_000, Math.floor((assessment.durationMinutes * 60_000) / 2))
    : 0;
  const isPenaltyActive = Boolean(
    penaltyLockUntil && new Date(penaltyLockUntil).getTime() > Date.now(),
  );
  const interactionLocked = attemptLocked || isPenaltyActive;

  useEffect(() => {
    if (currentAttempt?.status === "in_progress") {
      setStarted(true);
      setAttemptLocked(false);
    } else if (currentAttempt?.status === "submitted" || currentAttempt?.status === "graded") {
      setStarted(true);
      setAttemptLocked(true);
    }

    setTabSwitchCount(currentAttempt?.proctoring?.tabSwitchCount || 0);
    setWindowBlurCount(currentAttempt?.proctoring?.windowBlurCount || 0);
    setMicLevel(currentAttempt?.proctoring?.micLevel || 0);
    setPenaltyLockUntil(currentAttempt?.proctoring?.penaltyLockUntil || null);
    setPenaltyCount(currentAttempt?.proctoring?.penaltyCount || 0);
    setRemainingTimeMsSnapshot(
      typeof currentAttempt?.remainingTimeMs === "number"
        ? currentAttempt.remainingTimeMs
        : assessment?.durationMinutes
          ? assessment.durationMinutes * 60_000
          : null,
    );
    setRemainingTimeAnchorMs(Date.now());
  }, [currentAttempt]);

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    if (!cameraStream) return;

    const audioTracks = cameraStream.getAudioTracks();
    if (!audioTracks.length) return;

    const audioContext = new window.AudioContext();
    const source = audioContext.createMediaStreamSource(cameraStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    audioContextRef.current = audioContext;
    sourceRef.current = source;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    return () => {
      source.disconnect();
      analyser.disconnect();
      audioContext.close().catch(() => {});
      audioContextRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  useEffect(() => {
    if (!isSubmitted) return;
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  }, [cameraStream, isSubmitted]);

  useEffect(() => {
    if (!started || remainingTimeMsSnapshot === null || remainingTimeAnchorMs === null) return;

    const updateCountdown = () => {
      const nowMs = Date.now();
      const lockUntilMs = penaltyLockUntil ? new Date(penaltyLockUntil).getTime() : null;

      if (lockUntilMs && lockUntilMs > nowMs) {
        setPenaltyRemainingSeconds(Math.ceil((lockUntilMs - nowMs) / 1000));
        setRemainingSeconds(Math.ceil(remainingTimeMsSnapshot / 1000));
        return;
      }

      const activeAnchorMs = lockUntilMs
        ? Math.max(remainingTimeAnchorMs, lockUntilMs)
        : remainingTimeAnchorMs;
      const nextRemainingMs = Math.max(0, remainingTimeMsSnapshot - Math.max(0, nowMs - activeAnchorMs));

      setPenaltyRemainingSeconds(null);
      setRemainingSeconds(Math.ceil(nextRemainingMs / 1000));

      if (nextRemainingMs <= 0) {
        setAttemptLocked(true);
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [penaltyLockUntil, remainingTimeAnchorMs, remainingTimeMsSnapshot, started]);

  const applyAttemptRuntime = (attempt?: any | null) => {
    if (!attempt) return;

    setPenaltyLockUntil(attempt.proctoring?.penaltyLockUntil || null);
    setPenaltyCount(attempt.proctoring?.penaltyCount || 0);
    setTabSwitchCount(attempt.proctoring?.tabSwitchCount || 0);
    setWindowBlurCount(attempt.proctoring?.windowBlurCount || 0);
    setMicLevel(attempt.proctoring?.micLevel || 0);

    if (typeof attempt.remainingTimeMs === "number") {
      setRemainingTimeMsSnapshot(attempt.remainingTimeMs);
      setRemainingTimeAnchorMs(Date.now());
    }

    if (attempt.status === "submitted" || attempt.status === "graded") {
      setAttemptLocked(true);
    }
  };

  const previewPenaltyLock = () => {
    if (!penaltyDurationMs) return;

    const nowMs = Date.now();
    const currentLockMs = penaltyLockUntil ? new Date(penaltyLockUntil).getTime() : 0;
    const baseLockMs = currentLockMs > nowMs ? currentLockMs : nowMs;

    setPenaltyLockUntil(new Date(baseLockMs + penaltyDurationMs).toISOString());
    setPenaltyCount((current) => current + 1);
    setRemainingTimeAnchorMs((current) => current ?? nowMs);
    setRemainingTimeMsSnapshot((current) =>
      current ?? (assessment?.durationMinutes ? assessment.durationMinutes * 60_000 : null),
    );
  };

  const ensureMediaReady = async () => {
    if (cameraStream) {
      setMediaReady(true);
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setCameraStream(stream);
      setMediaReady(true);
      setMediaError("");
      return true;
    } catch (error) {
      setMediaReady(false);
      setMediaError("Camera and microphone access are required to start this assessment.");
      toast.error(getErrorMessage(error) || "Camera and microphone access are required.");
      return false;
    }
  };

  const readMicLevel = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return 0;

    analyser.getByteTimeDomainData(dataArray);
    let total = 0;

    for (let index = 0; index < dataArray.length; index += 1) {
      const centered = (dataArray[index] - 128) / 128;
      total += centered * centered;
    }

    return Math.min(1, Math.sqrt(total / dataArray.length) * 3);
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return undefined;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) return undefined;

    const width = 320;
    const height = Math.max(180, Math.round((video.videoHeight / video.videoWidth) * width));
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    context.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.55);
  };

  const syncProctoring = async (overrides?: {
    tabSwitchCount?: number;
    windowBlurCount?: number;
    lastVisibilityChangeAt?: string;
  }) => {
    if (!started || isSubmitted || !cameraStream) return;

    const payload = {
      cameraGranted: cameraStream.getVideoTracks().some((track) => track.readyState === "live"),
      microphoneGranted: cameraStream.getAudioTracks().some((track) => track.readyState === "live"),
      tabSwitchCount: overrides?.tabSwitchCount ?? tabSwitchCount,
      windowBlurCount: overrides?.windowBlurCount ?? windowBlurCount,
      lastVisibilityChangeAt: overrides?.lastVisibilityChangeAt,
      latestSnapshotDataUrl: captureSnapshot(),
      micLevel: readMicLevel(),
    };

    setMicLevel(payload.micLevel);
    setSyncingProctoring(true);

    try {
      const response = await sharedApi.updateAssessmentProctoring(assessmentId, payload);
      applyAttemptRuntime(response.data);
    } catch {
      // Keep the test usable even if background proctor sync fails momentarily.
    } finally {
      setSyncingProctoring(false);
    }
  };

  const submit = async () => {
    try {
      const response = await sharedApi.submitAssessment(assessmentId, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      });
      applyAttemptRuntime(response.data);
      setAttemptLocked(true);
      await queryClient.invalidateQueries({ queryKey: ["student", "assessment-attempts"] });
      await queryClient.invalidateQueries({ queryKey: ["student", "assessments"] });
      await details.refetch();
      toast.success("Assessment submitted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const start = async () => {
    try {
      const mediaGranted = await ensureMediaReady();
      if (!mediaGranted) return;

      const response = await sharedApi.startAssessment(assessmentId, {
        cameraGranted: true,
        microphoneGranted: true,
      });
      applyAttemptRuntime(response.data);
      await details.refetch();
      setStarted(true);
      setAttemptLocked(false);
      toast.success("Assessment attempt started");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (!started || isSubmitted) return undefined;

    const interval = window.setInterval(() => {
      void syncProctoring();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [assessmentId, cameraStream, isSubmitted, started, tabSwitchCount, windowBlurCount]);

  useEffect(() => {
    if (!started || isSubmitted) return undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncProctoring({
          tabSwitchCount,
          lastVisibilityChangeAt: new Date().toISOString(),
        });
        void details.refetch();
        return;
      }

      const nextCount = tabSwitchCount + 1;
      setTabSwitchCount(nextCount);
      previewPenaltyLock();
      toast.warning("You left the test tab. The assessment is now locked for half of the quiz time.");
      void syncProctoring({
        tabSwitchCount: nextCount,
        lastVisibilityChangeAt: new Date().toISOString(),
      });
    };

    const handleWindowBlur = () => {
      const nextCount = windowBlurCount + 1;
      setWindowBlurCount(nextCount);
      void syncProctoring({
        windowBlurCount: nextCount,
        lastVisibilityChangeAt: new Date().toISOString(),
      });
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [details.refetch, isSubmitted, penaltyDurationMs, started, tabSwitchCount, windowBlurCount]);

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Submission completed</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                    {assessment?.title || "Assessment"} submitted
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    Your answers have been recorded. You can return to the assessments list or open your attempt history.
                  </p>
                </div>
              </div>
              <div className="inline-flex w-fit items-center rounded-full border border-[#d7def8] bg-[#f2f5ff] px-3 py-1 text-xs font-semibold text-[#3d5ee1]">
                {currentAttempt?.status === "graded" ? "Graded" : "Submitted"}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="panel-soft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Submitted</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatDate(currentAttempt?.submittedAt, true)}
                </p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Score</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {currentAttempt?.score ?? "Awaiting score"}
                </p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Assessment type</p>
                <p className="mt-2 text-sm font-medium capitalize text-slate-900">
                  {assessment?.assessmentType || "Assessment"}
                </p>
              </div>
            </div>

            <Alert variant={currentAttempt?.status === "graded" ? "success" : "info"}>
              {currentAttempt?.status === "graded"
                ? "Your attempt has been graded. Open your attempt history to review the result."
                : "Your lecturer can now review this submitted attempt from the assessment workspace."}
            </Alert>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/student/assessments/attempts"
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition duration-200 hover:bg-[#1f4fb7]"
              >
                Open attempt history
              </Link>
              <Link
                href="/student/assessments"
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--secondary-foreground)] transition duration-200 hover:border-[#cddbf8] hover:bg-[#eef4ff] hover:text-[#1f4fb7]"
              >
                Back to assessments
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{details.data?.data.assessment.title || "Assessment"}</CardTitle>
          <CardDescription>
            {details.data?.data.assessment.course?.title} • {details.data?.data.assessment.assessmentType}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            Duration {details.data?.data.assessment.durationMinutes || 0} minutes. You must enable both camera and microphone before you can begin.
          </Alert>
          {remainingSeconds !== null ? (
            <Alert variant={remainingSeconds < 120 ? "warning" : "info"}>
              Time remaining: {formatDuration(remainingSeconds)}
            </Alert>
          ) : null}
          {penaltyRemainingSeconds !== null ? (
            <Alert variant="danger">
              Test locked for tab switching. You can continue in {formatDuration(penaltyRemainingSeconds)} with your remaining quiz time unchanged.
            </Alert>
          ) : null}
          {availabilityNotStarted ? (
            <Alert variant="warning">This assessment is not yet available.</Alert>
          ) : null}
          {availabilityExpired ? (
            <Alert variant="danger">This assessment availability window has closed.</Alert>
          ) : null}
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-[18px] border border-[var(--border)] bg-[#fbfcfe] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">Assessment monitoring</p>
                  <p className="text-sm text-slate-600">Turn on your camera and microphone before starting.</p>
                </div>
                <Badge tone={mediaReady ? "success" : "warning"}>{mediaReady ? "Ready" : "Required"}</Badge>
              </div>
              <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-slate-950">
                <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="panel-soft p-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm font-medium">Camera</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{mediaReady ? "Connected" : "Not enabled yet"}</p>
                </div>
                <div className="panel-soft p-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Mic className="h-4 w-4" />
                    <span className="text-sm font-medium">Microphone</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{mediaReady ? `Activity ${Math.round(micLevel * 100)}%` : "Not enabled yet"}</p>
                </div>
              </div>
              {mediaError ? <Alert variant="danger">{mediaError}</Alert> : null}
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => void ensureMediaReady()}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Enable camera and microphone
                </Button>
                {syncingProctoring ? <Badge tone="info">Syncing proctoring</Badge> : null}
              </div>
            </div>

            <div className="space-y-4 rounded-[18px] border border-[var(--border)] bg-white p-4">
              <p className="font-medium text-slate-900">Monitoring status</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="panel-soft p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Tab switches</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{tabSwitchCount}</p>
                </div>
                <div className="panel-soft p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Window blurs</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{windowBlurCount}</p>
                </div>
                <div className="panel-soft p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Penalty locks</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{penaltyCount}</p>
                </div>
              </div>
              {!started && !availabilityNotStarted && !availabilityExpired ? (
                <Alert variant="success">
                  This assessment is ready. Click <strong>Start attempt</strong> only after camera and microphone access is enabled.
                </Alert>
              ) : null}
              {isPenaltyActive ? (
                <Alert variant="danger">
                  <TriangleAlert className="mr-2 h-4 w-4" />
                  Assessment locked after leaving the test tab. Wait for the lock to finish, then continue with the same remaining time.
                </Alert>
              ) : null}
              {started ? (
                <Alert variant="warning">
                  <TriangleAlert className="mr-2 h-4 w-4" />
                  Leaving the test tab triggers a lock for half of the assessment duration.
                </Alert>
              ) : null}
            </div>
          </div>
          {!isSubmitted && canShowQuestions && questions.length ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Progress</span>
                <span>{answeredCount}/{questions.length} answered</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-sky-600 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : null}
          {!isSubmitted ? (
          <div className="flex gap-3">
            <Button onClick={start} disabled={started || Boolean(availabilityNotStarted) || Boolean(availabilityExpired) || attemptLocked || !mediaReady}>Start attempt</Button>
            <Button variant="secondary" onClick={submit} disabled={!started || interactionLocked}>Submit answers</Button>
          </div>
          ) : null}
        </CardContent>
      </Card>

      {!isSubmitted && canShowQuestions && questions.length ? (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Question navigator</CardTitle>
              <CardDescription>Move between questions without losing local answers.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-3">
              {questions.map((question: AssessmentQuestion, index: number) => (
                <button
                  key={question._id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    currentQuestionIndex === index
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : answers[question._id]
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-[rgba(0,27,58,0.08)] bg-white/75 text-slate-700"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </CardContent>
          </Card>

          {currentQuestion ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Question {currentQuestionIndex + 1}: {currentQuestion.questionText}
                </CardTitle>
                <CardDescription>
                  {currentQuestion.questionType === "multiple_choice" ? "Select one answer." : "Write your answer clearly."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuestion.options?.length ? (
                  currentQuestion.options.map((option) => (
                    <label key={option} className="panel-soft flex items-center gap-3 p-3">
                      <input
                        checked={answers[currentQuestion._id] === option}
                        name={currentQuestion._id}
                        type="radio"
                        disabled={interactionLocked}
                        onChange={() => setAnswers((current) => ({ ...current, [currentQuestion._id]: option }))}
                      />
                      <span>{option}</span>
                    </label>
                  ))
                ) : (
                  <Textarea
                    placeholder="Type your answer"
                    disabled={interactionLocked}
                    value={answers[currentQuestion._id] || ""}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [currentQuestion._id]: event.target.value }))
                    }
                  />
                )}
                <div className="flex flex-wrap justify-between gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentQuestionIndex((current) => Math.max(0, current - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous question
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentQuestionIndex((current) => Math.min(questions.length - 1, current + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next question
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
          </div>
        ) : (
        <EmptyState
          title={started ? "No questions returned" : "Start the assessment to unlock questions"}
          description={
            started
              ? "The assessment is available, but the backend did not return any questions for this attempt."
              : "Questions stay hidden until you enable camera and microphone, then click Start attempt."
          }
        />
      )}
    </div>
  );
}

export function StudentAssessmentAttemptsPage() {
  const { data } = useQuery({ queryKey: ["student", "assessment-attempts"], queryFn: studentApi.assessmentAttempts });
  const attempts = data?.data || [];
  const gradedAttempts = attempts.filter((item) => item.score !== null && item.score !== undefined).length;

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Assessment attempts"
        title="Attempt history"
        description="Review completed assessments and check grading status."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={PlayCircle} title="Attempts logged" value={attempts.length} />
        <StatCard icon={BookOpen} title="Graded attempts" value={gradedAttempts} />
        <StatCard icon={TimerReset} title="Awaiting score" value={Math.max(attempts.length - gradedAttempts, 0)} />
      </div>
      <DataTable
        data={attempts}
        columns={[
          { key: "assessment", header: "Assessment", render: (item) => item.assessment?.title || "--" },
          { key: "status", header: "Status", render: (item) => <Badge>{item.status}</Badge> },
          { key: "score", header: "Score", render: (item) => item.score ?? "--" },
          { key: "submittedAt", header: "Submitted", render: (item) => formatDate(item.submittedAt, true) },
        ]}
      />
    </div>
  );
}

export function StudentAttendancePage() {
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: ["student", "active-sessions"],
    queryFn: studentApi.activeSessions,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const [sessionId, setSessionId] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [status, setStatus] = useState<string>("");
  const [joinStatus, setJoinStatus] = useState<string>("");
  const [position, setPosition] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [submittedSessionLabel, setSubmittedSessionLabel] = useState("");

  const getLocation = async () => {
    try {
      const coords = await getRobustUserLocation({
        onStatusChange: (nextStatus) => setStatus(nextStatus),
      });
      setPosition({
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
      });
      setStatus("Location acquired");
    } catch {
      setStatus("Location permission denied or unavailable");
    }
  };

  const submit = async () => {
    if (!position || !sessionId || !sessionCode) return;

    try {
      const fingerprint = await getBrowserFingerprint();
      await sharedApi.submitAttendance({
        sessionId,
        sessionCode,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        ...fingerprint,
      });
      const activeSession = (sessions.data?.data || []).find((session) => session._id === sessionId);
      setSubmittedSessionLabel(activeSession?.course?.title || activeSession?.sessionCode || "your session");
      setSuccessOpen(true);
      setJoinStatus("Attendance submitted successfully. Your submission is now recorded on the lecturer live session map.");
      setSessionId("");
      setSessionCode("");
      setPosition(null);
      setStatus("");
      await queryClient.invalidateQueries({ queryKey: ["student", "attendance-history"] });
      await queryClient.invalidateQueries({ queryKey: ["student", "active-sessions"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (!position || !sessionId) return undefined;

    let active = true;

    const syncPresence = async () => {
      try {
        const fingerprint = await getBrowserFingerprint();
        await sharedApi.joinAttendanceSessionPresence({
          sessionId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          ...fingerprint,
        });

        if (active) {
          setJoinStatus("Your device is now visible in the lecturer's live session map.");
        }
      } catch (error) {
        if (active) {
          setJoinStatus(getErrorMessage(error));
        }
      }
    };

    syncPresence();
    const timer = window.setInterval(syncPresence, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [position, sessionId]);

  return (
    <div className="space-y-6">
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance submitted</DialogTitle>
            <DialogDescription>
              Your attendance for {submittedSessionLabel || "this session"} has been recorded successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="success">
              You can close this message and continue, or open your attendance history to confirm the recorded submission.
            </Alert>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setSuccessOpen(false)}>
                Close
              </Button>
              <Button asChild>
                <Link href="/student/attendance/history" onClick={() => setSuccessOpen(false)}>
                  Open attendance history
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PageIntro
        kicker="Attendance"
        title="Attendance submission"
        description="Capture your location and submit attendance for an open session."
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Submit attendance</CardTitle>
          <CardDescription>Choose an open session, capture your location, and submit attendance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="portal-select"
            value={sessionId}
            onChange={(event) => {
              const nextSessionId = event.target.value;
              setSessionId(nextSessionId);
              const activeSession = (sessions.data?.data || []).find((session) => session._id === nextSessionId);
              if (activeSession?.sessionCode) {
                setSessionCode(activeSession.sessionCode);
              }
            }}
          >
            <option value="">Choose active session</option>
            {(sessions.data?.data || []).map((session) => (
              <option key={session._id} value={session._id}>
                {session.course?.title || "Course"} - {session.sessionCode}
              </option>
            ))}
          </select>
          <Input placeholder="Attendance session ID" value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
          <Input placeholder="Session code" value={sessionCode} onChange={(event) => setSessionCode(event.target.value)} />
          <Button variant="secondary" onClick={getLocation}>Capture location</Button>
          {position ? (
            <Alert variant="success">
              Lat {position.latitude.toFixed(5)}, Lng {position.longitude.toFixed(5)}, accuracy {formatNumber(position.accuracy)}m
            </Alert>
          ) : (
            <Alert variant="warning">{status || "Location has not been captured yet."}</Alert>
          )}
          {joinStatus ? <Alert variant="info">{joinStatus}</Alert> : null}
          <Button onClick={submit} disabled={!position || !sessionId || !sessionCode}>
            Submit attendance
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active attendance sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(sessions.data?.data || []).map((session) => (
            <button
              key={session._id}
              type="button"
              onClick={() => {
                setSessionId(session._id);
                setSessionCode(session.sessionCode);
              }}
              className="interactive-panel"
            >
              <p className="font-medium text-slate-900">{session.course?.title}</p>
              <p className="text-sm text-slate-500">
                {session.sessionCode} • {formatDate(session.startTime, true)} - {formatDate(session.endTime, true)}
              </p>
            </button>
          ))}
          {!sessions.isLoading && !(sessions.data?.data || []).length ? (
            <EmptyState
              title="No active sessions yet"
              description="New lecturer sessions appear here automatically when they go live for your approved courses."
            />
          ) : null}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export function StudentAttendanceHistoryPage() {
  const { data } = useQuery({ queryKey: ["student", "attendance-history"], queryFn: studentApi.attendanceHistory });
  const history = data?.data || [];

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Attendance history"
        title="Recorded submissions"
        description="View your submitted attendance records by course and session."
      />
      <PageControlCard>
        <Alert variant="info">
          Attendance records remain subject to backend validation rules, including geofence restrictions, duplicate checks, and device-based safeguards.
        </Alert>
      </PageControlCard>
      <DataTable
        data={history}
        columns={[
          { key: "course", header: "Course", render: (item) => item.course?.title || "--" },
          { key: "session", header: "Session", render: (item) => item.session?.sessionCode || "--" },
          { key: "date", header: "Submitted", render: (item) => formatDate(item.createdAt, true) },
        ]}
      />
    </div>
  );
}

export function StudentAnnouncementsPage() {
  const { data } = useQuery({ queryKey: ["student", "announcements"], queryFn: studentApi.announcements });
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage?.getItem("student_notifications") === "true";
    } catch (e) {
      return false;
    }
  });

  const enableNotifications = async () => {
    setEnablingNotifications(true);

    try {
      const result = await requestPushNotifications("student");
      if (result.enabled) {
        try {
          window.localStorage.setItem("student_notifications", "true");
        } catch (e) {}
        setNotificationsEnabled(true);
        toast.success("Student notifications enabled");
      } else {
        toast.error(result.reason === "push not configured" ? "Push notifications are not configured on the server yet." : "Notifications could not be enabled on this device.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setEnablingNotifications(false);
    }
  };

  // Poll for new announcements when notifications are enabled and show a local notification
  useEffect(() => {
    if (!notificationsEnabled) return;

    let es: EventSource | null = null;
    let pollId: number | null = null;
    const { accessToken } = getStoredSession();

    const handleAnnouncement = (a: any) => {
      const title = a.title || "New announcement";
      const body = a.body ? (a.body.length > 120 ? a.body.slice(0, 117) + "..." : a.body) : "";
      try {
        if (Notification.permission === "granted") {
          // @ts-ignore
          new Notification(title, { body });
        }
      } catch (e) {}
      toast.success(`Announcement: ${title}`);
      queryClient.invalidateQueries({ queryKey: ["student", "announcements"] });
    };

    // Prefer SSE if available and we have an access token
    if (typeof window !== "undefined" && typeof EventSource !== "undefined" && accessToken) {
      try {
        const url = `${apiClient.defaults.baseURL}/notifications/stream?token=${encodeURIComponent(accessToken)}`;
        es = new EventSource(url);
        es.addEventListener("announcement", (ev: MessageEvent) => {
          try {
            const payload = JSON.parse(ev.data);
            handleAnnouncement(payload);
          } catch (e) {}
        });
        es.addEventListener("heartbeat", () => {});
        es.onerror = () => {
          try {
            es?.close();
          } catch {}
          es = null;
        };
      } catch (e) {
        es = null;
      }
    }

    // fallback to polling if SSE unavailable
    if (!es) {
      let lastIds = new Set((data?.data || []).map((a) => a._id));
      const checkNew = async () => {
        try {
          const res = await studentApi.announcements();
          const anns = res.data || [];
          const newOnes = anns.filter((a) => !lastIds.has(a._id));
          if (newOnes.length) {
            newOnes.forEach(handleAnnouncement);
            lastIds = new Set(anns.map((a) => a._id));
          }
        } catch (e) {}
      };

      pollId = window.setInterval(checkNew, 10000);
      void checkNew();
    }

    return () => {
      try {
        if (es) es.close();
      } catch {}
      if (pollId) clearInterval(pollId);
    };
  }, [notificationsEnabled]);

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Announcements"
        title="Course and academic notices"
        description="Read notices published to your classes."
      />
      <PageControlCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="hidden sm:inline">Turn on notifications to receive lecturer announcements even when the student portal is not open.</span>
            <span className="inline sm:hidden">Enable notifications to get lecturer announcements.</span>
          </p>
          <Button variant="secondary" onClick={() => void enableNotifications()} disabled={enablingNotifications} className="w-full sm:w-auto">
            {enablingNotifications ? "Enabling..." : "Enable notifications"}
          </Button>
        </div>
      </PageControlCard>
      <ListingCard
        title="Course announcements"
        items={data?.data || []}
        renderItem={(item) => (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{item.title}</p>
              {item.course?.title ? <Badge tone="info">{item.course.title}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
          </>
        )}
      />
    </div>
  );
}

export function StudentMessagesPage() {
  const [page, setPage] = useState(1);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [messageBody, setMessageBody] = useState("");
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const threads = useQuery({
    queryKey: ["communication", "threads", page],
    queryFn: () => communicationApi.threads(page),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const messages = useQuery({
    queryKey: ["communication", "thread", selectedThread],
    enabled: Boolean(selectedThread),
    queryFn: () => communicationApi.threadMessages(selectedThread),
    refetchInterval: selectedThread ? 3000 : false,
    refetchOnWindowFocus: true,
  });

  const getThreadTitle = (thread?: NonNullable<typeof threads.data>["data"]["items"][number]) =>
    thread?.course?.code || thread?.course?.title || "Course thread";

  const getThreadPeople = (thread?: NonNullable<typeof threads.data>["data"]["items"][number]) =>
    thread?.participants
      ?.filter((participant) => participant._id !== user?._id)
      .map((participant) => participant.fullName)
      .filter(Boolean)
      .join(", ") || "Course conversation";

  const isLecturerSender = (message: NonNullable<typeof messages.data>["data"]["items"][number]) =>
    message.sender?.role === "lecturer";

  const selectedThreadSummary = (threads.data?.data.items || []).find((thread) => thread.threadKey === selectedThread);

  useEffect(() => {
    if (!selectedThread) return;
    communicationApi.markAsRead(selectedThread).then(() => {
      queryClient.invalidateQueries({ queryKey: ["communication", "threads"] });
    });
  }, [queryClient, selectedThread]);

  const sendMessage = async () => {
    if (!selectedThread || !messageBody.trim()) return;
    const activeThread = (threads.data?.data.items || []).find((thread) => thread.threadKey === selectedThread);
    const recipientIds =
      activeThread?.participants
        ?.map((participant) => participant._id)
        .filter((id) => id && id !== user?._id) || [];

    if (!recipientIds.length) {
      toast.error("A valid recipient could not be resolved for this thread.");
      return;
    }

    try {
      await studentApi.sendMessage({
        threadKey: selectedThread,
        body: messageBody.trim(),
        recipientIds,
      });
      toast.success("Message sent");
      setMessageBody("");
      await Promise.all([
        threads.refetch(),
        messages.refetch(),
        queryClient.invalidateQueries({ queryKey: ["communication", "threads"] }),
        queryClient.invalidateQueries({ queryKey: ["communication", "thread", selectedThread] }),
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Academic inbox"
        title="Course communication"
        description="Read course messages and reply within the correct thread."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={BookOpen} title="Threads" value={threads.data?.data.items?.length || 0} />
        <StatCard
          icon={TimerReset}
          title="Unread items"
          value={(threads.data?.data.items || []).reduce((total, thread) => total + (thread.unreadCount || 0), 0)}
        />
        <StatCard icon={PlayCircle} title="Messages in view" value={messages.data?.data.items?.length || 0} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Course threads</CardTitle>
          <CardDescription>Open a course to read and reply.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(threads.data?.data.items || []).map((thread) => (
            <button
              key={thread.threadKey}
              type="button"
              onClick={() => {
                setSelectedThread(thread.threadKey);
              }}
              className="interactive-panel"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{getThreadTitle(thread)}</p>
                {thread.unreadCount ? <Badge tone="warning">{thread.unreadCount}</Badge> : null}
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{getThreadPeople(thread)}</p>
              <p className="mt-2 text-sm text-slate-500">{thread.latestMessage?.body}</p>
            </button>
          ))}
          <Pagination
            page={threads.data?.data.page || 1}
            totalPages={threads.data?.data.totalPages || 1}
            onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedThreadSummary ? getThreadTitle(selectedThreadSummary) : "Course thread"}</CardTitle>
          <CardDescription>
            {selectedThreadSummary
              ? `Conversation with ${getThreadPeople(selectedThreadSummary)}`
              : "Choose a course thread to view messages."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(messages.data?.data.items || []).map((message) => (
            <div key={message._id} className="panel-soft">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-900">{message.sender?.fullName}</p>
                {isLecturerSender(message) ? <Badge tone="info">Lecturer</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{message.body}</p>
            </div>
          ))}
          {!selectedThread ? (
            <EmptyState
              title="Select a thread"
              description="Choose a thread to read messages and send a reply."
            />
          ) : null}
          <div className="panel-muted">
            <p className="mb-3 text-sm font-medium text-slate-700">
              {selectedThreadSummary ? `Reply in ${getThreadTitle(selectedThreadSummary)}` : "Select a course thread first"}
            </p>
            <div className="space-y-3">
              <Textarea
                placeholder={
                  selectedThreadSummary
                    ? `Write your reply for ${getThreadTitle(selectedThreadSummary)}`
                    : "Choose a course thread before replying"
                }
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                disabled={!selectedThread}
              />
              <Button onClick={sendMessage} disabled={!selectedThread || !messageBody.trim()}>
                Send message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function ListingCard<T>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border)] pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {items.length ? (
          items.slice(0, 5).map((item, index) => (
            <div key={index} className="panel-soft">
              {renderItem(item)}
            </div>
          ))
        ) : (
          <EmptyState title="Nothing to show" description="No records are available yet." />
        )}
      </CardContent>
    </Card>
  );
}
