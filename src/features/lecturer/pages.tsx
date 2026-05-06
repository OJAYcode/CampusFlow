"use client";

/* eslint-disable simple-import-sort/imports */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, ClipboardCheck, FileText, GraduationCap, MessageSquare, Plus, SendHorizontal, Trash2, Upload, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { communicationApi } from "@/src/api/communication";
import { lecturerApi } from "@/src/api/lecturer";
import { Alert } from "@/src/components/ui/alert";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FileLauncher } from "@/src/components/ui/file-launcher";
import { Input } from "@/src/components/ui/input";
import { PageIntro } from "@/src/components/ui/page-intro";
import { Pagination } from "@/src/components/ui/pagination";
import { StatCard } from "@/src/components/ui/stat-card";
import { Textarea } from "@/src/components/ui/textarea";
import { LecturerAttendancePage as DedicatedLecturerAttendancePage } from "@/src/features/lecturer/attendance-page";
import { requestPushNotifications } from "@/src/lib/push-notifications";
import { useAuthStore } from "@/src/store/auth-store";
import { getErrorMessage } from "@/src/utils/error";
import { formatDate, formatFileSize } from "@/src/utils/format";

function getCourseBasePath(pathname: string | null) {
  return (pathname ?? "").startsWith("/staff/lecturer") ? "/staff/lecturer/courses" : "/lecturer/courses";
}

function toDateTimeLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function buildDirectThreadKey(courseId: string, lecturerId: string, studentId: string) {
  return `course-${courseId}-${[lecturerId, studentId].sort().join("-")}`;
}

function LecturerCourseSelect({
  courses,
  value,
  onChange,
  label = "Course",
}: {
  courses: Array<{ _id: string; course: { _id: string; code: string; title: string } }>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select className="portal-select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select course</option>
        {courses.map((item) => (
          <option key={item._id} value={item.course._id}>
            {item.course.code} - {item.course.title}
          </option>
        ))}
      </select>
    </div>
  );
}

