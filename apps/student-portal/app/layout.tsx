import "../../../app/globals.css";

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppProviders } from "@/src/components/providers/app-providers";
import { PwaBootstrap } from "@/src/components/pwa/pwa-bootstrap";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CampusFlow Student Portal",
    template: "%s | CampusFlow Student Portal",
  },
  description: "CampusFlow student portal for attendance, coursework, assessments, and academic communication.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.variable}>
        <AppProviders>{children}</AppProviders>
        <PwaBootstrap portal="student" />
      </body>
    </html>
  );
}
