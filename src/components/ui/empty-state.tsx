import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="border-dashed border-[rgba(0,27,58,0.12)] bg-[#fcfdff] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#202c4b]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="max-w-xl text-[13px] leading-5 text-[#838a9b] sm:max-w-2xl sm:text-sm sm:leading-6">{description}</p>
        {actionLabel && onAction ? <Button size="sm" onClick={onAction}>{actionLabel}</Button> : null}
      </CardContent>
    </Card>
  );
}
