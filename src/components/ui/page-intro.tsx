import { Card, CardContent } from "@/src/components/ui/card";

export function PageIntro({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2 sm:space-y-2.5">
        {kicker ? <p className="heading-kicker text-[#255ac8]">{kicker}</p> : null}
        <div className="space-y-1">
          <h2 className="font-display text-[1.2rem] font-semibold tracking-[-0.03em] text-[#202c4b] sm:text-[1.38rem] md:text-[1.85rem]">{title}</h2>
          {description ? <p className="max-w-2xl text-[12px] leading-5 text-[#667085] sm:max-w-3xl sm:text-[14px] sm:leading-6">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 [&>*]:w-full sm:[&>*]:w-auto">{actions}</div> : null}
    </div>
  );
}

export function PageControlCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden rounded-[20px] border-[var(--border)] bg-white shadow-[0_12px_28px_rgba(15,37,71,0.05)]">
      <CardContent className="p-3.5 sm:p-4 md:p-5">{children}</CardContent>
    </Card>
  );
}

export function DetailHero({
  title,
  subtitle,
  badges,
  meta,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[24px] border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-[0_12px_28px_rgba(15,37,71,0.05)]">
      <CardContent className="grid gap-4 p-4 sm:gap-5 sm:p-5 md:p-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em] text-[#202c4b] sm:text-[1.3rem] md:text-[1.65rem]">{title}</h2>
            {subtitle ? <p className="text-[13px] leading-5 text-[#667085] sm:text-[14px] sm:leading-6">{subtitle}</p> : null}
          </div>
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
        </div>
        {meta ? <div className="min-w-0 lg:min-w-[240px]">{meta}</div> : null}
      </CardContent>
    </Card>
  );
}
