import { deduplicateOffers } from "../src/workflows";

describe("deduplicateOffers", () => {
  it("selects the cheaper offer for overlapping hotel names", () => {
    const result = deduplicateOffers(
      [{ hotelId:"a1", name:"Holtin", price:6000, city:"delhi", commissionPct:10 }],
      [{ hotelId:"b1", name:"Holtin", price:5340, city:"delhi", commissionPct:20 }]
    );

    expect(result).toEqual([{
      hotelId:"b1", name:"Holtin", price:5340, city:"delhi",
      commissionPct:20, supplier:"Supplier B"
    }]);
  });

  it("keeps hotels available from only one supplier", () => {
    const result = deduplicateOffers(
      [{ hotelId:"a1", name:"A Hotel", price:1000, city:"delhi", commissionPct:5 }],
      [{ hotelId:"b1", name:"B Hotel", price:2000, city:"delhi", commissionPct:6 }]
    );
    expect(result.map((hotel) => hotel.name)).toEqual(["A Hotel", "B Hotel"]);
  });
});
