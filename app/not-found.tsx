import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">404</p>
          <CardTitle className="text-3xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-slate-600">
            The requested workspace or record could not be found. Return to the appropriate portal and continue from there.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/login/student">Open login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

