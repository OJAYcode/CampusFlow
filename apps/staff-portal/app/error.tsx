"use client";

import { useEffect } from "react";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            The staff portal hit an unexpected error. You can retry the page or return
            to the portal home screen.
          </p>
          <div className="flex gap-3">
            <Button onClick={reset}>Try again</Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>
              Return home
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
