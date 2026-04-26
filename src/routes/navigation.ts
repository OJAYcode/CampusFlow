import {
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const studentNav = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Profile", href: "/student/profile", icon: Users },
  { label: "Enrollments", href: "/student/enrollments", icon: BookOpen },
  { label: "Electives", href: "/student/electives", icon: ClipboardList },
  { label: "Materials", href: "/student/materials", icon: FileText },
  { label: "Assignments", href: "/student/assignments", icon: FileText },
  { label: "Assessments", href: "/student/assessments", icon: ShieldCheck },
  { label: "Attendance", href: "/student/attendance", icon: GraduationCap },
  { label: "Announcements", href: "/student/announcements", icon: Bell },
  { label: "Messages", href: "/student/messages", icon: MessageSquare },
];

export const lecturerNav = [
  { label: "Dashboard", href: "/staff/lecturer", icon: LayoutDashboard },
  { label: "Courses", href: "/staff/lecturer/courses", icon: BookOpen },
  { label: "Attendance", href: "/staff/lecturer/attendance", icon: GraduationCap },
  { label: "Materials", href: "/staff/lecturer/materials", icon: FileText },
  { label: "Assignments", href: "/staff/lecturer/assignments", icon: ClipboardList },
  { label: "Assessments", href: "/staff/lecturer/assessments", icon: ShieldCheck },
  { label: "Announcements", href: "/staff/lecturer/announcements", icon: Bell },
  { label: "Messages", href: "/staff/lecturer/messages", icon: MessageSquare },
];

export const adminNav = [
  { label: "Dashboard", href: "/staff/admin", icon: LayoutDashboard },
  { label: "Faculties", href: "/staff/admin/faculties", icon: Building2 },
  { label: "Departments", href: "/staff/admin/departments", icon: Building2 },
  { label: "Courses", href: "/staff/admin/courses", icon: BookOpen },
  { label: "Student Roster", href: "/staff/admin/seeded-students", icon: Users },
  { label: "Students", href: "/staff/admin/students", icon: Users },
  { label: "Lecturer Roster", href: "/staff/admin/seeded-lecturers", icon: Users },
  { label: "Lecturers", href: "/staff/admin/lecturers", icon: Users },
  { label: "Admin Users", href: "/staff/admin/admin-users", icon: ShieldCheck },
  { label: "Elective Approvals", href: "/staff/admin/elective-approvals", icon: ClipboardList },
  { label: "Attendance Sessions", href: "/staff/admin/attendance/sessions", icon: GraduationCap },
  { label: "Attendance Records", href: "/staff/admin/attendance/records", icon: GraduationCap },
  { label: "Materials", href: "/staff/admin/materials", icon: FileText },
  { label: "Assignments", href: "/staff/admin/assignments", icon: ClipboardList },
  { label: "Assessment Attempts", href: "/staff/admin/assessment-attempts", icon: ShieldCheck },
  { label: "Communications", href: "/staff/admin/communications", icon: MessageSquare },
  { label: "Audit Logs", href: "/staff/admin/audit-logs", icon: Bell },
  { label: "Reports", href: "/staff/admin/reports", icon: FileText },
  { label: "Settings", href: "/staff/admin/settings", icon: Settings },
];
