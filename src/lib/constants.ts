import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, Building2, GraduationCap, MessageSquare, ShieldCheck } from "lucide-react";

export type Role = "student" | "lecturer" | "admin" | "super_admin";

export const APP_FEATURES: Array<{
  title: string;
  description: string;
  icon?: LucideIcon;
}> = [
  {
    title: "Attendance integrity",
    description:
      "Secure attendance sessions with geolocation, device fingerprint support, and transparent student feedback.",
    icon: GraduationCap,
  },
  {
    title: "Course workspaces",
    description:
      "Dedicated lecturer workspaces for announcements, assignments, materials, assessments, submissions, and reports.",
    icon: BookOpen,
  },
  {
    title: "Academic administration",
    description:
      "Faculty, department, course, seeded student, lecturer, and reporting tools in one operational surface.",
    icon: Building2,
  },
  {
    title: "Operational visibility",
    description:
      "Unified dashboards, tables, exports, and communications for day-to-day academic coordination.",
    icon: BarChart3,
  },
];

export const STUDENT_PORTAL_FEATURES: Array<{
  title: string;
  description: string;
  icon?: LucideIcon;
}> = [
  {
    title: "Attendance and course access",
    description: "Submit secure attendance, view enrolled courses, and follow approved elective pathways.",
    icon: GraduationCap,
  },
  {
    title: "Assignments and assessments",
    description: "Track deadlines, submit coursework, and complete timed assessments inside a single student workspace.",
    icon: ShieldCheck,
  },
  {
    title: "Academic communication",
    description: "Stay current with course announcements, lecturer messages, and operational reminders.",
    icon: MessageSquare,
  },
];

export const STAFF_PORTAL_FEATURES: Array<{
  title: string;
  description: string;
  icon?: LucideIcon;
}> = [
  {
    title: "Lecturer teaching workspace",
    description: "Manage course materials, assignments, assessments, announcements, attendance sessions, and grading.",
    icon: BookOpen,
  },
  {
    title: "Administrative operations",
    description: "Oversee faculties, departments, courses, seeded records, communications, and institutional reporting.",
    icon: Building2,
  },
  {
    title: "Oversight and reporting",
    description: "Track academic activity, attendance performance, communication health, and course-level exports.",
    icon: BarChart3,
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  lecturer: "Lecturer",
  admin: "Administrator",
  super_admin: "Super Admin",
};

export const LOGIN_ROUTES: Record<Role, string> = {
  student: "/login/student",
  lecturer: "/login/lecturer",
  admin: "/login/admin",
  super_admin: "/login/admin",
};

export const ROLE_HOME_ROUTES: Record<Role, string> = {
  student: "/student",
  lecturer: "/staff/lecturer",
  admin: "/staff/admin",
  super_admin: "/staff/admin",
};
