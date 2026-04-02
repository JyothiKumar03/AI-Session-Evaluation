"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Brain, Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  Icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: "Sessions", href: "/transcripts", Icon: FileText },
  { label: "Compare", href: "/compare", Icon: Columns2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Brain className="h-4.5 w-4.5 text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="text-m font-semibold tracking-tight text-gray-900 leading-tight">
            AI Coding session
          </span>
          <span className="text-[12px] text-gray-400 leading-tight">Evaluator</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map(({ label, href, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-5 py-4">
        <p className="text-xs text-gray-400">v1.0 · AI Coding Session Evaluator</p>
      </div>
    </aside>
  );
}
