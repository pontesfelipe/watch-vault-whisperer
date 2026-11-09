import { describe, expect, it } from "vitest";
import { belongsToCollectionInsights } from "./collectionInsights";
import { PAST_STATUSES } from "./itemStatus";

const item = {
  collection_id: null,
  archived_collection_id: "watches-a",
  user_id: "owner",
  status: "sold",
  cost: 100,
};

describe("Collection Insights isolation", () => {
  it("includes active items linked to the selected collection", () => {
    expect(belongsToCollectionInsights({ ...item, status: "active", collection_id: "watches-a" }, "watches-a", "owner")).toBe(true);
  });

  it.each(PAST_STATUSES)("keeps %s history only in its original collection", (status) => {
    expect(belongsToCollectionInsights({ ...item, status }, "watches-a", "owner")).toBe(true);
    for (const collection of ["watches-b", "sneakers", "purses"]) {
      expect(belongsToCollectionInsights({ ...item, status }, collection, "owner")).toBe(false);
    }
  });

  it("excludes detached history with no proven origin", () => {
    expect(belongsToCollectionInsights({ ...item, archived_collection_id: null }, "watches-a", "owner")).toBe(false);
  });

  it("does not include another user's detached history", () => {
    expect(belongsToCollectionInsights({ ...item, user_id: "other" }, "watches-a", "owner")).toBe(false);
  });

  it("does not count stale archive origins on active or relocated items", () => {
    expect(belongsToCollectionInsights({ ...item, status: "active" }, "watches-a", "owner")).toBe(false);
    expect(belongsToCollectionInsights({ ...item, collection_id: "watches-b" }, "watches-a", "owner")).toBe(false);
  });

  it("excludes other collections from total and annual spending", () => {
    const items = [
      { ...item, collection_id: "watches-a", status: "active", cost: 200, year: 2026 },
      { ...item, year: 2025 },
      { ...item, archived_collection_id: "watches-b", cost: 300, year: 2026 },
      { ...item, archived_collection_id: "sneakers", cost: 400, year: 2026 },
      { ...item, archived_collection_id: "purses", cost: 500, year: 2025 },
    ].filter((entry) => belongsToCollectionInsights(entry, "watches-a", "owner"));
    expect(items.reduce((sum, entry) => sum + entry.cost, 0)).toBe(300);
    expect(items.filter((entry) => entry.year === 2026).reduce((sum, entry) => sum + entry.cost, 0)).toBe(200);
    expect(items.filter((entry) => entry.year === 2025).reduce((sum, entry) => sum + entry.cost, 0)).toBe(100);
  });
});