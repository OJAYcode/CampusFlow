import { StudentAssessmentDetailPage } from "@/src/features/student/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <StudentAssessmentDetailPage assessmentId={assessmentId} />;
}
