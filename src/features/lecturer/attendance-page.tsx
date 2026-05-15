"use client";

/* eslint-disable simple-import-sort/imports */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Download, GraduationCap, LocateFixed, MapPinned, Plus, Radar, TimerReset, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRobustUserLocation } from "@/lib/geolocation";
import { reverseGeocodeCoordinates } from "@/lib/reverse-geocode";
import { lecturerApi } from "@/src/api/lecturer";
import { Alert } from "@/src/components/ui/alert";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { PageIntro } from "@/src/components/ui/page-intro";
import { StatCard } from "@/src/components/ui/stat-card";
import type { AttendanceStudentPoint } from "@/src/components/ui/attendance-geofence-map";
import type { ApiEnvelope, AttendanceSessionLiveView, Course } from "@/src/types/domain";
import { downloadBlob, getFilenameFromDisposition } from "@/src/utils/download";
import { getErrorMessage } from "@/src/utils/error";
import { formatDate } from "@/src/utils/format";
import { openSseStream } from "@/src/utils/live-stream";

const AttendanceGeofenceMap = dynamic(
  () => import("@/src/components/ui/attendance-geofence-map").then((mod) => mod.AttendanceGeofenceMap),
  { ssr: false },
);

type LecturerCourseLink = { _id: string; course: Course };

function getCourseName(course?: Course | null) {
  return course?.title || course?.code || "Course";
}

