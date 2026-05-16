import { LecturerAssignmentSubmissionsPage } from "@/src/features/lecturer/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;

  return <LecturerAssignmentSubmissionsPage assignmentId={assignmentId} />;
}
