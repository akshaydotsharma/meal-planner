"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Chat" },
  { href: "/plan", label: "Plan" },
  { href: "/history", label: "History" },
  { href: "/saved", label: "Saved" },
  { href: "/new", label: "Detailed" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E8E0DB]/60 bg-[#FFFBF8]/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          {/* Logo icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E54D2E] to-[#D13415] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-[#E54D2E]">Meal Recco</span>
        </Link>

        <div className="flex gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "text-[#E54D2E] bg-[#FFF0ED]"
                    : "text-[#7C7269] hover:text-[#1F1F1F] hover:bg-[#FAF5F2]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#E54D2E] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
