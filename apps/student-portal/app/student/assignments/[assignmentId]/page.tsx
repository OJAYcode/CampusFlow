import { StudentAssignmentDetailPage } from "@/src/features/student/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  return <StudentAssignmentDetailPage assignmentId={assignmentId} />;
}
