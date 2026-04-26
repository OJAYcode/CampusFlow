import { redirect } from "next/navigation";

export default function StaffLegacySignInRoute() {
  redirect("/login/lecturer");
}
