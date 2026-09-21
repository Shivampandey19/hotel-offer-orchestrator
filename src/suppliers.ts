import { SupplierHotel } from "./types";

const SUPPLIER_A: SupplierHotel[] = [
  { hotelId: "a1", name: "Holtin", price: 6000, city: "delhi", commissionPct: 10 },
  { hotelId: "a2", name: "Radison", price: 5900, city: "delhi", commissionPct: 13 },
  { hotelId: "a3", name: "Taj Palace", price: 8500, city: "delhi", commissionPct: 12 },
  { hotelId: "a4", name: "Metro Inn", price: 4200, city: "delhi", commissionPct: 8 },
  { hotelId: "a5", name: "Jaipur Grand", price: 5100, city: "jaipur", commissionPct: 11 }
];

const SUPPLIER_B: SupplierHotel[] = [
  { hotelId: "b1", name: "Holtin", price: 5340, city: "delhi", commissionPct: 20 },
  { hotelId: "b2", name: "Radison", price: 6100, city: "delhi", commissionPct: 15 },
  { hotelId: "b3", name: "The Oberoi", price: 11000, city: "delhi", commissionPct: 18 },
  { hotelId: "b4", name: "Metro Inn", price: 4000, city: "delhi", commissionPct: 9 },
  { hotelId: "b5", name: "Pink City Stay", price: 3500, city: "jaipur", commissionPct: 7 }
];

export function getSupplierHotels(
  supplier: "Supplier A" | "Supplier B",
  city: string
): SupplierHotel[] {
  const source = supplier === "Supplier A" ? SUPPLIER_A : SUPPLIER_B;
  return source.filter((hotel) => hotel.city.toLowerCase() === city.toLowerCase());
}
