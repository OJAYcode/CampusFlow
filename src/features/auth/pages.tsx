/* eslint-disable simple-import-sort/imports */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Download,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserSquare2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, type FormEventHandler } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { requestPasswordReset, resetPassword } from "@/src/api/auth";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { ROLE_HOME_ROUTES, type Role } from "@/src/lib/constants";
import { useAuthStore } from "@/src/store/auth-store";
import { cn } from "@/src/utils/cn";
import { getErrorMessage } from "@/src/utils/error";

const studentPortalUrl =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ?? "http://localhost:3000";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const studentRegisterSchema = z.object({
  matricNumber: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const lecturerRegisterSchema = z.object({
  employeeId: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8),
});

type AuthTone = "student" | "lecturer" | "admin" | "generic";
type LoginValues = z.infer<typeof loginSchema>;

const AUTH_SIDE_PANEL_BLUE = "bg-[linear-gradient(145deg,#3d42a8_0%,#353b96_48%,#2f327d_100%)]";
const AUTH_SIDE_PANEL_GLOW = "bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_68%)]";

function getAuthTheme(tone: AuthTone) {
  if (tone === "student") {
    return {
      panel: AUTH_SIDE_PANEL_BLUE,
      panelGlow: AUTH_SIDE_PANEL_GLOW,
      chip: "bg-white/14 text-white",
      highlight: "text-[#f48c06]",
      button: "!bg-[#2f327d] !text-white !hover:bg-[#252862]",
      inputFocus: "focus:border-[#2f327d] focus:ring-[rgba(47,50,125,0.18)]",
      portalLabel: "Student Portal",
      heroTitle: "Student access for courses, attendance, and class updates.",
      heroCopy:
        "Sign in to view your courses, submit attendance, check assignments, and read class notices.",
    };
  }

  if (tone === "lecturer") {
    return {
      panel: AUTH_SIDE_PANEL_BLUE,
      panelGlow: AUTH_SIDE_PANEL_GLOW,
      chip: "bg-white/14 text-white",
      highlight: "text-[#f48c06]",
      button: "!bg-[#2f327d] !text-white !hover:bg-[#252862]",
      inputFocus: "focus:border-[#2f327d] focus:ring-[rgba(47,50,125,0.18)]",
      portalLabel: "Lecturer Portal",
      heroTitle: "Lecturer access for course delivery and class management.",
      heroCopy:
        "Manage courses, attendance sessions, teaching materials, assessments, and course communication.",
    };
  }

  if (tone === "admin") {
    return {
      panel: AUTH_SIDE_PANEL_BLUE,
      panelGlow: AUTH_SIDE_PANEL_GLOW,
      chip: "bg-white/14 text-white",
      highlight: "text-[#f48c06]",
      button: "!bg-[#2f327d] !text-white !hover:bg-[#252862]",
      inputFocus: "focus:border-[#2f327d] focus:ring-[rgba(47,50,125,0.18)]",
      portalLabel: "Admin Portal",
      heroTitle: "Administrative access for records, approvals, and reporting.",
      heroCopy:
        "Manage academic records, faculties, departments, approvals, reports, and platform settings.",
    };
  }

  return {
    panel: AUTH_SIDE_PANEL_BLUE,
    panelGlow: AUTH_SIDE_PANEL_GLOW,
    chip: "bg-white/14 text-white",
    highlight: "text-[#f48c06]",
    button: "!bg-[#2f327d] !text-white !hover:bg-[#252862]",
    inputFocus: "focus:border-[#2f327d] focus:ring-[rgba(47,50,125,0.18)]",
      portalLabel: "CampusFlow Access",
      heroTitle: "Secure access to the CampusFlow platform.",
    heroCopy:
      "Use your institutional account to continue to the correct workspace.",
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-[#e82646]">{message}</p>;
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-[13px] font-semibold tracking-[0.01em] text-[#5f6785]">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8ca8]">
          {icon}
        </div>
        {children}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function AuthCanvas({
  tone,
  title,
  description,
  children,
  footer,
}: {
  tone: AuthTone;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const accessLabel =
    tone === "student"
      ? "Student Access"
      : tone === "lecturer"
        ? "Lecturer Access"
        : tone === "admin"
          ? "Admin Access"
          : "Secure Access";

  return (
    <main className="totc-shell relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/campus-auth.jpg')] bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(14,20,56,0.34)_0%,rgba(34,44,112,0.28)_45%,rgba(20,27,77,0.4)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(126,142,255,0.14),transparent_38%),radial-gradient(circle_at_84%_0%,rgba(47,50,125,0.16),transparent_34%)]" />
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#3d42a8]/14 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-[#2f327d]/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[620px] items-start justify-center pt-3 sm:min-h-[calc(100vh-6rem)] sm:items-center sm:pt-0">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 18, scale: 0.988 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="relative w-full overflow-hidden rounded-[34px] border border-white/60 bg-white/84 shadow-[0_36px_86px_rgba(47,50,125,0.16)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#8a9af5]/70 to-transparent" />
            <CardContent className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9 lg:px-9 lg:pb-9 lg:pt-10">
              <div className="space-y-7">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <span className="rounded-full bg-[#fff2e1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f48c06]">
                      {accessLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e7ecf6] bg-[#f8faff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#576089]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#2f327d]" />
                      Institution verified
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-display text-[2rem] font-extrabold tracking-[-0.04em] text-[#2f327d] sm:text-[2.15rem]">
                      {title}
                    </h2>
                    <p className="max-w-[28rem] text-[14px] leading-[1.7] text-[#696984] sm:text-[15px]">
                      {description}
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe6fa] bg-[#f7f9ff] px-3 py-1.5 text-[11px] font-medium text-[#4e5e80]">
                      <Download className="h-3.5 w-3.5 text-[#255ac8]" />
                      Install app from the floating button after the page loads.
                    </div>
                  </div>
                </div>

                <div className="space-y-5">{children}</div>

                {footer ? <div className="border-t border-[#edf1f7] pt-5">{footer}</div> : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

function LoginFields({
  tone,
  onSubmit,
  isSubmitting,
  errors,
  register,
  buttonLabel = "Sign In",
}: {
  tone: AuthTone;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSubmitting: boolean;
  errors: {
    email?: { message?: string };
    password?: { message?: string };
  };
  register: UseFormRegister<LoginValues>;
  buttonLabel?: string;
}) {
  const theme = getAuthTheme(tone);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Field label="Email Address" icon={<Mail className="h-4 w-4" />} error={errors.email?.message}>
        <Input
          type="email"
          placeholder="name@institution.edu"
          className={cn(
            "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] placeholder:text-[#9ca1af] transition-colors duration-200",
            theme.inputFocus,
          )}
          autoComplete="username"
          inputMode="email"
          required
          {...register("email")}
        />
      </Field>

      <Field label="Password" icon={<Lock className="h-4 w-4" />} error={errors.password?.message}>
        <Input
          type={showPassword ? "text" : "password"}
          className={cn(
            "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-12 text-[15px] text-[#2f327d] placeholder:text-[#9ca1af] transition-colors duration-200",
            theme.inputFocus,
          )}
          autoComplete="current-password"
          required
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#6d7593] transition hover:bg-[#eef3fb] hover:text-[#2f327d]"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      <div className="flex flex-col gap-3 text-sm text-[#696984] sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 rounded border border-[#d7e3ee] accent-[#2f327d]" />
          Remember Me
        </label>
        <Link href="/forgot-password" className="font-medium text-[#2f327d] transition hover:text-[#3d42a8]">
          Forgot Password?
        </Link>
      </div>

      <Button
        className={cn(
          "totc-pill h-14 w-full text-[15px] font-semibold tracking-[0.01em] shadow-none transition-transform duration-200 hover:-translate-y-[1px]",
          theme.button,
        )}
        size="lg"
        type="submit"
        disabled={isSubmitting}
      >
        {buttonLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

export function LoginPage({ role }: { role: Exclude<Role, "super_admin"> }) {
  const router = useRouter();
  const auth = useAuthStore();
  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (role === "student") await auth.loginStudent(values);
      if (role === "lecturer") await auth.loginLecturer(values);
      if (role === "admin") await auth.loginAdmin(values);
      toast.success("Signed in successfully");
      router.push(ROLE_HOME_ROUTES[useAuthStore.getState().role || role]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <AuthCanvas
      tone={role}
      title="Welcome Back"
      description="Enter your institutional details to continue into your workspace."
      footer={
        <p className="text-sm text-[#696984]">
          {role === "student" ? "Don't have an account yet? " : role === "lecturer" ? "First time here? " : "Need a different staff role? "}
          {role === "student" ? (
            <Link href="/register/student" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
              Create account
            </Link>
          ) : role === "lecturer" ? (
            <Link href="/register/lecturer" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
              Activate lecturer access
            </Link>
          ) : (
            <Link href="/staff" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
              Open staff sign in
            </Link>
          )}
        </p>
      }
    >
      <LoginFields
        tone={role}
        onSubmit={onSubmit}
        isSubmitting={formState.isSubmitting}
        errors={formState.errors}
        register={register}
      />
    </AuthCanvas>
  );
}

export function StaffAccessPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<"lecturer" | "admin">("lecturer");
  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (selectedRole === "lecturer") await auth.loginLecturer(values);
      if (selectedRole === "admin") await auth.loginAdmin(values);
      toast.success("Signed in successfully");
      router.push(ROLE_HOME_ROUTES[useAuthStore.getState().role || selectedRole]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <AuthCanvas
      tone={selectedRole}
      title="Staff Sign In"
      description="Choose whether you are signing in as a lecturer or an admin, then continue with your institutional details."
      footer={
        <div className="space-y-2 text-sm text-[#696984]">
          <p>
            Student access lives here:{" "}
            <Link href={`${studentPortalUrl}/login/student`} className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
              Student sign in
            </Link>
          </p>
          <p>
            First-time lecturers should{" "}
            <Link href="/register/lecturer" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
              activate their lecturer account
            </Link>
            .
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            {
              role: "lecturer",
              label: "Lecturer",
              copy: "Teaching workspace, courses, attendance, and materials",
            },
            {
              role: "admin",
              label: "Admin",
              copy: "Institution controls, approvals, reports, and oversight",
            },
          ] as const).map((option) => {
            const isActive = selectedRole === option.role;
            return (
              <button
                key={option.role}
                type="button"
                onClick={() => setSelectedRole(option.role)}
                className={cn(
                  "rounded-[22px] border px-4 py-4 text-left transition duration-300 hover:-translate-y-0.5",
                  isActive
                    ? "border-[#2f327d] bg-[#edf0ff] shadow-[0_14px_34px_rgba(47,50,125,0.16)]"
                    : "border-[#e5ecf4] bg-[#fbfdff] hover:border-[#cfdcf4]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[1rem] font-semibold text-[#2f327d]">{option.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                      isActive ? "bg-[#2f327d] text-white" : "bg-[#eef3f8] text-[#6d7593]",
                    )}
                  >
                    {isActive ? "Selected" : "Choose"}
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-6 text-[#696984]">{option.copy}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-[20px] border border-[#edf1f7] bg-[#fafcff] px-4 py-3 text-[14px] leading-6 text-[#5f6785]">
          You are signing in as{" "}
          <span className="font-semibold text-[#2f327d]">
            {selectedRole === "lecturer" ? "Lecturer" : "Admin"}
          </span>
          .
        </div>
      </div>

      <LoginFields
        tone={selectedRole}
        onSubmit={onSubmit}
        isSubmitting={formState.isSubmitting}
        errors={formState.errors}
        register={register}
        buttonLabel={selectedRole === "lecturer" ? "Sign In as Lecturer" : "Sign In as Admin"}
      />
    </AuthCanvas>
  );
}

export function StudentRegisterPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const theme = getAuthTheme("student");
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof studentRegisterSchema>>({
    resolver: zodResolver(studentRegisterSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await auth.registerStudent(values);
      toast.success("Student account created");
      router.push("/student");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <AuthCanvas
      tone="student"
      title="Create Account"
      description="Register with your approved student record to access the student portal."
      footer={
        <p className="text-sm text-[#696984]">
          Already have an account?{" "}
          <Link href="/login/student" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field
          label="Matric Number"
          icon={<UserSquare2 className="h-4 w-4" />}
          error={formState.errors.matricNumber?.message}
        >
          <Input
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="off"
            {...register("matricNumber")}
          />
        </Field>

        <Field
          label="Institutional Email"
          icon={<Mail className="h-4 w-4" />}
          error={formState.errors.email?.message}
        >
          <Input
            type="email"
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="username"
            inputMode="email"
            required
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          icon={<Lock className="h-4 w-4" />}
          error={formState.errors.password?.message}
        >
          <Input
            type={showPassword ? "text" : "password"}
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-12 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="new-password"
            required
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#6d7593] transition hover:bg-[#eef3fb] hover:text-[#2f327d]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        <Field label="Phone Number" icon={<Phone className="h-4 w-4" />}>
          <Input
            type="tel"
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            inputMode="tel"
            autoComplete="tel"
            {...register("phone")}
          />
        </Field>

        <Button
          className={cn(
            "totc-pill h-14 w-full text-[15px] font-semibold tracking-[0.01em] shadow-none transition-transform duration-200 hover:-translate-y-[1px]",
            theme.button,
          )}
          size="lg"
          type="submit"
          disabled={formState.isSubmitting}
        >
          Create Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </AuthCanvas>
  );
}

export function LecturerRegisterPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const theme = getAuthTheme("lecturer");
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof lecturerRegisterSchema>>({
    resolver: zodResolver(lecturerRegisterSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await auth.registerLecturer(values);
      toast.success("Lecturer account activated");
      router.push("/staff/lecturer");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <AuthCanvas
      tone="lecturer"
      title="Activate Lecturer Account"
      description="Use your approved staff record to create your lecturer sign-in and open the teaching workspace."
      footer={
        <p className="text-sm text-[#696984]">
          Already activated?{" "}
          <Link href="/login/lecturer" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field
          label="Employee ID"
          icon={<UserSquare2 className="h-4 w-4" />}
          error={formState.errors.employeeId?.message}
        >
          <Input
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="off"
            {...register("employeeId")}
          />
        </Field>

        <Field
          label="Institutional Email"
          icon={<Mail className="h-4 w-4" />}
          error={formState.errors.email?.message}
        >
          <Input
            type="email"
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="username"
            inputMode="email"
            required
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          icon={<Lock className="h-4 w-4" />}
          error={formState.errors.password?.message}
        >
          <Input
            type={showPassword ? "text" : "password"}
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-12 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="new-password"
            required
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#6d7593] transition hover:bg-[#eef3fb] hover:text-[#2f327d]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        <Field label="Phone Number" icon={<Phone className="h-4 w-4" />}>
          <Input
            type="tel"
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            inputMode="tel"
            autoComplete="tel"
            {...register("phone")}
          />
        </Field>

        <Button
          className={cn(
            "totc-pill h-14 w-full text-[15px] font-semibold tracking-[0.01em] shadow-none transition-transform duration-200 hover:-translate-y-[1px]",
            theme.button,
          )}
          size="lg"
          type="submit"
          disabled={formState.isSubmitting}
        >
          Activate Lecturer Access
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </AuthCanvas>
  );
}

export function ForgotPasswordPage() {
  const theme = getAuthTheme("generic");
  const { register, handleSubmit, formState } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await requestPasswordReset(values.email);
      toast.success(result.message);
      if (result.data.resetLink) {
        toast.info("Development reset link returned by backend");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <AuthCanvas
      tone="generic"
      title="Forgot Password?"
      description="We'll send recovery instructions so you can get back into your CampusFlow workspace."
      footer={
        <p className="text-sm text-[#696984]">
          Return to{" "}
          <Link href="/login/student" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
            sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field label="Email Address" icon={<Mail className="h-4 w-4" />} error={formState.errors.email?.message}>
          <Input
            type="email"
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="username"
            inputMode="email"
            required
            {...register("email")}
          />
        </Field>

        <Button
          className={cn(
            "totc-pill h-14 w-full text-[15px] font-semibold tracking-[0.01em] shadow-none transition-transform duration-200 hover:-translate-y-[1px]",
            theme.button,
          )}
          size="lg"
          type="submit"
          disabled={formState.isSubmitting}
        >
          Send Reset Instructions
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </AuthCanvas>
  );
}

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const initialToken = searchParams?.get("token") || "";
  const theme = getAuthTheme("generic");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetToken: initialToken,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetPassword(values);
      toast.success("Password reset successful. You can sign in now.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <AuthCanvas
      tone="generic"
      title="Reset Password"
      description="Enter your reset token and choose a new password to restore access."
      footer={
        <p className="text-sm text-[#696984]">
          Back to{" "}
          <Link href="/login/student" className="font-semibold text-[#2f327d] transition hover:text-[#3d42a8]">
            sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field
          label="Reset Token"
          icon={<ShieldCheck className="h-4 w-4" />}
          error={formState.errors.resetToken?.message}
        >
          <Input
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-4 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="off"
            {...register("resetToken")}
          />
        </Field>

        <Field
          label="New Password"
          icon={<Lock className="h-4 w-4" />}
          error={formState.errors.newPassword?.message}
        >
          <Input
            type={showNewPassword ? "text" : "password"}
            className={cn(
              "h-14 rounded-[18px] border-[#dde6ef] bg-[#fdfefe] pl-12 pr-12 text-[15px] text-[#2f327d] transition-colors duration-200",
              theme.inputFocus,
            )}
            autoComplete="new-password"
            required
            {...register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#6d7593] transition hover:bg-[#eef3fb] hover:text-[#2f327d]"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        <Button
          className={cn(
            "totc-pill h-14 w-full text-[15px] font-semibold tracking-[0.01em] shadow-none transition-transform duration-200 hover:-translate-y-[1px]",
            theme.button,
          )}
          size="lg"
          type="submit"
          disabled={formState.isSubmitting}
        >
          Update Password
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </AuthCanvas>
  );
}
