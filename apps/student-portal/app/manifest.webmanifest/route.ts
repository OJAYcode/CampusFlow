import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "CampusFlow Student Portal",
    short_name: "CampusFlow Student",
    description: "CampusFlow student portal for attendance, coursework, assessments, and academic communication.",
    start_url: "/student",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#255ac8",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/apple-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  });
}
