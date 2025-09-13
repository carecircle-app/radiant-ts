import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "CareCircle", template: "%s | CareCircle" },
  description:
    "CareCircle helps families and caregivers coordinate daily care with a shared calendar, medication reminders, geofencing alerts, and secure messaging."
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
