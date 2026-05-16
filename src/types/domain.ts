import type { Role } from "@/src/lib/constants";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AcademicUnit {
  _id: string;
  name: string;
  code?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  status: "active" | "inactive" | "suspended";
  phone?: string;
  employeeId?: string;
  matricNumber?: string;
  faculty?: AcademicUnit | string | null;
  department?: AcademicUnit | string | null;
  level?: number | null;
  emailVerified?: boolean;
  profile?: Record<string, unknown>;
  lastLoginAt?: string;
}

export interface SeededLecturer {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  faculty?: AcademicUnit | string | null;
  department?: AcademicUnit | string | null;
  isActivated?: boolean;
  createdAt?: string;
}

export interface Course {
  _id: string;
  code: string;
  title: string;
  faculty?: AcademicUnit | string;
  department?: AcademicUnit | string;
  level?: number;
  semester?: "first" | "second";
  academicSession?: string;
  courseType?: "core" | "elective";
}

export interface Enrollment {
  _id: string;
  course: Course;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  createdAt?: string;
}

export interface Material {
  _id: string;
  course?: Course;
  title: string;
  description?: string;
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  visibility?: "enrolled_students" | "lecturers_only" | "public_course";
  createdAt?: string;
}

export interface OnlineMaterialResult {
  id: string;
  title: string;
  authors: string[];
  year?: number | null;
  source: string;
  sourceUrl: string;
  coverImageUrl?: string | null;
  availabilityLabel: string;
}

export interface Assignment {
  _id: string;
  course?: Course;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  totalMarks?: number;
  attachmentUrls?: string[];
  status?: string;
  submission?: AssignmentSubmission | null;
}

export interface AssignmentSubmission {
  _id: string;
  assignment?: string;
  student?: Pick<User, "_id" | "fullName" | "matricNumber">;
  submissionText?: string;
  attachmentUrls?: string[];
  grade?: number | null;
  feedback?: string | null;
  status?: string;
  submittedAt?: string;
}

export interface Assessment {
  _id: string;
  course?: Course;
  lecturer?: Pick<User, "_id" | "fullName">;
  title: string;
  instructions?: string;
  assessmentType: "quiz" | "test" | "exam";
  totalMarks?: number;
  durationMinutes: number;
  availableFrom: string;
  availableTo: string;
  shuffleQuestions?: boolean;
  allowMultipleAttempts?: boolean;
  status?: string;
}

export interface AssessmentQuestion {
  _id: string;
  questionText: string;
  questionType: "multiple_choice" | "short_answer";
  options: string[];
  correctAnswer?: string | number | boolean;
  marks?: number;
  order?: number;
}

export interface AssessmentAttemptProctoring {
  cameraGranted?: boolean;
  microphoneGranted?: boolean;
  tabSwitchCount?: number;
  windowBlurCount?: number;
  penaltyLockUntil?: string;
  penaltyCount?: number;
  totalPenaltyMs?: number;
  lastVisibilityChangeAt?: string;
  latestSnapshotDataUrl?: string;
  micLevel?: number;
  updatedAt?: string;
}

export interface AssessmentAttemptAnswer {
  question?: Pick<AssessmentQuestion, "_id" | "questionText" | "questionType" | "options" | "correctAnswer" | "marks" | "order"> | string;
  answer?: string | number | boolean | null;
  isCorrect?: boolean;
  awardedMarks?: number;
}

export interface AssessmentAttempt {
  _id: string;
  assessment?: Assessment;
  student?: Pick<User, "_id" | "fullName" | "matricNumber">;
  status: "in_progress" | "submitted" | "graded";
  score?: number;
  startedAt?: string;
  lastResumedAt?: string;
  remainingTimeMs?: number;
  submittedAt?: string;
  answers?: AssessmentAttemptAnswer[];
  proctoring?: AssessmentAttemptProctoring;
}

export interface AssessmentDetailResponse {
  assessment: Assessment;
  questions: AssessmentQuestion[];
  attempt?: AssessmentAttempt | null;
}

export interface AttendanceSession {
  _id: string;
  course?: Course;
  lecturer?: Pick<User, "_id" | "fullName">;
  sessionCode: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
   locationAccuracy?: number;
  radius: number;
  roomLabel?: string;
  detectedVenueLabel?: string;
  venueDetectionSource?: string;
  buildingProfile?: string;
  strictMode?: boolean;
  faceVerificationEnabled?: boolean;
  status: "active" | "inactive" | "expired" | "cancelled";
}

export interface AttendanceRecord {
  _id: string;
  course?: Course;
  session?: AttendanceSession;
  student?: Pick<User, "_id" | "fullName" | "matricNumber">;
  createdAt?: string;
  submittedAt?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  distanceFromClassMeters?: number;
  distanceFromSession?: number;
}

export interface AttendancePresence {
  _id: string;
  course?: Course;
  session?: AttendanceSession;
  student?: Pick<User, "_id" | "fullName" | "matricNumber"> & { email?: string | null };
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  distanceFromSession?: number;
  insideGeofence?: boolean;
  joinedAt?: string;
  lastSeenAt?: string;
  submittedAttendance?: boolean;
  submittedAt?: string;
  connectionState?: "live" | "stale";
  freshnessMs?: number;
}

export interface AttendanceSessionLiveView {
  session: AttendanceSession;
  records: AttendanceRecord[];
  presences: AttendancePresence[];
  summary: {
    totalEnrolled: number;
    joinedCount: number;
    submittedCount: number;
    joinedNotSubmittedCount: number;
    outsideGeofenceCount: number;
    staleCount: number;
  };
}

export interface CourseAttendancePercentage {
  student: Pick<User, "_id" | "fullName" | "matricNumber"> & { email?: string | null };
  submittedSessions: number;
  missedSessions: number;
  attendancePercentage: number;
  successfulSubmissions: Array<{
    _id: string;
    submittedAt?: string;
    session?: Pick<AttendanceSession, "_id" | "sessionCode" | "startTime" | "endTime" | "status">;
  }>;
}

export interface CourseAttendancePercentageReport {
  courseId: string;
  totalSessions: number;
  enrolledStudents: number;
  averageAttendancePercentage: number;
  studentsMeetingThreshold: number;
  studentsBelowThreshold: number;
  students: CourseAttendancePercentage[];
}

export interface Announcement {
  _id: string;
  course?: Course;
  sender?: Pick<User, "_id" | "fullName">;
  title: string;
  body: string;
  attachmentUrls?: string[];
  createdAt?: string;
}

export interface Message {
  _id: string;
  threadKey: string;
  course?: Course | null;
  sender?: Pick<User, "_id" | "fullName" | "email" | "role">;
  recipients?: Array<Pick<User, "_id" | "fullName" | "email" | "role">>;
  body: string;
  attachmentUrls?: string[];
  readBy?: Array<{ user?: string; readAt?: string }>;
  createdAt?: string;
}

export interface MessageThreadSummary {
  threadKey: string;
  course?: Course | null;
  latestMessage: Message;
  latestMessageAt: string;
  participants: Array<Pick<User, "_id" | "fullName" | "email" | "role">>;
  unreadCount: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
