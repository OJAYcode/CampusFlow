import { LecturerCourseWorkspacePage } from "@/src/features/lecturer/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <LecturerCourseWorkspacePage courseId={courseId} />;
}
