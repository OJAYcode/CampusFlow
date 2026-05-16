import { StudentAttendanceSubmittedPage } from "@/src/features/student/pages";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const params = await searchParams;

  return <StudentAttendanceSubmittedPage sessionLabel={params.session} />;
}
