export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: "2rem" }}>{children}</body>
    </html>
  );
}
