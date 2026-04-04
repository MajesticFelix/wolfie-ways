import { getRoutes, getStops, getPatterns, getStopImages, getVersionId } from "@/lib/api/spot-server";
import { TransitProvider } from "@/lib/stores/transit-store";
import { HomeClient } from "./home-client";

export default async function Home() {
  const [routes, stops, patterns, stopImages, initialVersion] = await Promise.all([
    getRoutes(),
    getStops(),
    getPatterns(),
    getStopImages(),
    getVersionId(),
  ]);

  return (
    <TransitProvider>
      <HomeClient
        routes={routes.sort((a, b) => a.order - b.order)}
        stops={stops}
        patterns={patterns}
        stopImages={stopImages}
        initialVersion={initialVersion}
      />
    </TransitProvider>
  );
}
