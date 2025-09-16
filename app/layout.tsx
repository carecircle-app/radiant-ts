import type { ReactNode } from "react";

export const metadata = {
  title: "Home  App Router",
  description: "Smoke test home",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
