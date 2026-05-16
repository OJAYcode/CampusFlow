import { LecturerAssessmentAttemptsPage } from "@/src/features/lecturer/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  return <LecturerAssessmentAttemptsPage assessmentId={assessmentId} />;
}