function getCourseCode(course?: Course | null) {
  return course?.code || "";
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function CourseSelect({
  courses,
  value,
  onChange,
}: {
  courses: Array<LecturerCourseLink>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select className="portal-select" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select course</option>
      {courses.map((item) => (
        <option key={item._id} value={item.course._id}>
          {item.course.code} - {item.course.title}
        </option>
      ))}
    </select>
  );
}

export function LecturerAttendancePage() {
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });
  const sessionsQuery = useQuery({
    queryKey: ["lecturer", "attendance-sessions"],
    queryFn: lecturerApi.lecturerAttendanceSessions,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const courses = coursesQuery.data?.data || [];
  const sessions = sessionsQuery.data?.data || [];
  const activeSessions = sessions.filter((item) => item.status === "active");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    durationMinutes: "60",
    latitude: "0",
    longitude: "0",
    radius: "50",
    roomLabel: "",
  });
  const [locationState, setLocationState] = useState<"idle" | "capturing" | "ready" | "error">("idle");
  const [locationStatusText, setLocationStatusText] = useState("");
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [detectedVenueLabel, setDetectedVenueLabel] = useState("");
  const [detectedVenueDisplayName, setDetectedVenueDisplayName] = useState("");
  const [isResolvingVenue, setIsResolvingVenue] = useState(false);
  const [reportCourseId, setReportCourseId] = useState("");
  const [liveSessionId, setLiveSessionId] = useState("");
  const [liveStreamData, setLiveStreamData] = useState<ApiEnvelope<AttendanceSessionLiveView>["data"] | null>(null);
  const [liveStreamStatus, setLiveStreamStatus] = useState<"idle" | "connecting" | "live" | "reconnecting" | "error">("idle");
  const [liveHeartbeatAt, setLiveHeartbeatAt] = useState<string | null>(null);
  const [presenceTrails, setPresenceTrails] = useState<Record<string, Array<{ latitude: number; longitude: number }>>>({});

  const activeReportCourseId = reportCourseId || courses[0]?.course?._id || "";
  const activeLiveSessionId = liveSessionId || activeSessions[0]?._id || "";
  const hasCapturedLocation = Number(form.latitude) !== 0 || Number(form.longitude) !== 0;

  const attendanceReportQuery = useQuery({
    queryKey: ["lecturer", "attendance-percentages", activeReportCourseId],
    enabled: Boolean(activeReportCourseId),
    queryFn: () => lecturerApi.attendancePercentages(activeReportCourseId),
  });

  const liveSessionQuery = useQuery({
    queryKey: ["lecturer", "attendance-session-live", activeLiveSessionId],
    enabled: Boolean(activeLiveSessionId),
    queryFn: () => lecturerApi.attendanceSessionLive(activeLiveSessionId),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const liveView = liveStreamData || liveSessionQuery.data?.data;
  const attendanceReport = attendanceReportQuery.data?.data;

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
      `${baseUrl}/lecturers/attendance-sessions/${activeLiveSessionId}/live/stream`,
      {
        onOpen: () => setLiveStreamStatus("live"),
        onHeartbeat: () => setLiveHeartbeatAt(new Date().toISOString()),
        onMessage: (payload) => {
          setLiveStreamStatus("live");
          setLiveHeartbeatAt(new Date().toISOString());
          setLiveStreamData(payload);
        },
        onClose: () => setLiveStreamStatus("reconnecting"),
        onError: () => setLiveStreamStatus("error"),
      },
      controller.signal,
    ).catch(() => {
      if (!controller.signal.aborted) {
        setLiveStreamStatus("error");
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

        next[presence._id] = samePoint
          ? existing
          : [...existing, { latitude: presence.latitude, longitude: presence.longitude }].slice(-6);
      });

      return next;
    });
  }, [liveView]);

  const createSession = useMutation({
    mutationFn: async () => {
      if (!form.courseId) {
        throw new Error("Course is required.");
      }
      if (!hasCapturedLocation) {
        throw new Error("Capture your location before starting the session.");
      }
      const now = new Date();
      const end = new Date(now.getTime() + Number(form.durationMinutes || 60) * 60 * 1000);

      return lecturerApi.attendanceSessions({
        courseId: form.courseId,
        startTime: now.toISOString(),
        endTime: end.toISOString(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        locationAccuracy: locationAccuracy ?? undefined,
        radius: Number(form.radius || 50),
        roomLabel: form.roomLabel.trim(),
        detectedVenueLabel: detectedVenueDisplayName || detectedVenueLabel || undefined,
        venueDetectionSource: detectedVenueDisplayName || detectedVenueLabel ? "openstreetmap-nominatim" : undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Attendance session created");
      setForm({
        courseId: "",
        durationMinutes: "60",
        latitude: "0",
        longitude: "0",
        radius: "50",
        roomLabel: "",
      });
      setLocationState("idle");
      setLocationStatusText("");
      setLocationAccuracy(null);
      setDetectedVenueLabel("");
      setDetectedVenueDisplayName("");
      setIsResolvingVenue(false);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "attendance-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "attendance-percentages"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const cancelSession = useMutation({
    mutationFn: (sessionId: string) => lecturerApi.cancelAttendanceSession(sessionId),
    onSuccess: async () => {
      toast.success("Attendance session cancelled");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "attendance-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "attendance-percentages"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const endSession = useMutation({
    mutationFn: (sessionId: string) => lecturerApi.endAttendanceSession(sessionId),
    onSuccess: async () => {
      toast.success("Attendance session ended");
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "attendance-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "attendance-session-live"] });
      await queryClient.invalidateQueries({ queryKey: ["student", "active-sessions"] });
      setLiveSessionId("");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const exportSession = async (sessionId: string, format: "csv" | "pdf" | "docx") => {
    try {
      const response =
        format === "csv"
          ? await lecturerApi.exportAttendanceSessionCsv(sessionId)
          : format === "docx"
            ? await lecturerApi.exportAttendanceSessionDocx(sessionId)
            : await lecturerApi.exportAttendanceSessionPdf(sessionId);

      downloadBlob(
        response.data,
        getFilenameFromDisposition(
          response.headers["content-disposition"],
          format === "csv" ? "attendance-session.csv" : format === "docx" ? "attendance-session.docx" : "attendance-session.pdf",
        ),
      );
      toast.success(`Attendance ${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const captureLocation = async () => {
    setLocationState("capturing");
    setLocationStatusText("Requesting browser location access...");
    setIsResolvingVenue(false);
    try {
      const location = await getRobustUserLocation({
        onStatusChange: (status) => setLocationStatusText(status),
      });
      setForm((current) => ({
        ...current,
        latitude: String(location.lat),
        longitude: String(location.lng),
      }));
      setLocationAccuracy(location.accuracy);
      setLocationState("ready");
      setLocationStatusText("Location captured. Resolving nearby place details...");
      setIsResolvingVenue(true);

      try {
        const venue = await reverseGeocodeCoordinates(location.lat, location.lng);
        if (venue) {
          setDetectedVenueLabel(venue.shortLabel);
          setDetectedVenueDisplayName(venue.displayName);
          setForm((current) => ({
            ...current,
            roomLabel: current.roomLabel.trim() ? current.roomLabel : venue.shortLabel,
          }));
          setLocationStatusText(`Map pinned near ${venue.shortLabel}. Update the room label if you want a more exact classroom name.`);
        } else {
          setDetectedVenueLabel("");
          setDetectedVenueDisplayName("");
          setLocationStatusText("Location pinned on the map. Add the building or room label you want to show to students.");
        }
      } catch {
        setDetectedVenueLabel("");
        setDetectedVenueDisplayName("");
        setLocationStatusText("Location pinned on the map. Add the building or room label you want to show to students.");
      } finally {
        setIsResolvingVenue(false);
      }
    } catch (error) {
      setLocationState("error");
      setLocationAccuracy(null);
      setDetectedVenueLabel("");
      setDetectedVenueDisplayName("");
      setIsResolvingVenue(false);
      setLocationStatusText(error instanceof Error ? error.message : "Unable to capture location.");
    }
  };

  const liveStudentPoints: AttendanceStudentPoint[] = useMemo(
    () => {
      if (!liveView) return [];

      const points = new Map<string, AttendanceStudentPoint>();

      liveView.presences
        ?.filter((presence) => typeof presence.latitude === "number" && typeof presence.longitude === "number")
        .forEach((presence) => {
          points.set(presence._id, {
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
          });
        });

      liveView.records
        ?.filter((record) => typeof record.latitude === "number" && typeof record.longitude === "number")
        .forEach((record) => {
          const fallbackId = `record-${record._id}`;
          const alreadyPresent = Array.from(points.values()).some(
            (point) => point.matricNumber && point.matricNumber === record.student?.matricNumber,
          );

          if (alreadyPresent) return;

          points.set(fallbackId, {
            id: fallbackId,
            name: record.student?.fullName || "Unknown student",
            matricNumber: record.student?.matricNumber || undefined,
            latitude: record.latitude!,
            longitude: record.longitude!,
            trail: [{ latitude: record.latitude!, longitude: record.longitude! }],
            distanceFromSession: record.distanceFromSession,
            accuracy: record.accuracy,
            status: "submitted",
            lastSeenAt: record.submittedAt ? formatDate(record.submittedAt, true) : record.createdAt ? formatDate(record.createdAt, true) : undefined,
            connectionState: "live",
          });
        });

      return Array.from(points.values());
    },
    [liveView, presenceTrails],
  );

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Attendance"
        title="Attendance dashboard"
        description="Monitor the live class map first, then start a new session with a visual location preview and pinned venue context."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Start attendance session
          </Button>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-5xl lg:max-w-6xl">
          <DialogHeader>
            <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#eff5ff_0%,#ffffff_60%,#fff6e8_100%)] p-5 sm:p-6">
              <p className="heading-kicker text-[var(--primary)]">Session launcher</p>
              <DialogTitle className="mt-2 text-2xl sm:text-[2rem]">Start attendance session</DialogTitle>
              <DialogDescription className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
                Capture your location, verify the place visually on the map, and then launch the session. The map preview becomes the same geofence map used to monitor joined student devices.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-5">
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <p className="heading-kicker text-slate-500">Session details</p>
                <div className="mt-4 space-y-4">
                  <LabeledField label="Course">
                    <CourseSelect courses={courses} value={form.courseId} onChange={(value) => setForm((current) => ({ ...current, courseId: value }))} />
                  </LabeledField>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    <LabeledField label="Session duration (minutes)">
                      <Input type="number" min="5" max="180" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} />
                    </LabeledField>
                    <LabeledField label="Attendance radius (meters)">
                      <Input type="number" min="5" max="5000" value={form.radius} onChange={(event) => setForm((current) => ({ ...current, radius: event.target.value }))} />
                    </LabeledField>
                  </div>
                  <LabeledField label="Building / room label">
                    <Input value={form.roomLabel} onChange={(event) => setForm((current) => ({ ...current, roomLabel: event.target.value }))} placeholder="Example: Engineering Block A, Room 204" />
                  </LabeledField>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="heading-kicker text-slate-500">Location capture</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Give location permission once, then use the map preview to confirm the exact area before the class goes live.
                    </p>
                  </div>
                  <Badge tone={locationState === "ready" ? "success" : locationState === "error" ? "danger" : "warning"}>{locationState}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="secondary" onClick={captureLocation} disabled={locationState === "capturing"} className="min-w-[220px]">
                    <LocateFixed className="mr-2 h-4 w-4" />
                    {locationState === "capturing" ? "Capturing location..." : "Use my current location"}
                  </Button>
                  {isResolvingVenue ? <Badge tone="info">Detecting nearby place</Badge> : null}
                </div>
                {locationStatusText ? <p className="mt-3 text-sm text-slate-600">{locationStatusText}</p> : null}
                {typeof locationAccuracy === "number" ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">GPS accuracy approx. {Math.round(locationAccuracy)} meters</p>
                ) : null}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <LabeledField label="Latitude">
                    <Input type="number" value={form.latitude} readOnly />
                  </LabeledField>
                  <LabeledField label="Longitude">
                    <Input type="number" value={form.longitude} readOnly />
                  </LabeledField>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createSession.mutate()} disabled={createSession.isPending || !form.courseId || locationState !== "ready"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start session now
                </Button>
              </div>
            </div>

            <div className="rounded-[22px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-5 shadow-[0_18px_40px_rgba(37,90,200,0.10)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="heading-kicker text-[var(--primary)]">Location preview</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Confirm the pinned session area</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    This map becomes the lecturer’s live attendance monitor. The blue marker is the lecturer location, and the circle is the active join radius for students.
                  </p>
                </div>
                <div className="rounded-[16px] bg-white/85 px-4 py-3 text-right shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Launch settings</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {form.durationMinutes || "0"} minutes • {form.radius || "0"} meters
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {hasCapturedLocation ? (
                  <AttendanceGeofenceMap
                    latitude={Number(form.latitude)}
                    longitude={Number(form.longitude)}
                    radius={Number(form.radius || 50)}
                    venueLabel={form.roomLabel || detectedVenueLabel || "Session location"}
                    studentPoints={[]}
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center rounded-[20px] border border-dashed border-blue-200 bg-white/70 text-center">
                    <div className="max-w-sm space-y-3 px-6">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[var(--primary)]">
                        <MapPinned className="h-6 w-6" />
                      </div>
                      <p className="text-base font-semibold text-slate-900">The session map will appear here</p>
                      <p className="text-sm leading-6 text-slate-600">
                        Use the location button on the left and this panel will switch to a real map with your pinned coordinates and geofence radius.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[16px] bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Detected place</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {isResolvingVenue ? "Resolving nearby place..." : detectedVenueLabel || "No detected venue yet"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {detectedVenueDisplayName || "Reverse geocoding will show the nearest recognizable building or road context after location capture."}
                  </p>
                </div>
                <div className="rounded-[16px] bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Course</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {courses.find((course) => course.course._id === form.courseId)?.course.title || "Select a course"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {courses.find((course) => course.course._id === form.courseId)?.course.code || "No course selected"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={GraduationCap} title="Active sessions" value={activeSessions.length} tone="success" />
        <StatCard icon={BookOpen} title="Tracked sessions" value={sessions.length} tone="info" />
        <StatCard icon={Users} title="Courses" value={courses.length} tone="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live session map</CardTitle>
          <CardDescription>Joined student devices appear here before submission, and submitted attendance stays on the same map.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledField label="Monitor session">
            <select className="portal-select" value={activeLiveSessionId} onChange={(event) => setLiveSessionId(event.target.value)}>
              <option value="">Choose session to monitor</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {getCourseName(session.course)} - {session.sessionCode}
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
              {liveView.session.status === "active" ? (
                <div className="flex justify-end">
                  <Button onClick={() => endSession.mutate(liveView.session._id)} disabled={endSession.isPending}>
                    End session now
                  </Button>
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Users} title="Joined devices" value={liveView.summary.joinedCount} tone="info" />
                <StatCard icon={GraduationCap} title="Submitted" value={liveView.summary.submittedCount} tone="success" />
                <StatCard icon={TimerReset} title="Joined not submitted" value={liveView.summary.joinedNotSubmittedCount} tone="warning" />
                <StatCard icon={Radar} title="Outside geofence" value={liveView.summary.outsideGeofenceCount} tone="danger" />
              </div>
              <AttendanceGeofenceMap
                latitude={liveView.session.latitude}
                longitude={liveView.session.longitude}
                radius={liveView.session.radius}
                venueLabel={liveView.session.roomLabel || liveView.session.detectedVenueLabel}
                studentPoints={liveStudentPoints}
              />
            </>
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-slate-600">
              No live session selected. Choose a session above to watch joined devices and submissions.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session history and actions</CardTitle>
          <CardDescription>Cancel sessions and export the list of successful submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length ? (
            sessions.map((session) => (
              <div key={session._id} className="rounded-[18px] border border-[var(--border)] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{getCourseName(session.course)}</p>
                      <Badge tone={session.status === "active" ? "success" : session.status === "cancelled" ? "danger" : "neutral"}>{session.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {getCourseCode(session.course)} • Session code {session.sessionCode}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatDate(session.startTime, true)} to {formatDate(session.endTime, true)}
                    </p>
                    <p className="text-sm text-slate-600">{session.roomLabel || session.detectedVenueLabel || "No room label provided"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setLiveSessionId(session._id)}>
                      Watch live map
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => exportSession(session._id, "pdf")}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => exportSession(session._id, "docx")}>
                      <Download className="mr-2 h-4 w-4" />
                      DOCX
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => exportSession(session._id, "csv")}>
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    {session.status === "active" ? (
                      <>
                        <Button size="sm" onClick={() => endSession.mutate(session._id)} disabled={endSession.isPending}>
                          End session
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => cancelSession.mutate(session._id)} disabled={cancelSession.isPending}>
                          Cancel session
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-slate-600">
              No attendance sessions found yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance percentages</CardTitle>
          <CardDescription>Track each student’s attendance percentage for any course at any point.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LabeledField label="Course report">
            <CourseSelect courses={courses} value={activeReportCourseId} onChange={setReportCourseId} />
          </LabeledField>

          {attendanceReport ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={BookOpen} title="Total sessions" value={attendanceReport.totalSessions} tone="info" />
                <StatCard icon={Users} title="Enrolled students" value={attendanceReport.enrolledStudents} tone="warning" />
                <StatCard icon={GraduationCap} title="Average attendance" value={`${Math.round(attendanceReport.averageAttendancePercentage)}%`} tone="success" />
                <StatCard icon={Radar} title="Below threshold" value={attendanceReport.studentsBelowThreshold} tone="danger" />
              </div>

              <div className="overflow-hidden rounded-[20px] border border-[var(--border)]">
                <div className="grid grid-cols-[minmax(0,1.4fr)_120px_120px_120px] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>Student</span>
                  <span>Submitted</span>
                  <span>Missed</span>
                  <span>Attendance</span>
                </div>
                {attendanceReport.students.map((student) => (
                  <div key={student.student._id} className="grid grid-cols-[minmax(0,1.4fr)_120px_120px_120px] border-t border-[var(--border)] px-4 py-3 text-sm text-slate-700">
                    <div>
                      <p className="font-medium text-slate-900">{student.student.fullName}</p>
                      <p className="text-xs text-slate-500">{student.student.matricNumber || student.student.email || "--"}</p>
                    </div>
                    <span>{student.submittedSessions}</span>
                    <span>{student.missedSessions}</span>
                    <span className="font-semibold text-slate-900">{Math.round(student.attendancePercentage)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-slate-600">
              No attendance percentage report available yet for this course.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
