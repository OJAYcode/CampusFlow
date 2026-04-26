import { AdminCourseDetailPage } from "@/src/features/admin/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <AdminCourseDetailPage courseId={courseId} />;
}
