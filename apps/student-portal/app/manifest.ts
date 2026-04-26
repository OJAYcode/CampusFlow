import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusFlow Student Portal",
    short_name: "CampusFlow Student",
    description: "Student portal for attendance, coursework, assessments, and announcements.",
    start_url: "/student",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#255ac8",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/pwa-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/pwa-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
