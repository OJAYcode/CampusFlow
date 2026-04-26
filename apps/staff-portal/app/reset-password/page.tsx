import { Suspense } from "react";

import { ResetPasswordPage } from "@/src/features/auth/pages";

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
