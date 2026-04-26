"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, MessageSquare, SendHorizontal, Users } from "lucide-react";
import { toast } from "sonner";

import { communicationApi } from "@/src/api/communication";
import { lecturerApi } from "@/src/api/lecturer";
import { Alert } from "@/src/components/ui/alert";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { PageIntro } from "@/src/components/ui/page-intro";
import { Pagination } from "@/src/components/ui/pagination";
import { StatCard } from "@/src/components/ui/stat-card";
import { Textarea } from "@/src/components/ui/textarea";
import { useAuthStore } from "@/src/store/auth-store";
import type { Course, MessageThreadSummary, User } from "@/src/types/domain";
import { getErrorMessage } from "@/src/utils/error";
import { formatDate } from "@/src/utils/format";

type AudienceMode = "course" | "cohort";
type AudienceStudent = Pick<User, "_id" | "fullName" | "email" | "matricNumber" | "department" | "level">;
type AudiencePayload =
  | AudienceStudent[]
  | {
      course: Pick<Course, "_id" | "code" | "title" | "department" | "level">;
      approvedStudents: AudienceStudent[];
      cohortStudents: AudienceStudent[];
    };

function buildDirectThreadKey(courseId: string, lecturerId: string, studentId: string) {
  return `course-${courseId}-${[lecturerId, studentId].sort().join("-")}`;
}

function getOtherParticipants(thread: MessageThreadSummary, userId?: string) {
  return (
    thread.participants
      ?.filter((participant) => participant._id !== userId)
      .map((participant) => participant.fullName)
      .filter(Boolean)
      .join(", ") || thread.course?.code || "Course thread"
  );
}

function getThreadCourse(
  thread?: MessageThreadSummary,
  courses: Array<{ course: Pick<Course, "_id" | "code" | "title"> }> = [],
) {
  if (thread?.course) return thread.course;
  return courses.find((item) => thread?.threadKey?.includes(item.course._id))?.course || null;
}

function getThreadTitle(thread?: MessageThreadSummary, courses: Array<{ course: Pick<Course, "_id" | "code" | "title"> }> = []) {
  const course = getThreadCourse(thread, courses);
  return course?.code || course?.title || "Course thread";
}

function isLecturerSender(message: { sender?: Pick<User, "_id" | "fullName" | "email" | "role"> }, currentUserId?: string) {
  return message.sender?.role === "lecturer" || message.sender?._id === currentUserId;
}

export function DedicatedLecturerMessagesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [selectedThread, setSelectedThread] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [courseId, setCourseId] = useState("");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("course");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [composeBody, setComposeBody] = useState("");

  const coursesQuery = useQuery({
    queryKey: ["lecturer", "courses"],
    queryFn: lecturerApi.courses,
  });

  const audienceQuery = useQuery({
    queryKey: ["lecturer", "message-audience", courseId],
    queryFn: () => lecturerApi.courseStudents(courseId),
    enabled: Boolean(courseId),
  });

  const threadsQuery = useQuery({
    queryKey: ["lecturer", "communication", "threads", page],
    queryFn: () => communicationApi.threads(page),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const messagesQuery = useQuery({
    queryKey: ["lecturer", "communication", "thread", selectedThread],
    queryFn: () => communicationApi.threadMessages(selectedThread),
    enabled: Boolean(selectedThread),
    refetchInterval: selectedThread ? 3000 : false,
    refetchOnWindowFocus: true,
  });

  const courses = coursesQuery.data?.data || [];
  const audiencePayload = audienceQuery.data?.data as AudiencePayload | undefined;
  const approvedStudents = Array.isArray(audiencePayload) ? audiencePayload : audiencePayload?.approvedStudents || [];
  const cohortStudents = Array.isArray(audiencePayload) ? audiencePayload : audiencePayload?.cohortStudents || [];
  const audienceStudents = audienceMode === "cohort" ? cohortStudents : approvedStudents;
  const threads = threadsQuery.data?.data.items || [];
  const selectedThreadSummary = threads.find((thread) => thread.threadKey === selectedThread);
  const messages = messagesQuery.data?.data.items || [];
  const unreadCount = threads.reduce((total, thread) => total + (thread.unreadCount || 0), 0);
  const recipientCount = recipientIds.length || audienceStudents.length;

  useEffect(() => {
    setRecipientIds(audienceStudents.map((student) => student._id));
  }, [audienceMode, courseId, audiencePayload]);

  useEffect(() => {
    if (!selectedThread) return;
    communicationApi.markAsRead(selectedThread).then(() => {
      queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "threads"] });
    });
  }, [queryClient, selectedThread]);

  const composeMessage = useMutation({
    mutationFn: async () => {
      if (!user?._id) throw new Error("Lecturer profile could not be resolved.");
      if (!courseId || !composeBody.trim()) throw new Error("Choose a course and enter a message.");

      const resolvedRecipients = audienceStudents.length ? recipientIds : [];
      const targetAudience = audienceMode === "cohort" ? "department_level" : "course_approved";

      return lecturerApi.sendMessage({
        threadKey:
          resolvedRecipients.length === 1
            ? buildDirectThreadKey(courseId, user._id, resolvedRecipients[0])
            : `course-broadcast-${courseId}-${Date.now()}`,
        recipientIds: resolvedRecipients,
        targetAudience,
        courseId,
        body: composeBody.trim(),
      });
    },
    onSuccess: async (response) => {
      const nextThreadKey = response.data.threadKey;
      toast.success("Message sent");
      setComposeBody("");
      setPage(1);
      setSelectedThread(response.data.recipients?.length === 1 ? nextThreadKey : "");
      await Promise.all([
        threadsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "threads"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "thread", nextThreadKey] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      const resolvedRecipients = Array.from(
        new Set(
          messages
            .flatMap((message) => [
              message.sender?._id,
              ...(message.recipients?.map((recipient) => recipient._id) || []),
            ])
            .filter((id): id is string => Boolean(id) && id !== user?._id),
        ),
      );

      if (!selectedThread || !replyBody.trim()) throw new Error("Select a thread and enter a reply.");
      if (!resolvedRecipients.length) throw new Error("No valid recipient was found for this thread.");

      return lecturerApi.sendMessage({
        threadKey: selectedThread,
        recipientIds: resolvedRecipients,
        courseId: selectedThreadSummary?.course?._id,
        body: replyBody.trim(),
      });
    },
    onSuccess: async () => {
      toast.success("Reply sent");
      setReplyBody("");
      await Promise.all([
        messagesQuery.refetch(),
        threadsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "threads"] }),
        queryClient.invalidateQueries({ queryKey: ["lecturer", "communication", "thread", selectedThread] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const selectedCourse = useMemo(
    () => courses.find((item) => item.course._id === courseId)?.course,
    [courseId, courses],
  );

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Messages"
        title="Lecturer inbox"
        description="Start class messages, read replies, and keep conversations in course context."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={MessageSquare} title="Threads" value={threads.length} tone="info" />
        <StatCard icon={Users} title="Unread" value={unreadCount} tone="warning" />
        <StatCard icon={BookOpen} title="Messages in thread" value={messages.length} tone="primary" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New message</CardTitle>
            <CardDescription>Choose a course audience and send a message.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Course</label>
              <select
                className="portal-select"
                value={courseId}
                onChange={(event) => {
                  setCourseId(event.target.value);
                  setAudienceMode("course");
                  setRecipientIds([]);
                }}
              >
                <option value="">Select course</option>
                {courses.map((item) => (
                  <option key={item._id} value={item.course._id}>
                    {item.course.code} - {item.course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAudienceMode("course")}
                disabled={!courseId}
                className={`rounded-lg border p-3 text-left transition ${
                  audienceMode === "course" ? "border-[#255ac8] bg-[#f5f8ff]" : "border-[var(--border)] bg-white"
                }`}
              >
                <p className="font-medium text-slate-900">Course students</p>
                <p className="mt-1 text-sm text-slate-600">Approved students in this course.</p>
              </button>
              <button
                type="button"
                onClick={() => setAudienceMode("cohort")}
                disabled={!courseId}
                className={`rounded-lg border p-3 text-left transition ${
                  audienceMode === "cohort" ? "border-[#255ac8] bg-[#f5f8ff]" : "border-[var(--border)] bg-white"
                }`}
              >
                <p className="font-medium text-slate-900">Department level</p>
                <p className="mt-1 text-sm text-slate-600">All students in the same department and year.</p>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-medium text-slate-700">Message</label>
                <Badge tone={recipientCount ? "success" : "info"}>
                  {recipientCount || "Server"} recipients
                </Badge>
              </div>
              <Textarea
                value={composeBody}
                onChange={(event) => setComposeBody(event.target.value)}
                placeholder="Write your message here"
                className="min-h-[140px]"
              />
              <Button
                className="w-full"
                onClick={() => composeMessage.mutate()}
                disabled={composeMessage.isPending || !courseId || !composeBody.trim()}
              >
                <SendHorizontal className="mr-2 h-4 w-4" />
                {composeMessage.isPending ? "Sending..." : "Send message"}
              </Button>
            </div>

            {courseId ? (
              <div className="rounded-lg border border-[var(--border)] bg-[#fbfcfe] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {audienceMode === "cohort" ? "Department level audience" : "Approved course audience"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedCourse?.code || "Course"} {selectedCourse?.level ? `.${selectedCourse.level} level` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setRecipientIds(audienceStudents.map((student) => student._id))}
                      disabled={!audienceStudents.length}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRecipientIds([])}
                      disabled={!recipientIds.length}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {audienceStudents.map((student) => (
                    <label key={student._id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] bg-white p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-[#255ac8]"
                        checked={recipientIds.includes(student._id)}
                        onChange={(event) => {
                          setRecipientIds((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, student._id]))
                              : current.filter((id) => id !== student._id),
                          );
                        }}
                      />
                      <span>
                        <span className="block font-medium text-slate-900">{student.fullName}</span>
                        <span className="block text-sm text-slate-600">{student.matricNumber || student.email}</span>
                      </span>
                    </label>
                  ))}
                  {!audienceStudents.length ? (
                    <p className="text-sm text-slate-600">
                      Recipient preview is unavailable. Sending will use the selected audience on the server.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="border-t border-[var(--border)] pt-4">
              <p className="font-semibold text-slate-900">Inbox</p>
              <p className="text-sm text-slate-600">Open a thread to read and reply.</p>
              <div className="mt-3 space-y-3">
                {threads.length ? (
                  threads.map((thread) => (
                    <button
                      key={thread.threadKey}
                      type="button"
                      onClick={() => setSelectedThread(thread.threadKey)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selectedThread === thread.threadKey ? "border-[#255ac8] bg-[#f5f8ff]" : "border-[var(--border)] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">{getThreadTitle(thread, courses)}</p>
                        {thread.unreadCount ? <Badge tone="warning">{thread.unreadCount}</Badge> : null}
                      </div>
                      {getThreadCourse(thread, courses)?.title ? (
                        <p className="mt-1 text-sm font-medium text-slate-700">{getThreadCourse(thread, courses)?.title}</p>
                      ) : null}
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                        {getOtherParticipants(thread, user?._id)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{thread.latestMessage?.body || "No message preview"}</p>
                    </button>
                  ))
                ) : (
                  <Alert variant="info">No message threads yet.</Alert>
                )}
                <Pagination
                  page={threadsQuery.data?.data.page || 1}
                  totalPages={threadsQuery.data?.data.totalPages || 1}
                  onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
                  onNext={() => setPage((current) => current + 1)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thread detail</CardTitle>
            <CardDescription>
              {selectedThread
                ? `Reply in ${getThreadTitle(selectedThreadSummary, courses)}${selectedThreadSummary ? ` with ${getOtherParticipants(selectedThreadSummary, user?._id)}` : ""}.`
                : "Choose a thread to view messages."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedThread ? (
              <>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message._id} className="rounded-lg border border-[var(--border)] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{message.sender?.fullName || "Sender"}</p>
                          {isLecturerSender(message, user?._id) ? <Badge tone="info">Lecturer</Badge> : null}
                        </div>
                        <p className="text-xs text-slate-500">{formatDate(message.createdAt, true)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{message.body}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[#fbfcfe] p-4">
                  <p className="mb-3 text-sm font-medium text-slate-800">Reply</p>
                  <div className="space-y-3">
                    <Textarea placeholder="Write your reply" value={replyBody} onChange={(event) => setReplyBody(event.target.value)} />
                    <Button onClick={() => sendReply.mutate()} disabled={sendReply.isPending || !replyBody.trim()}>
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
