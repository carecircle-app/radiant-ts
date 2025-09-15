// src/components/calendar/CalendarBox.tsx
"use client";

import type { ReactNode } from "react";
import Box from "@/components/ui/Box";

export default function CalendarBox({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Box
      title={title}
      subtitle={subtitle}
      tone="brand"
      variant="soft"
      outlined
      collapsible
      defaultOpen={defaultOpen}
      className="bg-white"
    >
      {children}
    </Box>
  );
}
