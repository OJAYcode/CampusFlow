import {
  ArrowRight,
  Bell,
  Bookmark,
  BookOpen,
  CalendarCheck2,
  CirclePlay,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { STAFF_PORTAL_FEATURES, STUDENT_PORTAL_FEATURES } from "@/src/lib/constants";

const studentPortalUrl =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ?? "http://localhost:3000";

const studentNavItems = [
  "Overview",
  "Attendance",
  "Assignments",
  "Assessments",
  "Announcements",
];

const staffNavItems = [
  "Overview",
  "Courses",
  "Attendance",
  "Reports",
  "Administration",
];

const studentStats = [
  ["5K+", "Students"],
  ["90%", "Total success"],
  ["35", "Main questions"],
  ["26", "Chief experts"],
];

const staffStats = [
  ["15K+", "Records managed"],
  ["75%", "Workflow efficiency"],
  ["35", "Academic queues"],
  ["26", "Operational reports"],
];

const studentHighlights = [
  "Seeded registration keeps access tied to verified student identity.",
  "Attendance submission stays connected to active sessions and validation rules.",
  "Assignments, assessments, materials, and announcements live in one portal.",
];

const staffHighlights = [
  "Lecturer workflows stay course-bound and easier to scan.",
  "Administrative operations remain visible across seeded records and approvals.",
  "Reporting, attendance oversight, and communication share one cleaner surface.",
];

const studentNews = [
  {
    tag: "Attendance",
    title: "Students can understand the attendance workflow before signing in.",
    copy: "The landing page now explains how attendance, course access, and academic tools fit together inside CampusFlow.",
  },
  {
    tag: "Coursework",
    title: "Assignments and assessments are part of the same student experience.",
    copy: "Students now get a clearer introduction to how learning tasks and announcements are organized once they enter the portal.",
  },
  {
    tag: "Communication",
    title: "Course updates and lecturer messages stay inside one academic flow.",
    copy: "The public landing page now reflects the product students actually use instead of generic template messaging.",
  },
];

function BrandLogo({
  invert = false,
  portal,
}: {
  invert?: boolean;
  portal: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={
          invert
            ? "grid h-11 w-11 place-items-center rounded-[15px] border border-white/18 bg-white/14 text-white"
            : "grid h-11 w-11 place-items-center rounded-[15px] border border-[#d9e5fb] bg-[#eef3ff] text-[#255ac8]"
        }
      >
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-none">
        <p
          className={
            invert
              ? "text-[1.55rem] font-bold tracking-[0.01em] text-white"
              : "text-[1.55rem] font-bold tracking-[0.01em] text-[#2f327d]"
          }
        >
          CampusFlow
        </p>
        <p
          className={
            invert
              ? "mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70"
              : "mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#696984]"
          }
        >
          {portal}
        </p>
      </div>
    </div>
  );
}

function LinkAction({
  href,
  label,
  tone,
  icon,
  className = "",
}: {
  href: string;
  label: string;
  tone: "solid" | "soft";
  icon?: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === "solid"
      ? "border border-white/70 bg-white !text-[#1f2a68] shadow-[0_18px_38px_rgba(37,38,65,0.16)] hover:bg-[#f7fbff]"
      : "border border-white/30 bg-white/14 text-white backdrop-blur-sm hover:bg-white/22";

  return (
    <Link
      href={href}
      className={`relative z-20 inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold transition duration-200 ${toneClass} ${className}`}
    >
      <span>{label}</span>
      {icon}
    </Link>
  );
}

function LandingHeader({
  loginHref,
  signupHref,
  portal,
  navItems,
}: {
  loginHref: string;
  signupHref: string;
  portal: string;
  navItems: string[];
}) {
  return (
    <header className="relative z-20 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <BrandLogo invert portal={portal} />

        <div className="relative z-20 flex flex-wrap items-center gap-3">
        <nav className="hidden items-center gap-6 rounded-full border border-[#d8e4fb] bg-white px-6 py-3 text-[14px] text-[#2f327d] shadow-[0_12px_30px_rgba(47,50,125,0.12)] lg:flex">
          {navItems.map((item) => (
            <a key={item} href="#" className="transition hover:text-[#255ac8]">
              {item}
            </a>
          ))}
        </nav>

        <LinkAction href={loginHref} label="Login" tone="solid" className="min-w-[126px]" />
        <LinkAction href={signupHref} label="Sign Up" tone="soft" className="min-w-[126px]" />
      </div>
    </header>
  );
}

function HeroPreview({
  label,
  title,
  copy,
  cards,
}: {
  label: string;
  title: string;
  copy: string;
  cards: Array<{ icon: typeof LayoutDashboard; title: string; tone: string }>;
}) {
  return (
    <div className="w-full rounded-[30px] bg-white p-5 shadow-[0_18px_48px_rgba(47,50,125,0.12)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff6d6d]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffd66b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#255ac8]" />
        </div>
        <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#255ac8]">
          {label}
        </span>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[24px] bg-[#eef3ff] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#255ac8]">
            Workspace
          </p>
          <p className="mt-3 text-[1.05rem] font-semibold text-[#2f327d]">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[#696984]">{copy}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`rounded-[22px] p-4 ${card.tone}`}
              >
                <Icon className="h-6 w-6 text-[#2f327d]" />
                <p className="mt-4 text-sm font-semibold text-[#2f327d]">{card.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  portal,
  navItems,
  loginHref,
  signupHref,
  accent,
  title,
  copy,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  previewLabel,
  previewTitle,
  previewCopy,
  previewCards,
}: {
  portal: string;
  navItems: string[];
  loginHref: string;
  signupHref: string;
  accent: string;
  title: string;
  copy: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  previewLabel: string;
  previewTitle: string;
  previewCopy: string;
  previewCards: Array<{ icon: typeof LayoutDashboard; title: string; tone: string }>;
}) {
  return (
    <section className="portal-hero relative w-full">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-18 pt-7 sm:px-8 lg:px-10 lg:pb-22">
        <LandingHeader
          loginHref={loginHref}
          signupHref={signupHref}
          portal={portal}
          navItems={navItems}
        />

        <div className="grid flex-1 gap-12 pt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-7">
            <div className="space-y-4">
              <h1 className="font-display text-[2.35rem] font-extrabold leading-[1.12] tracking-[-0.04em] text-white sm:text-[3rem]">
                <span className="text-[#f48c06]">{accent}</span> {title}
              </h1>
              <p className="max-w-[34rem] text-[16px] leading-8 text-white/88">{copy}</p>
            </div>

            <div className="relative z-20 flex flex-col gap-4 sm:flex-row sm:items-center">
              <LinkAction
                href={primaryHref}
                label={primaryLabel}
                tone="solid"
                icon={<ArrowRight className="h-4 w-4" />}
                className="min-w-[196px] px-8 py-4 text-[16px]"
              />

              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-4 text-[15px] font-medium text-white"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-[0_18px_44px_rgba(255,255,255,0.2)]">
                  <CirclePlay className="h-6 w-6 fill-[#255ac8] text-[#255ac8]" />
                </span>
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <HeroPreview
            label={previewLabel}
            title={previewTitle}
            copy={previewCopy}
            cards={previewCards}
          />
        </div>
      </div>
    </section>
  );
}

function StatsSection({
  title,
  copy,
  stats,
}: {
  title: string;
  copy: string;
  stats: string[][];
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-18 text-center sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <h2 className="totc-section-title text-[2rem] sm:text-[2.4rem]">{title}</h2>
        <p className="text-[16px] leading-8 text-[#696984]">{copy}</p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label}>
            <p className="totc-metric-text font-display text-5xl font-extrabold tracking-[-0.06em] sm:text-[4.5rem]">
              {value}
            </p>
            <p className="mt-2 text-[1.2rem] font-medium text-[#2f327d]">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid({
  kicker,
  title,
  copy,
  items,
}: {
  kicker: string;
  title: string;
  copy: string;
  items: Array<{
    title: string;
    description: string;
    icon?: typeof GraduationCap;
  }>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f327d]">
          {kicker}
        </p>
        <h2 className="totc-section-title text-[2rem] sm:text-[2.35rem]">{title}</h2>
        <p className="text-[16px] leading-8 text-[#696984]">{copy}</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon ?? GraduationCap;
          return (
            <div
              key={item.title}
              className="rounded-[28px] border border-[#e9f0f6] bg-white p-6 text-center shadow-[0_18px_44px_rgba(47,50,125,0.08)]"
            >
              <div className="mx-auto grid h-[82px] w-[82px] place-items-center rounded-full bg-[#eef3ff]">
                <Icon className="h-7 w-7 text-[#255ac8]" />
              </div>
              <h3 className="mt-5 text-[1.18rem] font-semibold text-[#2f327d]">
                {item.title}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-[#696984]">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HighlightStrip({ items }: { items: string[] }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="grid gap-5 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-[24px] bg-white px-5 py-5 text-[15px] leading-7 text-[#5b5b5b] shadow-[0_18px_44px_rgba(47,50,125,0.08)]"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function NewsSection() {
  const sideIcons = [Bookmark, Clock3, Bell];

  return (
    <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e4fb] bg-[#f4f7ff] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#255ac8]">
          <Sparkles className="h-4 w-4" />
          Newsroom
        </div>
        <h2 className="totc-section-title text-[2rem] sm:text-[2.35rem]">
          Latest News and Resources
        </h2>
        <p className="text-[16px] leading-8 text-[#696984]">
          The landing page should explain the product clearly before sign in. These sections now
          do that with CampusFlow-specific content and calmer typography.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div
          className="group relative overflow-hidden rounded-[32px] border border-[#e8eef5] bg-white shadow-[0_18px_44px_rgba(47,50,125,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(47,50,125,0.12)] animate-appear"
          style={{ animationDelay: "60ms" }}
        >
          <div className="relative flex h-[260px] flex-col justify-between overflow-hidden rounded-t-[32px] bg-[linear-gradient(135deg,#e4edff_0%,#c8dbff_100%)] p-5 sm:p-6">
            <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full border-[18px] border-white/35" />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <span className="rounded-full bg-white/90 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#255ac8] shadow-[0_10px_24px_rgba(47,50,125,0.1)]">
                Student Updates
              </span>
              <div className="rounded-full bg-white/90 p-3 text-[#255ac8] shadow-[0_8px_24px_rgba(47,50,125,0.1)] backdrop-blur-sm animate-float-soft motion-reduce:animate-none">
                <Newspaper className="h-5 w-5" />
              </div>
            </div>
            <div className="relative z-10 max-w-[15rem] rounded-[22px] bg-white/78 px-4 py-3 backdrop-blur-sm">
              <p className="text-[13px] font-medium leading-6 text-[#2f327d]">
                A cleaner product story for new students before login.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1dd] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#f48c06]">
              <Sparkles className="h-3.5 w-3.5" />
              NEWS
            </span>
            <h3 className="text-[1.45rem] font-semibold leading-[1.25] text-[#2f327d]">
              The CampusFlow student landing page now introduces the portal before sign in
            </h3>
            <p className="text-[15px] leading-7 text-[#696984]">
              Students now get context around attendance, coursework, and course communication
              before they enter authentication.
            </p>
            <a
              className="inline-flex items-center gap-2 text-[16px] font-semibold text-[#2f327d] transition group-hover:text-[#255ac8]"
              href="#top"
            >
              Read more
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="grid gap-5">
          {studentNews.map((item, index) => (
            <div
              key={item.title}
              className="group grid overflow-hidden rounded-[28px] border border-[#e8eef5] bg-white shadow-[0_18px_44px_rgba(47,50,125,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(47,50,125,0.12)] md:grid-cols-[180px_1fr] animate-appear"
              style={{ animationDelay: `${140 + index * 90}ms` }}
            >
              <div
                className={
                  index === 0
                    ? "flex min-h-[170px] flex-col justify-between rounded-t-[28px] bg-[linear-gradient(135deg,#e4edff_0%,#c8dbff_100%)] p-4 md:rounded-l-[28px] md:rounded-tr-none"
                    : index === 1
                      ? "flex min-h-[170px] flex-col justify-between rounded-t-[28px] bg-[linear-gradient(135deg,#fff1dd_0%,#fde0b9_100%)] p-4 md:rounded-l-[28px] md:rounded-tr-none"
                      : "flex min-h-[170px] flex-col justify-between rounded-t-[28px] bg-[linear-gradient(135deg,#eef2ff_0%,#dbe7ff_100%)] p-4 md:rounded-l-[28px] md:rounded-tr-none"
                }
              >
                <div className="flex items-center">
                  {(() => {
                    const Icon = sideIcons[index] ?? Newspaper;
                    return (
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/88 px-3 py-2 text-[#2f327d] shadow-[0_8px_18px_rgba(47,50,125,0.08)]">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                          {item.tag}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="mt-6 h-px bg-white/55" />
              </div>
              <div className="p-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f6f8fc] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#255ac8]">
                  <Newspaper className="h-3.5 w-3.5" />
                  {item.tag}
                </span>
                <h3 className="mt-4 text-[1.08rem] font-semibold leading-[1.35] text-[#2f327d]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-[#696984]">{item.copy}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[13px] text-[#8a8faa]">Updated for the new student portal</span>
                  <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#2f327d] transition group-hover:text-[#255ac8]">
                    Explore
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection({
  portal,
  ctaTitle,
  ctaCopy,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  portal: string;
  ctaTitle: string;
  ctaCopy: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <footer className="bg-[#252641]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.62fr_0.38fr]">
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <BrandLogo invert portal={portal} />
              <div className="h-14 w-px bg-white/20" />
              <p className="max-w-[10rem] text-[15px] leading-6 text-white/75">
                Smart attendance and e-learning management
              </p>
            </div>

            <p className="max-w-[34rem] text-[16px] leading-8 text-white/72">
              {ctaCopy}
            </p>

            <div className="flex max-w-[34rem] flex-col gap-3 sm:flex-row">
              <div className="flex h-14 flex-1 items-center gap-3 rounded-full border border-white/18 px-5 text-white/68">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Your Email</span>
              </div>
              <button
                type="button"
                className="rounded-full bg-[#255ac8] px-7 py-3.5 text-base font-semibold text-white transition hover:bg-[#1f66d1]"
              >
                Subscribe
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/58">
              Next step
            </p>
            <h3 className="font-display text-[2rem] font-extrabold tracking-[-0.04em] text-white">
              {ctaTitle}
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-full bg-[#255ac8] px-7 py-3.5 text-base font-semibold text-white transition hover:bg-[#1f66d1]"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[#2f327d] transition hover:bg-white/92"
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="pt-6 text-sm text-white/58">
              <div className="flex flex-wrap gap-4">
                <span>Careers</span>
                <span>Privacy Policy</span>
                <span>Terms & Conditions</span>
              </div>
              <p className="mt-4">© 2026 CampusFlow.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function StudentLandingPage() {
  return (
    <main id="top" className="totc-shell min-h-screen">
      <HeroSection
        portal="Student Portal"
        navItems={studentNavItems}
        loginHref="/login/student"
        signupHref="/register/student"
        accent="CampusFlow"
        title="brings attendance, coursework, and course updates into one student portal"
        copy="Sign in once and manage attendance, assignments, assessments, announcements, materials, and academic communication from a single guided workspace."
        primaryHref="/register/student"
        primaryLabel="Join for free"
        secondaryHref="#features"
        secondaryLabel="Watch how it works"
        previewLabel="Student Portal"
        previewTitle="Student dashboard preview"
        previewCopy="Attendance, learning tasks, course materials, and updates stay in one clear interface."
        previewCards={[
          {
            icon: CalendarCheck2,
            title: "Attendance",
            tone: "bg-[#fff4e6]",
          },
          {
            icon: BookOpen,
            title: "Assignments",
            tone: "bg-[#eef3ff]",
          },
          {
            icon: Bell,
            title: "Announcements",
            tone: "bg-[#f4f7ff]",
          },
        ]}
      />

      <StatsSection
        title="Our Success"
        copy="CampusFlow gives students a more direct path into attendance, coursework, and academic communication without dropping them cold into a login form."
        stats={studentStats}
      />

      <FeatureGrid
        kicker="Student Experience"
        title="Everything a student needs before and after sign in"
        copy="The landing page now reflects the actual CampusFlow student product instead of generic template content."
        items={STUDENT_PORTAL_FEATURES}
      />

      <HighlightStrip items={studentHighlights} />

      <NewsSection />

      <FooterSection
        portal="Student Portal"
        ctaTitle="Continue into the student portal"
        ctaCopy="Use your verified student account to continue into attendance, assignments, assessments, announcements, materials, and course communication."
        primaryHref="/login/student"
        primaryLabel="Student Login"
        secondaryHref="/register/student"
        secondaryLabel="Create Account"
      />
    </main>
  );
}

function StaffLandingPage() {
  return (
    <main id="top" className="totc-shell min-h-screen">
      <HeroSection
        portal="Staff Portal"
        navItems={staffNavItems}
        loginHref="/login/lecturer"
        signupHref="/login/admin"
        accent="CampusFlow"
        title="gives lecturers and admins a clearer way to run academic operations"
        copy="Manage course delivery, seeded student records, approvals, communication, attendance, and institutional reporting from one staff-facing workspace."
        primaryHref="/login/lecturer"
        primaryLabel="Enter staff workspace"
        secondaryHref={studentPortalUrl}
        secondaryLabel="Open student portal"
        previewLabel="Staff Portal"
        previewTitle="Staff operations overview"
        previewCopy="Lecturer delivery, admin control, reporting, and academic structure live inside one lighter control surface."
        previewCards={[
          {
            icon: LayoutDashboard,
            title: "Dashboard",
            tone: "bg-[#eef3ff]",
          },
          {
            icon: Users,
            title: "Lecturers",
            tone: "bg-[#fff4e6]",
          },
          {
            icon: FileText,
            title: "Reports",
            tone: "bg-[#f4f7ff]",
          },
        ]}
      />

      <StatsSection
        title="Our Success"
        copy="CampusFlow gives staff one operational surface for lecturer workflows, seeded student administration, approvals, communication, and oversight."
        stats={staffStats}
      />

      <FeatureGrid
        kicker="Institution Operations"
        title="A clearer staff surface for teaching and administration"
        copy="The staff landing page is now tailored to the real CampusFlow product instead of generic template messaging."
        items={STAFF_PORTAL_FEATURES}
      />

      <HighlightStrip items={staffHighlights} />

      <FooterSection
        portal="Staff Portal"
        ctaTitle="Continue with staff access"
        ctaCopy="Continue into the lecturer or admin workspace to manage courses, attendance, seeded students, approvals, reports, and academic communication."
        primaryHref="/login/lecturer"
        primaryLabel="Lecturer Login"
        secondaryHref="/login/admin"
        secondaryLabel="Admin Login"
      />
    </main>
  );
}

export { StaffLandingPage, StudentLandingPage };
