import axios from "axios";
import { config } from "./config";
import { logger } from "./logger";
import { saveOffers } from "./redis";
import { HotelOffer, SupplierHotel } from "./types";

async function fetchSupplier(path: string, city: string): Promise<SupplierHotel[]> {
  const response = await axios.get<SupplierHotel[]>(
    `${config.supplierBaseUrl}${path}`,
    { params: { city }, timeout: 5000 }
  );
  return response.data;
}

export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  return fetchSupplier("/supplierA/hotels", city);
}

export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  return fetchSupplier("/supplierB/hotels", city);
}

export async function persistOffers(city: string, offers: HotelOffer[]): Promise<void> {
  await saveOffers(city, offers);
  logger.info({ city, count: offers.length }, "Saved deduplicated offers to Redis");
}
