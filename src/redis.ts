import Redis from "ioredis";
import { config } from "./config";
import { HotelOffer, HotelResponse } from "./types";

export const redis = new Redis(config.redisUrl);

export const priceIndexKey = (city: string) =>
  `hotels:price:${city.toLowerCase()}`;

export const hotelKey = (city: string, name: string) =>
  `hotel:${city.toLowerCase()}:${encodeURIComponent(name.toLowerCase())}`;

export async function saveOffers(city: string, offers: HotelOffer[]): Promise<void> {
  const pipeline = redis.pipeline();
  const index = priceIndexKey(city);
  pipeline.del(index);

  for (const offer of offers) {
    const key = hotelKey(city, offer.name);
    const response: HotelResponse = {
      name: offer.name,
      price: offer.price,
      supplier: offer.supplier,
      commissionPct: offer.commissionPct
    };
    pipeline.set(key, JSON.stringify(response));
    pipeline.zadd(index, offer.price, key);
  }

  await pipeline.exec();
}

export async function getOffersByPrice(
  city: string,
  minPrice = 0,
  maxPrice = Number.POSITIVE_INFINITY
): Promise<HotelResponse[]> {
  const keys = await redis.zrangebyscore(priceIndexKey(city), minPrice, maxPrice);
  if (!keys.length) return [];

  const values = await redis.mget(...keys);
  return values
    .filter((value): value is string => value !== null)
    .map((value) => JSON.parse(value) as HotelResponse);
}
