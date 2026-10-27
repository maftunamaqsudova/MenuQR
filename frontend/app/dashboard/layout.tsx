"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/menu", label: "Menu" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/qr", label: "QR code" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  function onLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-gray-200 bg-white md:min-h-screen md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4">
          <span className="truncate font-bold">{user.restaurantName}</span>
          <button onClick={onLogout} className="text-sm text-gray-500 hover:text-red-600 md:hidden">
            Log out
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-emerald-50 text-emerald-800" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden p-3 md:block">
          <button onClick={onLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}