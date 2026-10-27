"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function DashboardHome() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-gray-600">Manage {user.restaurantName} from here.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Your public menu page</p>
        <Link href={`/r/${user.restaurantSlug}`} className="font-medium text-emerald-700 hover:underline">
          /r/{user.restaurantSlug}
        </Link>
      </div>
    </div>
  );
}