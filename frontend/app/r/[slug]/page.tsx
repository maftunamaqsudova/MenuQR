import { Suspense } from "react";
import RestaurantMenu from "@/components/RestaurantMenu";

export default async function PublicRestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>
      }
    >
      <RestaurantMenu slug={slug} />
    </Suspense>
  );
}