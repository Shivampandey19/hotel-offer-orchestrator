import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";
import { HotelOffer, SupplierHotel } from "./types";

const { fetchSupplierA, fetchSupplierB, persistOffers } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "15 seconds",
    retry: {
      maximumAttempts: 3,
      initialInterval: "1 second",
      maximumInterval: "5 seconds"
    }
  });

export function deduplicateOffers(
  supplierA: SupplierHotel[],
  supplierB: SupplierHotel[]
): HotelOffer[] {
  const selected = new Map<string, HotelOffer>();
  const all: HotelOffer[] = [
    ...supplierA.map((hotel) => ({ ...hotel, supplier: "Supplier A" as const })),
    ...supplierB.map((hotel) => ({ ...hotel, supplier: "Supplier B" as const }))
  ];

  for (const candidate of all) {
    const key = candidate.name.trim().toLowerCase();
    const existing = selected.get(key);
    if (!existing || candidate.price < existing.price) selected.set(key, candidate);
  }

  return [...selected.values()].sort((a, b) => a.price - b.price);
}

export async function hotelOfferWorkflow(city: string): Promise<HotelOffer[]> {
  const [supplierA, supplierB] = await Promise.all([
    fetchSupplierA(city),
    fetchSupplierB(city)
  ]);

  const offers = deduplicateOffers(supplierA, supplierB);
  await persistOffers(city, offers);
  return offers;
}
