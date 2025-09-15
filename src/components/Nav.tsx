"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const links = [
  { href: "/",        label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/company", label: "Company" },
  { href: "/studio",  label: "Studio" },
  { href: "/blog",    label: "Blog" },
  { href: "/login",   label: "Log in" },
];

export default function Nav() {
  const pathname = usePathname() || "/";
  return (
    <header className="border-b bg-white/70 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold">CareCircle</Link>
        <ul className="flex gap-4 text-sm">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    "rounded px-2 py-1 " +
                    (active
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100")
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
