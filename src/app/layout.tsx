import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "CareCircle  Coordinate care with confidence",
  description:
    "Shared calendars, medication reminders, geofencing alerts, secure chat, and visit notes  all in one app for families and caregivers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 antialiased">
        {children}
      </body>
    </html>
  );
}
