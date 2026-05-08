import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "CampusFlow Staff Portal",
    short_name: "CampusFlow Staff",
    description: "CampusFlow staff portal for lecturer workspaces, administration, and academic operations.",
    start_url: "/staff",
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
