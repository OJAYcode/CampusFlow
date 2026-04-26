import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function UnauthorizedPage() {
 return (
 <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
 <Card className="w-full max-w-lg">
 <CardHeader>
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
 Access restricted
 </p>
 <CardTitle className="text-3xl">You do not have access to this area</CardTitle>
 </CardHeader>
 <CardContent className="space-y-5">
 <p className="text-slate-600">
 Your account is authenticated, but the role attached to it does not match
 this route group.
 </p>
 <div className="flex flex-wrap gap-3">
 <Button asChild>
 <Link href="/">Go home</Link>
 </Button>
 <Button asChild variant="secondary">
 <Link href="/login/student">Switch account</Link>
 </Button>
 </div>
 </CardContent>
 </Card>
 </main>
 );
}