function LecturerDashboardContent() {
  const pathname = usePathname() ?? "";
  const user = useAuthStore((state) => state.user);
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });

  const courses = coursesQuery.data?.data || [];
  const courseBasePath = getCourseBasePath(pathname);

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Dashboard"
        title={`Welcome back${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Your teaching workspace is ready. Jump into attendance, open a course workspace, or continue managing class delivery."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} title="Assigned courses" value={courses.length} tone="info" />
        <StatCard icon={GraduationCap} title="Attendance workspace" value="Ready" tone="success" />
        <StatCard icon={ClipboardCheck} title="Delivery tools" value="4" helper="Assignments, tests, materials, and notices" tone="warning" />
        <StatCard icon={Users} title="Portal access" value="Active" tone="primary" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Open the areas lecturers use most often during the semester.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href="/staff/lecturer/attendance" className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Attendance</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Start and monitor sessions</p>
              <p className="mt-3 text-sm text-slate-600">Launch a live attendance session, capture location, and watch joined devices on the map.</p>
            </Link>
            <Link href="/staff/lecturer/courses" className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Courses</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Open course workspaces</p>
              <p className="mt-3 text-sm text-slate-600">Move into a specific course to manage materials, assignments, assessments, and reports.</p>
            </Link>
            <Link href="/staff/lecturer/assignments" className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assignments</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Review student work</p>
              <p className="mt-3 text-sm text-slate-600">Create coursework and continue into course-aware grading flows.</p>
            </Link>
            <Link href="/staff/lecturer/announcements" className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Announcements</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Publish course updates</p>
              <p className="mt-3 text-sm text-slate-600">Send notices and teaching updates from the right class context.</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned courses</CardTitle>
            <CardDescription>Continue from the classes already mapped to your lecturer profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length ? (
              courses.slice(0, 5).map((item) => (
                <Link
                  key={item._id}
                  href={`${courseBasePath}/${item.course._id}`}
                  className="block rounded-[18px] border border-[var(--border)] bg-[rgba(248,250,253,0.9)] p-4 transition hover:border-[#c8d8f6] hover:bg-white"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.course.code}</p>
                  <p className="mt-2 font-semibold text-slate-900">{item.course.title}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] p-6 text-center text-slate-600">
                No lecturer courses were found yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LecturerCoursesContent() {
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const pathname = usePathname() ?? "";
  const courses = coursesQuery.data?.data || [];
  const courseBasePath = getCourseBasePath(pathname);

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Courses"
        title="Course workspaces"
        description="Open a course to manage teaching materials, assignments, assessments, notices, and attendance reporting from one place."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={BookOpen} title="Assigned courses" value={courses.length} tone="info" />
        <StatCard icon={Users} title="Workspace status" value="Ready" tone="success" />
        <StatCard icon={GraduationCap} title="Role" value="Lecturer" tone="warning" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your courses</CardTitle>
          <CardDescription>Select a course workspace to continue teaching activity in the right context.</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((item) => (
                <Link
                  key={item._id}
                  href={`${courseBasePath}/${item.course._id}`}
                  className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.course.code}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.course.title}</p>
                  <p className="mt-3 text-sm text-slate-600">Open course workspace</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-slate-600">
              No lecturer courses were found yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LecturerCourseWorkspaceContent({ courseId }: { courseId?: string }) {
  const pathname = usePathname() ?? "";
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const workspaceQuery = useQuery({
    queryKey: ["lecturer", "workspace", courseId],
    queryFn: () => lecturerApi.workspace(courseId as string),
    enabled: Boolean(courseId),
  });

  const courses = coursesQuery.data?.data || [];
  const activeCourse = courses.find((item) => item.course._id === courseId)?.course;
  const workspace = workspaceQuery.data?.data;
  const courseBasePath = getCourseBasePath(pathname);

  return (
    <div className="space-y-6">
      <PageIntro
        kicker={activeCourse?.code || "Course"}
        title={activeCourse?.title || "Course workspace"}
        description="Continue course delivery from one class workspace. Attendance monitoring stays in the dedicated attendance surface."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={FileText} title="Materials" value={workspace?.materials?.length ?? 0} tone="info" />
        <StatCard icon={ClipboardCheck} title="Assignments" value={workspace?.assignments?.length ?? 0} tone="warning" />
        <StatCard icon={ClipboardCheck} title="Assessments" value={workspace?.assessments?.length ?? 0} tone="success" />
        <StatCard icon={Bell} title="Announcements" value={workspace?.announcements?.length ?? 0} tone="primary" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Course actions</CardTitle>
          <CardDescription>Use the lecturer navigation to keep working inside the right teaching area for this course.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/staff/lecturer/materials" className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Materials</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Manage files</p>
          </Link>
          <Link href="/staff/lecturer/assignments" className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assignments</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Create and grade</p>
          </Link>
          <Link href="/staff/lecturer/assessments" className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assessments</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Build tests</p>
          </Link>
          <Link href={`/staff/lecturer/courses/${courseId}/report`} className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Report</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Attendance summary</p>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Other lecturer courses</CardTitle>
          <CardDescription>Switch directly to another assigned class.</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((item) => (
                <Link
                  key={item._id}
                  href={`${courseBasePath}/${item.course._id}`}
                  className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_28px_rgba(15,37,71,0.05)] transition hover:-translate-y-[1px] hover:border-[#c8d8f6]"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.course.code}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.course.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-slate-600">
              No lecturer courses were found yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LecturerCourseReportPage({ courseId }: { courseId?: string }) {
  const pathname = usePathname() ?? "";
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const reportQuery = useQuery({
    queryKey: ["lecturer", "attendance-percentages", courseId],
    queryFn: () => lecturerApi.attendancePercentages(courseId as string),
    enabled: Boolean(courseId),
  });

  const courses = coursesQuery.data?.data || [];
  const activeCourse = courses.find((item) => item.course._id === courseId)?.course;
  const report = reportQuery.data?.data;
  const courseBasePath = getCourseBasePath(pathname);

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Reports"
        title={activeCourse ? `${activeCourse.code} attendance report` : "Course attendance report"}
        description="Review attendance percentage coverage for the selected course."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={GraduationCap} title="Attendance sessions" value={report?.totalSessions ?? 0} tone="info" />
        <StatCard icon={Users} title="Enrolled students" value={report?.enrolledStudents ?? 0} tone="primary" />
        <StatCard icon={ClipboardCheck} title="Average attendance" value={`${report?.averageAttendancePercentage ?? 0}%`} tone="success" />
        <StatCard icon={Bell} title="Below threshold" value={report?.studentsBelowThreshold ?? 0} tone="warning" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student attendance percentages</CardTitle>
          <CardDescription>Percentages are calculated from successful attendance submissions recorded for this course.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report?.students?.length ? (
            <div className="space-y-3">
              {report.students.map((item) => (
                <div
                  key={item.student._id}
                  className="flex flex-col gap-3 rounded-[18px] border border-[var(--border)] bg-white p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.student.fullName}</p>
                    <p className="text-sm text-slate-600">{item.student.matricNumber || item.student.email || "Student record"}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>Submitted: <strong className="text-slate-900">{item.submittedSessions}</strong></span>
                    <span>Missed: <strong className="text-slate-900">{item.missedSessions}</strong></span>
                    <span>Attendance: <strong className="text-slate-900">{item.attendancePercentage}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="info">No attendance submissions have been recorded for this course yet.</Alert>
          )}
          <div>
            <Link href={courseId ? `${courseBasePath}/${courseId}` : "/staff/lecturer/courses"} className="text-sm font-medium text-[#255ac8] transition hover:text-[#1d4ead]">
              Return to course workspace
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LecturerDashboardPage() {
  return <LecturerDashboardContent />;
}

export function LecturerCoursesPage() {
  return <LecturerCoursesContent />;
}

export function LecturerCourseWorkspacePage({ courseId }: { courseId?: string }) {
  return <LecturerCourseWorkspaceContent courseId={courseId} />;
}

export function LecturerReportsPage({ courseId }: { courseId?: string }) {
  return <LecturerCourseReportPage courseId={courseId} />;
}

export function LecturerMaterialsPage() {
  const queryClient = useQueryClient();
  const pathname = usePathname() ?? "";
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const courses = coursesQuery.data?.data || [];
  const [activeCourseId, setActiveCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("enrolled_students");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const courseBasePath = getCourseBasePath(pathname);

  useEffect(() => {
    if (!activeCourseId && courses[0]?.course?._id) {
      setActiveCourseId(courses[0].course._id);
    }
  }, [activeCourseId, courses]);

  const workspaceQuery = useQuery({
    queryKey: ["lecturer", "workspace", activeCourseId],
    queryFn: () => lecturerApi.workspace(activeCourseId),
    enabled: Boolean(activeCourseId),
  });

  const materials = workspaceQuery.data?.data?.materials || [];
  const activeCourse = courses.find((item) => item.course._id === activeCourseId)?.course;

  const uploadMaterial = useMutation({
    mutationFn: async () => {
      if (!activeCourseId) {
        throw new Error("Select a course first.");
      }

      if (!title.trim()) {
        throw new Error("Material title is required.");
      }

      if (!selectedFile) {
        throw new Error("Choose a file or document to upload.");
      }

      const payload = new FormData();
      payload.append("courseId", activeCourseId);
      payload.append("title", title.trim());
      payload.append("description", description.trim());
      payload.append("visibility", visibility);
      payload.append("files", selectedFile);

      return lecturerApi.uploadMaterial(payload);
    },
    onSuccess: async () => {
      toast.success("Material uploaded");
      setTitle("");
      setDescription("");
      setVisibility("enrolled_students");
      setSelectedFile(null);
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMaterial = useMutation({
    mutationFn: (materialId: string) => lecturerApi.deleteMaterial(materialId),
    onSuccess: async () => {
      toast.success("Material deleted");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Materials"
        title="Course materials"
        description="Upload course files and manage them in one place."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={FileText} title="Assigned courses" value={courses.length} tone="info" />
        <StatCard icon={Upload} title="Uploaded materials" value={materials.length} tone="success" />
        <StatCard icon={Users} title="Current visibility" value={visibility.replace(/_/g, " ")} tone="warning" />
        <StatCard icon={GraduationCap} title="Workspace" value={activeCourse?.code || "Select course"} tone="primary" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload material</CardTitle>
            <CardDescription>Pick a course, add a file, and publish it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Course</label>
              <select className="portal-select" value={activeCourseId} onChange={(event) => setActiveCourseId(event.target.value)}>
                <option value="">Select course</option>
                {courses.map((item) => (
                  <option key={item._id} value={item.course._id}>
                    {item.course.code} - {item.course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Material title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Week 4 routing notes" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short note about the uploaded document." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Visibility</label>
              <select className="portal-select" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                <option value="enrolled_students">Enrolled students</option>
                <option value="lecturers_only">Lecturers only</option>
                <option value="public_course">Public course</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">File or document</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] bg-[#f8fafc] px-4 py-5 text-sm font-medium text-slate-700 transition hover:border-[#c8d8f6] hover:bg-white">
                <Upload className="h-4 w-4" />
                {selectedFile ? selectedFile.name : "Choose file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </label>
              {selectedFile ? (
                <p className="text-sm text-slate-600">
                  {selectedFile.name} • {formatFileSize(selectedFile.size)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => uploadMaterial.mutate()} disabled={uploadMaterial.isPending || !activeCourseId}>
                <Upload className="mr-2 h-4 w-4" />
                {uploadMaterial.isPending ? "Uploading..." : "Upload material"}
              </Button>
              {activeCourseId ? (
                <Button asChild variant="secondary">
                  <Link href={`${courseBasePath}/${activeCourseId}`}>Open course workspace</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Published materials</CardTitle>
            <CardDescription>
              {activeCourse
                ? `Manage uploaded files for ${activeCourse.code}.`
                : "Select a course to view its files."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCourseId ? (
              workspaceQuery.isLoading ? (
                <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-slate-600">
                  Loading materials...
                </div>
              ) : materials.length ? (
                materials.map((material) => (
                  <div key={material._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{material.title}</p>
                          <Badge tone="info">{(material.visibility || "enrolled_students").replace(/_/g, " ")}</Badge>
                        </div>
                        {material.description ? <p className="text-sm leading-6 text-slate-600">{material.description}</p> : null}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>{material.fileName || "Document"}</span>
                          <span>{formatFileSize(material.fileSize)}</span>
                          <span>{formatDate(material.createdAt, true)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <FileLauncher fileUrl={material.fileUrl} fileName={material.fileName || material.title} triggerLabel="Open" />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => deleteMaterial.mutate(material._id)}
                          disabled={deleteMaterial.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-slate-600">
                  No materials uploaded yet.
                </div>
              )
            ) : (
              <Alert variant="info">Select a course first to upload and manage its materials.</Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LecturerAssignmentsPage() {
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const courses = coursesQuery.data?.data || [];
  const [activeCourseId, setActiveCourseId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [files, setFiles] = useState<File[]>([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [assignmentDueDraft, setAssignmentDueDraft] = useState("");
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, string>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activeCourseId && courses[0]?.course?._id) {
      setActiveCourseId(courses[0].course._id);
    }
  }, [activeCourseId, courses]);

  const workspaceQuery = useQuery({
    queryKey: ["lecturer", "workspace", activeCourseId],
    queryFn: () => lecturerApi.workspace(activeCourseId),
    enabled: Boolean(activeCourseId),
  });

  const assignments = workspaceQuery.data?.data?.assignments || [];

  useEffect(() => {
    if (assignments.length && !assignments.some((item) => item._id === selectedAssignmentId)) {
      setSelectedAssignmentId(assignments[0]._id);
    }
    if (!assignments.length) {
      setSelectedAssignmentId("");
    }
  }, [assignments, selectedAssignmentId]);

  const submissionsQuery = useQuery({
    queryKey: ["lecturer", "assignment-submissions", selectedAssignmentId],
    queryFn: () => lecturerApi.submissions(selectedAssignmentId),
    enabled: Boolean(selectedAssignmentId),
  });

  const createAssignment = useMutation({
    mutationFn: async () => {
      if (!activeCourseId) throw new Error("Select a course first.");
      if (!title.trim()) throw new Error("Assignment title is required.");
      if (!dueDate) throw new Error("Select a due date.");

      const payload = new FormData();
      payload.append("courseId", activeCourseId);
      payload.append("title", title.trim());
      payload.append("description", description.trim());
      payload.append("instructions", instructions.trim());
      payload.append("dueDate", new Date(dueDate).toISOString());
      payload.append("totalMarks", totalMarks || "100");
      payload.append("status", "published");
      files.forEach((file) => payload.append("files", file));
      return lecturerApi.createAssignment(payload);
    },
    onSuccess: async () => {
      toast.success("Assignment created");
      setTitle("");
      setDescription("");
      setInstructions("");
      setDueDate("");
      setTotalMarks("100");
      setFiles([]);
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteAssignment = useMutation({
    mutationFn: (assignmentId: string) => lecturerApi.deleteAssignment(assignmentId),
    onSuccess: async () => {
      toast.success("Assignment deleted");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
      if (selectedAssignmentId) {
        await queryClient.invalidateQueries({ queryKey: ["lecturer", "assignment-submissions", selectedAssignmentId] });
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateAssignmentDate = useMutation({
    mutationFn: ({ assignmentId, dueDate }: { assignmentId: string; dueDate: string }) =>
      lecturerApi.updateAssignment(assignmentId, {
        dueDate: new Date(dueDate).toISOString(),
        status: "published",
      }),
    onSuccess: async () => {
      toast.success("Assignment due date updated");
      setEditingAssignmentId("");
      setAssignmentDueDraft("");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const gradeSubmission = useMutation({
    mutationFn: ({ submissionId, grade, feedback }: { submissionId: string; grade: number; feedback?: string }) =>
      lecturerApi.gradeSubmission(submissionId, { grade, feedback }),
    onSuccess: async () => {
      toast.success("Submission graded");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "assignment-submissions", selectedAssignmentId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const activeCourse = courses.find((item) => item.course._id === activeCourseId)?.course;
  const submissions = submissionsQuery.data?.data || [];

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Assignments"
        title="Assignment workspace"
        description="Create coursework, review submissions, and grade student work."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={ClipboardCheck} title="Assignments" value={assignments.length} tone="warning" />
        <StatCard icon={Users} title="Submissions" value={submissions.length} tone="info" />
        <StatCard icon={GraduationCap} title="Course" value={activeCourse?.code || "Select"} tone="primary" />
        <StatCard icon={BookOpen} title="Status" value="Ready" tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create assignment</CardTitle>
            <CardDescription>Publish a new assignment to the selected course.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LecturerCourseSelect courses={courses} value={activeCourseId} onChange={setActiveCourseId} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Week 5 lab report" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Due date</label>
                <Input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Total marks</label>
                <Input type="number" min="0" value={totalMarks} onChange={(event) => setTotalMarks(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short summary for students." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Instructions</label>
              <Textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Submission rules, rubric, or format guidance." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Attachments</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] bg-[#f8fafc] px-4 py-5 text-sm font-medium text-slate-700 transition hover:border-[#c8d8f6] hover:bg-white">
                <Upload className="h-4 w-4" />
                {files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "Choose files"}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => setFiles(Array.from(event.target.files || []))}
                />
              </label>
            </div>
            <Button onClick={() => createAssignment.mutate()} disabled={createAssignment.isPending || !activeCourseId}>
              <Plus className="mr-2 h-4 w-4" />
              {createAssignment.isPending ? "Publishing..." : "Publish assignment"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Published assignments</CardTitle>
              <CardDescription>{activeCourse ? `Assignments for ${activeCourse.code}.` : "Select a course to view assignments."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments.length ? (
                assignments.map((assignment) => (
                  <div key={assignment._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{assignment.title}</p>
                          <Badge tone={assignment.status === "draft" ? "warning" : "info"}>{assignment.status || "published"}</Badge>
                        </div>
                        {assignment.description ? <p className="text-sm text-slate-600">{assignment.description}</p> : null}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>Due: {formatDate(assignment.dueDate, true)}</span>
                          <span>Marks: {assignment.totalMarks ?? "--"}</span>
                          <span>Files: {assignment.attachmentUrls?.length || 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={selectedAssignmentId === assignment._id ? "primary" : "secondary"} onClick={() => setSelectedAssignmentId(assignment._id)}>
                          {selectedAssignmentId === assignment._id ? "Viewing submissions" : "Open submissions"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingAssignmentId(assignment._id);
                            setAssignmentDueDraft(toDateTimeLocalInput(assignment.dueDate));
                          }}
                        >
                          Edit due date
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => deleteAssignment.mutate(assignment._id)}
                          disabled={deleteAssignment.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    {editingAssignmentId === assignment._id ? (
                      <div className="mt-4 grid gap-3 rounded-[16px] border border-[var(--border)] bg-[#fbfcfe] p-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">New due date</label>
                          <Input type="datetime-local" value={assignmentDueDraft} onChange={(event) => setAssignmentDueDraft(event.target.value)} />
                        </div>
                        <Button
                          onClick={() => updateAssignmentDate.mutate({ assignmentId: assignment._id, dueDate: assignmentDueDraft })}
                          disabled={updateAssignmentDate.isPending || !assignmentDueDraft}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingAssignmentId("");
                            setAssignmentDueDraft("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <Alert variant="info">No assignments published for this course yet.</Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission review</CardTitle>
              <CardDescription>{selectedAssignmentId ? "Grade student submissions for the selected assignment." : "Choose an assignment to review submissions."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedAssignmentId ? (
                <Alert variant="info">Select an assignment above to load submissions.</Alert>
              ) : submissions.length ? (
                submissions.map((submission) => (
                  <div key={submission._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{submission.student?.fullName || "Student"}</p>
                          <p className="text-sm text-slate-600">{submission.student?.matricNumber || "Matric not available"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {submission.submittedAt ? (
                            <span className="text-xs text-slate-500">{formatDate(submission.submittedAt, true)}</span>
                          ) : null}
                          <Badge tone={submission.status === "graded" ? "success" : "warning"}>{submission.status || "submitted"}</Badge>
                        </div>
                      </div>
                      {submission.submissionText ? <p className="text-sm leading-6 text-slate-600">{submission.submissionText}</p> : null}
                      {submission.attachmentUrls?.length ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-800">Submitted files</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.attachmentUrls.map((url, index) => (
                              <FileLauncher
                                key={`${submission._id}-${index}`}
                                fileUrl={url}
                                fileName={`Submission file ${index + 1}`}
                                triggerLabel={`Open file ${index + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Grade"
                          value={gradeDrafts[submission._id] ?? (submission.grade?.toString() || "")}
                          onChange={(event) => setGradeDrafts((current) => ({ ...current, [submission._id]: event.target.value }))}
                        />
                        <Textarea
                          placeholder="Feedback"
                          value={feedbackDrafts[submission._id] ?? (submission.feedback || "")}
                          onChange={(event) => setFeedbackDrafts((current) => ({ ...current, [submission._id]: event.target.value }))}
                        />
                        <Button
                          onClick={() =>
                            gradeSubmission.mutate({
                              submissionId: submission._id,
                              grade: Number(gradeDrafts[submission._id] ?? submission.grade ?? 0),
                              feedback: feedbackDrafts[submission._id] ?? submission.feedback ?? "",
                            })
                          }
                          disabled={gradeSubmission.isPending}
                        >
                          Save grade
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Alert variant="info">No submissions yet for the selected assignment.</Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function LecturerAssessmentsPage() {
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const courses = coursesQuery.data?.data || [];
  const [activeCourseId, setActiveCourseId] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assessmentType, setAssessmentType] = useState("quiz");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [editingAssessmentId, setEditingAssessmentId] = useState("");
  const [editAvailableFrom, setEditAvailableFrom] = useState("");
  const [editAvailableTo, setEditAvailableTo] = useState("");
  const [expandedAttemptId, setExpandedAttemptId] = useState("");
  const [questions, setQuestions] = useState([
    { id: "1", questionText: "", questionType: "multiple_choice", optionsText: "", correctAnswer: "", marks: "1" },
  ]);

  useEffect(() => {
    if (!activeCourseId && courses[0]?.course?._id) {
      setActiveCourseId(courses[0].course._id);
    }
  }, [activeCourseId, courses]);

  const workspaceQuery = useQuery({
    queryKey: ["lecturer", "workspace", activeCourseId],
    queryFn: () => lecturerApi.workspace(activeCourseId),
    enabled: Boolean(activeCourseId),
  });

  const assessments = [...(workspaceQuery.data?.data?.assessments || [])].sort(
    (left, right) =>
      new Date(right.availableTo || 0).getTime() - new Date(left.availableTo || 0).getTime(),
  );

  useEffect(() => {
    if (assessments.length && !assessments.some((item) => item._id === selectedAssessmentId)) {
      setSelectedAssessmentId(assessments[0]._id);
    }
    if (!assessments.length) {
      setSelectedAssessmentId("");
    }
  }, [assessments, selectedAssessmentId]);

  const attemptsQuery = useQuery({
    queryKey: ["lecturer", "assessment-attempts", selectedAssessmentId],
    queryFn: () => lecturerApi.assessmentAttempts(selectedAssessmentId),
    enabled: Boolean(selectedAssessmentId),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const assessmentAttemptCountsQuery = useQuery({
    queryKey: ["lecturer", "assessment-attempt-counts", activeCourseId, assessments.map((item) => item._id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        assessments.map(async (assessment) => {
          const response = await lecturerApi.assessmentAttempts(assessment._id);
          return [assessment._id, response.data.length] as const;
        }),
      );

      return Object.fromEntries(entries) as Record<string, number>;
    },
    enabled: assessments.length > 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const createAssessment = useMutation({
    mutationFn: async () => {
      if (!activeCourseId) throw new Error("Select a course first.");
      if (!title.trim()) throw new Error("Assessment title is required.");
      if (!availableFrom || !availableTo) throw new Error("Set both availability dates.");

      return lecturerApi.createAssessment({
        courseId: activeCourseId,
        title: title.trim(),
        instructions: instructions.trim(),
        assessmentType,
        durationMinutes: Number(durationMinutes),
        availableFrom: new Date(availableFrom).toISOString(),
        availableTo: new Date(availableTo).toISOString(),
        status: "published",
        questions: questions
          .filter((question) => question.questionText.trim())
          .map((question, index) => ({
            questionText: question.questionText.trim(),
            questionType: question.questionType,
            options:
              question.questionType === "multiple_choice"
                ? question.optionsText
                    .split(/\r?\n|,/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],
            correctAnswer: question.correctAnswer,
            marks: Number(question.marks || 1),
            order: index + 1,
          })),
      });
    },
    onSuccess: async () => {
      toast.success("Assessment created");
      setTitle("");
      setInstructions("");
      setAssessmentType("quiz");
      setDurationMinutes("30");
      setAvailableFrom("");
      setAvailableTo("");
      setQuestions([{ id: `${Date.now()}`, questionText: "", questionType: "multiple_choice", optionsText: "", correctAnswer: "", marks: "1" }]);
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteAssessment = useMutation({
    mutationFn: (assessmentId: string) => lecturerApi.deleteAssessment(assessmentId),
    onSuccess: async () => {
      toast.success("Assessment deleted");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
      if (selectedAssessmentId) {
        await queryClient.invalidateQueries({ queryKey: ["lecturer", "assessment-attempts", selectedAssessmentId] });
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateAssessmentWindow = useMutation({
    mutationFn: ({ assessmentId, nextAvailableFrom, nextAvailableTo }: { assessmentId: string; nextAvailableFrom: string; nextAvailableTo: string }) =>
      lecturerApi.updateAssessment(assessmentId, {
        availableFrom: new Date(nextAvailableFrom).toISOString(),
        availableTo: new Date(nextAvailableTo).toISOString(),
        status: "published",
      }),
    onSuccess: async () => {
      toast.success("Assessment schedule updated");
      setEditingAssessmentId("");
      setEditAvailableFrom("");
      setEditAvailableTo("");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const activeCourse = courses.find((item) => item.course._id === activeCourseId)?.course;
  const attempts = attemptsQuery.data?.data || [];
  const selectedAssessment = assessments.find((item) => item._id === selectedAssessmentId);
  const assessmentAttemptCounts = assessmentAttemptCountsQuery.data || {};

  useEffect(() => {
    if (!assessments.length) return;

    const assessmentWithAttempts = assessments.find(
      (assessment) => (assessmentAttemptCounts[assessment._id] || 0) > 0,
    );

    if (!assessmentWithAttempts) return;

    const selectedAttemptCount = assessmentAttemptCounts[selectedAssessmentId] || 0;
    if (!selectedAssessmentId || selectedAttemptCount === 0) {
      setSelectedAssessmentId(assessmentWithAttempts._id);
    }
  }, [assessmentAttemptCounts, assessments, selectedAssessmentId]);

  useEffect(() => {
    if (attempts.length && !attempts.some((attempt) => attempt._id === expandedAttemptId)) {
      setExpandedAttemptId(attempts[0]._id);
    }
    if (!attempts.length) {
      setExpandedAttemptId("");
    }
  }, [attempts, expandedAttemptId]);

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Assessments"
        title="Assessment workspace"
        description="Build quizzes, tests, and exams, then review student attempts."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={ClipboardCheck} title="Assessments" value={assessments.length} tone="success" />
        <StatCard icon={Users} title="Attempts" value={attempts.length} tone="info" />
        <StatCard icon={GraduationCap} title="Course" value={activeCourse?.code || "Select"} tone="primary" />
        <StatCard icon={BookOpen} title="Status" value="Ready" tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create assessment</CardTitle>
            <CardDescription>Publish a timed assessment with questions and availability window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LecturerCourseSelect courses={courses} value={activeCourseId} onChange={setActiveCourseId} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Midterm quiz" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <select className="portal-select" value={assessmentType} onChange={(event) => setAssessmentType(event.target.value)}>
                  <option value="quiz">Quiz</option>
                  <option value="test">Test</option>
                  <option value="exam">Exam</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Duration (minutes)</label>
                <Input type="number" min="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Available from</label>
                <Input type="datetime-local" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Available to</label>
                <Input type="datetime-local" value={availableTo} onChange={(event) => setAvailableTo(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Instructions</label>
              <Textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="What students should know before they begin." />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">Questions</label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setQuestions((current) => [
                      ...current,
                      { id: `${Date.now()}-${current.length}`, questionText: "", questionType: "multiple_choice", optionsText: "", correctAnswer: "", marks: "1" },
                    ])
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add question
                </Button>
              </div>
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-[18px] border border-[var(--border)] bg-[#fbfcfe] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">Question {index + 1}</p>
                    {questions.length > 1 ? (
                      <Button type="button" size="sm" variant="secondary" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Question text"
                      value={question.questionText}
                      onChange={(event) =>
                        setQuestions((current) => current.map((item) => (item.id === question.id ? { ...item, questionText: event.target.value } : item)))
                      }
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        className="portal-select"
                        value={question.questionType}
                        onChange={(event) =>
                          setQuestions((current) => current.map((item) => (item.id === question.id ? { ...item, questionType: event.target.value } : item)))
                        }
                      >
                        <option value="multiple_choice">Multiple choice</option>
                        <option value="short_answer">Short answer</option>
                      </select>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Marks"
                        value={question.marks}
                        onChange={(event) =>
                          setQuestions((current) => current.map((item) => (item.id === question.id ? { ...item, marks: event.target.value } : item)))
                        }
                      />
                    </div>
                    {question.questionType === "multiple_choice" ? (
                      <Textarea
                        placeholder="Options, one per line"
                        value={question.optionsText}
                        onChange={(event) =>
                          setQuestions((current) => current.map((item) => (item.id === question.id ? { ...item, optionsText: event.target.value } : item)))
                        }
                      />
                    ) : null}
                    <Input
                      placeholder="Correct answer"
                      value={question.correctAnswer}
                      onChange={(event) =>
                        setQuestions((current) => current.map((item) => (item.id === question.id ? { ...item, correctAnswer: event.target.value } : item)))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => createAssessment.mutate()} disabled={createAssessment.isPending || !activeCourseId}>
              <Plus className="mr-2 h-4 w-4" />
              {createAssessment.isPending ? "Publishing..." : "Publish assessment"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Published assessments</CardTitle>
              <CardDescription>{activeCourse ? `Assessments for ${activeCourse.code}.` : "Select a course to view assessments."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessments.length ? (
                assessments.map((assessment) => (
                  <div key={assessment._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{assessment.title}</p>
                          <Badge tone="info">{assessment.assessmentType}</Badge>
                          <Badge tone={assessment.status === "draft" ? "warning" : "success"}>{assessment.status || "published"}</Badge>
                          <Badge tone={(assessmentAttemptCounts[assessment._id] || 0) > 0 ? "success" : "neutral"}>
                            {(assessmentAttemptCounts[assessment._id] || 0)} attempt{(assessmentAttemptCounts[assessment._id] || 0) === 1 ? "" : "s"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>{assessment.durationMinutes} mins</span>
                          <span>{formatDate(assessment.availableFrom, true)}</span>
                          <span>{formatDate(assessment.availableTo, true)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={selectedAssessmentId === assessment._id ? "primary" : "secondary"} onClick={() => setSelectedAssessmentId(assessment._id)}>
                          {selectedAssessmentId === assessment._id ? "Viewing attempts" : "Review attempts"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingAssessmentId(assessment._id);
                            setEditAvailableFrom(toDateTimeLocalInput(assessment.availableFrom));
                            setEditAvailableTo(toDateTimeLocalInput(assessment.availableTo));
                          }}
                        >
                          Edit schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => deleteAssessment.mutate(assessment._id)}
                          disabled={deleteAssessment.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    {editingAssessmentId === assessment._id ? (
                      <div className="mt-4 grid gap-3 rounded-[16px] border border-[var(--border)] bg-[#fbfcfe] p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Available from</label>
                          <Input type="datetime-local" value={editAvailableFrom} onChange={(event) => setEditAvailableFrom(event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Available to</label>
                          <Input type="datetime-local" value={editAvailableTo} onChange={(event) => setEditAvailableTo(event.target.value)} />
                        </div>
                        <Button
                          onClick={() =>
                            updateAssessmentWindow.mutate({
                              assessmentId: assessment._id,
                              nextAvailableFrom: editAvailableFrom,
                              nextAvailableTo: editAvailableTo,
                            })
                          }
                          disabled={updateAssessmentWindow.isPending || !editAvailableFrom || !editAvailableTo}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingAssessmentId("");
                            setEditAvailableFrom("");
                            setEditAvailableTo("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <Alert variant="info">No assessments published for this course yet.</Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attempt review</CardTitle>
              <CardDescription>
                {selectedAssessment
                  ? `Showing attempts for ${selectedAssessment.title}. New submissions appear here automatically.`
                  : "Choose an assessment to load attempts."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedAssessmentId ? (
                <Alert variant="info">Select an assessment above to review attempts.</Alert>
              ) : attempts.length ? (
                attempts.map((attempt) => (
                  <div key={attempt._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{attempt.student?.fullName || "Student"}</p>
                        <p className="text-sm text-slate-600">{attempt.student?.matricNumber || "Matric not available"}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <Badge tone={attempt.proctoring?.cameraGranted ? "success" : "warning"}>
                            Camera {attempt.proctoring?.cameraGranted ? "on" : "off"}
                          </Badge>
                          <Badge tone={attempt.proctoring?.microphoneGranted ? "success" : "warning"}>
                            Mic {attempt.proctoring?.microphoneGranted ? "on" : "off"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        <Badge tone={attempt.status === "graded" ? "success" : "info"}>{attempt.status}</Badge>
                        <span>Score: <strong className="text-slate-900">{attempt.score ?? "--"}</strong></span>
                        <span>Submitted: {formatDate(attempt.submittedAt, true)}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setExpandedAttemptId((current) => (current === attempt._id ? "" : attempt._id))
                          }
                        >
                          {expandedAttemptId === attempt._id ? "Hide answers" : "Review answers"}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
                      <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-slate-950">
                        {attempt.proctoring?.latestSnapshotDataUrl ? (
                          <img
                            src={attempt.proctoring.latestSnapshotDataUrl}
                            alt={`${attempt.student?.fullName || "Student"} proctor snapshot`}
                            className="aspect-video w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center px-4 text-center text-sm text-slate-300">
                            No live camera preview yet
                          </div>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="panel-soft p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Tab switches</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">{attempt.proctoring?.tabSwitchCount || 0}</p>
                        </div>
                        <div className="panel-soft p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Window blurs</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">{attempt.proctoring?.windowBlurCount || 0}</p>
                        </div>
                        <div className="panel-soft p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Mic activity</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">{Math.round((attempt.proctoring?.micLevel || 0) * 100)}%</p>
                        </div>
                      </div>
                    </div>
                    {expandedAttemptId === attempt._id ? (
                      <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">Submitted answers</p>
                            <p className="text-sm text-slate-600">Review each response, the expected answer, and awarded marks.</p>
                          </div>
                          <Badge tone="neutral">{attempt.answers?.length || 0} response{(attempt.answers?.length || 0) === 1 ? "" : "s"}</Badge>
                        </div>
                        {attempt.answers?.length ? (
                          [...attempt.answers]
                            .sort((left, right) => {
                              const leftQuestion = typeof left.question === "object" ? left.question : undefined;
                              const rightQuestion = typeof right.question === "object" ? right.question : undefined;
                              return Number(leftQuestion?.order || 0) - Number(rightQuestion?.order || 0);
                            })
                            .map((answer, index) => {
                              const question = typeof answer.question === "object" ? answer.question : undefined;
                              return (
                                <div key={`${attempt._id}-${question?._id || index}`} className="rounded-[16px] border border-[var(--border)] bg-[#fbfcfe] p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold text-slate-900">
                                        Question {question?.order || index + 1}
                                      </p>
                                      <p className="text-sm leading-6 text-slate-700">
                                        {question?.questionText || "Question text unavailable"}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                      <Badge tone={answer.isCorrect ? "success" : "warning"}>
                                        {answer.isCorrect ? "Correct" : "Needs review"}
                                      </Badge>
                                      <Badge tone="info">
                                        {answer.awardedMarks ?? 0} / {question?.marks ?? 0} marks
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                    <div className="panel-soft p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Student answer</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-900">
                                        {answer.answer === null || answer.answer === undefined || answer.answer === ""
                                          ? "No answer submitted"
                                          : String(answer.answer)}
                                      </p>
                                    </div>
                                    <div className="panel-soft p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Expected answer</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-900">
                                        {question?.correctAnswer === null || question?.correctAnswer === undefined || question?.correctAnswer === ""
                                          ? "Not available"
                                          : String(question.correctAnswer)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <Alert variant="info">This attempt does not have any submitted answers to review yet.</Alert>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <Alert variant="info">
                  No submitted attempts yet for {selectedAssessment?.title || "the selected assessment"}.
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function LecturerAnnouncementsPage() {
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const courses = coursesQuery.data?.data || [];
  const [activeCourseId, setActiveCourseId] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [enablingNotifications, setEnablingNotifications] = useState(false);

  useEffect(() => {
    if (!activeCourseId && courses[0]?.course?._id) {
      setActiveCourseId(courses[0].course._id);
    }
  }, [activeCourseId, courses]);

  const workspaceQuery = useQuery({
    queryKey: ["lecturer", "workspace", activeCourseId],
    queryFn: () => lecturerApi.workspace(activeCourseId),
    enabled: Boolean(activeCourseId),
  });

  const announcements = workspaceQuery.data?.data?.announcements || [];
  const activeCourse = courses.find((item) => item.course._id === activeCourseId)?.course;

  const saveAnnouncement = useMutation({
    mutationFn: async () => {
      if (!activeCourseId) throw new Error("Select a course first.");
      if (!title.trim() || !body.trim()) throw new Error("Title and body are required.");

      if (editingAnnouncementId) {
        return lecturerApi.updateAnnouncement(editingAnnouncementId, {
          courseId: activeCourseId,
          title: title.trim(),
          body: body.trim(),
        });
      }

      return lecturerApi.createAnnouncement({
        courseId: activeCourseId,
        title: title.trim(),
        body: body.trim(),
      });
    },
    onSuccess: async () => {
      toast.success(editingAnnouncementId ? "Announcement updated" : "Announcement published");
      setEditingAnnouncementId("");
      setTitle("");
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (announcementId: string) => lecturerApi.deleteAnnouncement(announcementId),
    onSuccess: async () => {
      toast.success("Announcement deleted");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "workspace", activeCourseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const enableNotifications = async () => {
    setEnablingNotifications(true);

    try {
      const result = await requestPushNotifications("staff");
      if (result.enabled) {
        toast.success("Staff notifications enabled");
      } else {
        toast.error(result.reason === "push not configured" ? "Push notifications are not configured on the server yet." : "Notifications could not be enabled on this device.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setEnablingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Announcements"
        title="Announcement workspace"
        description="Publish notices and update them from the right course context."
      />

      <Alert variant="info">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Enable notifications here to receive portal alerts and verify the staff PWA install flow.</span>
          <Button variant="secondary" onClick={() => void enableNotifications()} disabled={enablingNotifications}>
            {enablingNotifications ? "Enabling..." : "Enable notifications"}
          </Button>
        </div>
      </Alert>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Bell} title="Notices" value={announcements.length} tone="primary" />
        <StatCard icon={GraduationCap} title="Course" value={activeCourse?.code || "Select"} tone="info" />
        <StatCard icon={Users} title="Audience" value="Students" tone="success" />
        <StatCard icon={BookOpen} title="Status" value={editingAnnouncementId ? "Editing" : "Ready"} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingAnnouncementId ? "Edit announcement" : "Publish announcement"}</CardTitle>
            <CardDescription>Write a notice for the selected course.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LecturerCourseSelect courses={courses} value={activeCourseId} onChange={setActiveCourseId} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Class moved to Friday" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Announcement body</label>
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share the update students need to see." />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => saveAnnouncement.mutate()} disabled={saveAnnouncement.isPending || !activeCourseId}>
                {saveAnnouncement.isPending ? "Saving..." : editingAnnouncementId ? "Update announcement" : "Publish announcement"}
              </Button>
              {editingAnnouncementId ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingAnnouncementId("");
                    setTitle("");
                    setBody("");
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Published notices</CardTitle>
            <CardDescription>{activeCourse ? `Announcements for ${activeCourse.code}.` : "Select a course to view notices."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length ? (
              announcements.map((announcement) => (
                <div key={announcement._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{announcement.title}</p>
                        <Badge tone="info">{formatDate(announcement.createdAt, true)}</Badge>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{announcement.body}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingAnnouncementId(announcement._id);
                          setTitle(announcement.title);
                          setBody(announcement.body);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => deleteAnnouncement.mutate(announcement._id)}
                        disabled={deleteAnnouncement.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Alert variant="info">No announcements published for this course yet.</Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LecturerMessagesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [selectedThread, setSelectedThread] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [composeCourseId, setComposeCourseId] = useState("");
  const [composeAudienceMode, setComposeAudienceMode] = useState<"course" | "cohort">("course");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [composeBody, setComposeBody] = useState("");

  const courses = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });

  const courseItems = courses.data?.data || [];
  const courseStudents = useQuery({
    queryKey: ["lecturer", "messages", "course-students", composeCourseId],
    enabled: Boolean(composeCourseId),
    queryFn: () => lecturerApi.courseStudents(composeCourseId),
  });

  const threads = useQuery({
    queryKey: ["lecturer", "communication", "threads", page],
    queryFn: () => communicationApi.threads(page),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const threadItems = threads.data?.data.items || [];
  const selectedThreadSummary = threadItems.find((thread) => thread.threadKey === selectedThread);

  const messages = useQuery({
    queryKey: ["lecturer", "communication", "thread", selectedThread],
    enabled: Boolean(selectedThread),
    queryFn: () => communicationApi.threadMessages(selectedThread),
    refetchInterval: selectedThread ? 3000 : false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!selectedThread) return;
    communicationApi.markAsRead(selectedThread).then(() => {
      queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "threads"] });
    });
  }, [queryClient, selectedThread]);

  const audienceData = courseStudents.data?.data;
  const approvedStudentItems = Array.isArray(audienceData)
    ? audienceData
    : audienceData?.approvedStudents || [];
  const cohortStudentItems = Array.isArray(audienceData)
    ? audienceData
    : audienceData?.cohortStudents || [];
  const audienceStudents = composeAudienceMode === "cohort" ? cohortStudentItems : approvedStudentItems;

  useEffect(() => {
    setSelectedRecipientIds(audienceStudents.map((student) => student._id));
  }, [composeAudienceMode, composeCourseId, audienceData]);

  const composeMessage = useMutation({
    mutationFn: async () => {
      if (!user?._id) {
        throw new Error("Lecturer profile could not be resolved.");
      }
      if (!composeCourseId || !composeBody.trim()) {
        throw new Error("Choose a course and enter a message.");
      }

      const hasLoadedAudience = audienceStudents.length > 0;
      const targetAudience = composeAudienceMode === "cohort" ? "department_level" : "course_approved";
      const recipientIds = hasLoadedAudience ? selectedRecipientIds : [];

      return lecturerApi.sendMessage({
        threadKey:
          recipientIds.length === 1
            ? buildDirectThreadKey(composeCourseId, user._id, recipientIds[0])
            : `course-broadcast-${composeCourseId}-${Date.now()}`,
        recipientIds,
        courseId: composeCourseId,
        targetAudience,
        body: composeBody.trim(),
      });
    },
    onSuccess: async (response) => {
      const sentThreadKey = response.data.threadKey;
      toast.success("Message sent");
      setComposeBody("");
      setPage(1);
      setSelectedThread(selectedRecipientIds.length === 1 ? sentThreadKey : "");
      await Promise.all([
        threads.refetch(),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "threads"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "thread", sentThreadKey] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      const recipientIds = Array.from(
        new Set(
          (messages.data?.data.items || [])
            .flatMap((message) => [
              message.sender?._id,
              ...(message.recipients?.map((recipient) => recipient._id) || []),
            ])
            .filter((id): id is string => Boolean(id) && id !== user?._id),
        ),
      );

      if (!selectedThread || !messageBody.trim()) {
        throw new Error("Select a thread and enter a reply.");
      }
      if (!recipientIds.length) {
        throw new Error("No valid recipient was found for this thread.");
      }

      return lecturerApi.sendMessage({
        threadKey: selectedThread,
        recipientIds,
        courseId: selectedThreadSummary?.course?._id,
        body: messageBody.trim(),
      });
    },
    onSuccess: async () => {
      toast.success("Reply sent");
      setMessageBody("");
      await Promise.all([
        messages.refetch(),
        threads.refetch(),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "thread", selectedThread] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "threads"] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const messageItems = messages.data?.data.items || [];
  const unreadCount = threadItems.reduce((total, thread) => total + (thread.unreadCount || 0), 0);

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Messages"
        title="Lecturer inbox"
        description="Read course conversations and reply inside the right thread."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={MessageSquare} title="Threads" value={threadItems.length} tone="info" />
        <StatCard icon={Users} title="Unread" value={unreadCount} tone="warning" />
        <StatCard icon={BookOpen} title="Messages in thread" value={messageItems.length} tone="primary" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compose and inbox</CardTitle>
            <CardDescription>Start a new conversation or continue an existing one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LecturerCourseSelect
              courses={courseItems}
              value={composeCourseId}
              onChange={(value) => {
                setComposeCourseId(value);
                setComposeAudienceMode("course");
                setSelectedRecipientIds([]);
              }}
            />

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Audience</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setComposeAudienceMode("course")}
                  className={`rounded-[16px] border px-4 py-3 text-left transition ${
                    composeAudienceMode === "course"
                      ? "border-[#255ac8] bg-[#f5f8ff]"
                      : "border-[var(--border)] bg-white hover:border-[#c8d8f6]"
                  }`}
                  disabled={!composeCourseId}
                >
                  <p className="font-medium text-slate-900">Approved course students</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Send to everyone approved for this class.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setComposeAudienceMode("cohort")}
                  className={`rounded-[16px] border px-4 py-3 text-left transition ${
                    composeAudienceMode === "cohort"
                      ? "border-[#255ac8] bg-[#f5f8ff]"
                      : "border-[var(--border)] bg-white hover:border-[#c8d8f6]"
                  }`}
                  disabled={!composeCourseId}
                >
                  <p className="font-medium text-slate-900">Department and level</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Send to all students in this course&apos;s department and year.
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-[18px] border border-[var(--border)] bg-white p-4 shadow-[0_10px_28px_rgba(15,37,71,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">Message</p>
                  <p className="text-sm text-slate-600">
                    Write what you want to send before reviewing the recipient list.
                  </p>
                </div>
                <Button
                  onClick={() => composeMessage.mutate()}
                  disabled={composeMessage.isPending || !composeCourseId || !composeBody.trim()}
                >
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  {composeMessage.isPending ? "Sending..." : "Send message"}
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                <label className="text-sm font-medium text-slate-700">First message</label>
                <Textarea
                  placeholder="Write a message to the selected audience"
                  value={composeBody}
                  onChange={(event) => setComposeBody(event.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>

            <div className="space-y-3">
              {composeCourseId && !courseStudents.isLoading ? (
                <div className="rounded-[18px] border border-[var(--border)] bg-[#fbfcfe] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {composeAudienceMode === "cohort" ? "Department/level audience" : "Approved class audience"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedRecipientIds.length || audienceStudents.length} recipient{(selectedRecipientIds.length || audienceStudents.length) === 1 ? "" : "s"} selected
                        {!Array.isArray(audienceData) && audienceData?.course?.level ? ` • ${audienceData.course.level} level` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedRecipientIds(audienceStudents.map((student) => student._id))}
                        disabled={!audienceStudents.length}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecipientIds([])}
                        disabled={!selectedRecipientIds.length}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                    {audienceStudents.map((student) => {
                      const checked = selectedRecipientIds.includes(student._id);
                      return (
                        <label
                          key={student._id}
                          className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[var(--border)] bg-white px-3 py-3"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-[#255ac8]"
                            checked={checked}
                            onChange={(event) => {
                              setSelectedRecipientIds((current) =>
                                event.target.checked
                                  ? Array.from(new Set([...current, student._id]))
                                  : current.filter((id) => id !== student._id),
                              );
                            }}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{student.fullName}</p>
                            <p className="text-sm text-slate-600">
                              {student.matricNumber || student.email}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                    {!audienceStudents.length ? (
                      <p className="text-sm text-slate-500">
                        {composeAudienceMode === "cohort"
                          ? "Audience preview is unavailable right now. You can still send to the department and level from the server."
                          : "Audience preview is unavailable right now. You can still send to approved course students from the server."}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <div className="mb-3">
                <p className="font-semibold text-slate-900">Inbox</p>
                <p className="text-sm text-slate-600">Open a thread to read messages and reply.</p>
              </div>
              {threadItems.length ? (
                threadItems.map((thread) => (
                  <button
                    key={thread.threadKey}
                    type="button"
                    onClick={() => setSelectedThread(thread.threadKey)}
                    className={`w-full rounded-[18px] border p-4 text-left transition ${
                      selectedThread === thread.threadKey
                        ? "border-[#255ac8] bg-[#f5f8ff]"
                        : "border-[var(--border)] bg-white hover:border-[#c8d8f6]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">
                        {thread.participants
                          ?.filter((participant) => participant._id !== user?._id)
                          .map((participant) => participant.fullName)
                          .filter(Boolean)
                          .join(", ") || thread.course?.code || "Course thread"}
                      </p>
                      {thread.unreadCount ? <Badge tone="warning">{thread.unreadCount}</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{thread.course?.code || "General"}</p>
                    <p className="mt-2 text-sm text-slate-600">{thread.latestMessage?.body || "No message preview"}</p>
                  </button>
                ))
              ) : (
                <Alert variant="info">No message threads yet.</Alert>
              )}
              <Pagination
                page={threads.data?.data.page || 1}
                totalPages={threads.data?.data.totalPages || 1}
                onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
                onNext={() => setPage((current) => current + 1)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thread detail</CardTitle>
            <CardDescription>
              {selectedThread
                ? `Reply to ${
                    selectedThreadSummary?.participants
                      ?.filter((participant) => participant._id !== user?._id)
                      .map((participant) => participant.fullName)
                      .filter(Boolean)
                      .join(", ") || "the selected conversation"
                  }.`
                : "Choose a thread to view messages."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedThread ? (
              <>
                <div className="space-y-3">
                  {messageItems.map((message) => (
                    <div key={message._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">{message.sender?.fullName || "Sender"}</p>
                        <p className="text-xs text-slate-500">{formatDate(message.createdAt, true)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{message.body}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-[#fbfcfe] p-4">
                  <p className="mb-3 text-sm font-medium text-slate-800">Reply</p>
                  <div className="space-y-3">
                    <Textarea placeholder="Write your reply" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} />
                    <Button onClick={() => sendReply.mutate()} disabled={sendReply.isPending}>
                      <SendHorizontal className="mr-2 h-4 w-4" />
                      {sendReply.isPending ? "Sending..." : "Send reply"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Alert variant="info">Select a thread from the inbox to view messages and reply.</Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LecturerAttendancePage() {
  return <DedicatedLecturerAttendancePage />;
}
