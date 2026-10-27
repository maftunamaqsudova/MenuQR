"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PublicRestaurant } from "@/lib/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [list, setList] = useState<PublicRestaurant[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    const path = debounced
      ? `/public/restaurants?search=${encodeURIComponent(debounced)}`
      : "/public/restaurants";

    api<PublicRestaurant[]>(path)
      .then((res) => {
        if (!cancelled) {
          setList(res);
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(errMsg(e)))
      .finally(() => !cancelled && setSearching(false));

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <span className="text-lg font-bold">QR Menu</span>
          <div className="flex items-center gap-2 text-sm">
            <LanguageSwitcher />
            {!authLoading &&
              (user ? (
                <Link href="/dashboard"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
                  {t("dashboard")}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="rounded-lg px-3 py-2 font-medium hover:bg-gray-100">
                    {t("login")}
                  </Link>
                  <Link href="/register"
                    className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700">
                    {t("getStarted")}
                  </Link>
                </>
              ))}
          </div>
        </div>
      </header>

      <section className="bg-emerald-700 px-4 py-10 text-center text-white">
        <h1 className="text-3xl font-bold">{t("findRestaurant")}</h1>
        <p className="mt-2 text-emerald-100">{t("homeSubtitle")}</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={100}
          placeholder={t("searchPlaceholder")}
          className="mx-auto mt-5 block w-full max-w-md rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-4 focus:ring-emerald-300"
        />
      </section>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {list === null && !error && <p className="text-center text-gray-500">{t("loading")}</p>}

        {list && list.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            {debounced ? `${t("noResultsFor")} "${debounced}"` : t("noRestaurants")}
          </p>
        )}

        {list && list.length > 0 && (
          <>
            <p className="text-sm text-gray-500">
              {searching ? t("searching") : `${list.length} ${t("restaurantsWord")}`}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((r) => (
                <RestaurantCard key={r.slug} r={r} />
              ))}
            </ul>
          </>
        )}

        {!user && !authLoading && (
          <p className="pt-6 text-center text-sm text-gray-500">
            {t("ownerQ")}{" "}
            <Link href="/register" className="font-medium text-emerald-700 hover:underline">
              {t("createMenu")}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}

function RestaurantCard({ r }: { r: PublicRestaurant }) {
  const logo = imageUrl(r.logoUrl);

  return (
    <li>
      <Link href={`/r/${r.slug}`}
        className="flex h-full gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-xl font-bold text-emerald-700">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-full w-full object-cover" />
          ) : (
            r.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{r.name}</p>
          {r.description && <p className="line-clamp-2 text-sm text-gray-500">{r.description}</p>}
          {r.address && <p className="mt-1 truncate text-xs text-gray-400">{r.address}</p>}
        </div>
      </Link>
    </li>
  );
}