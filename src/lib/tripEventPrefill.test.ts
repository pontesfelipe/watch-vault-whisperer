import { describe, expect, it } from "vitest";
import { tripEventPrefill } from "./tripEventPrefill";

describe("trip to event prefill", () => {
  it("copies trip location into event location", () => {
    expect(tripEventPrefill({ location: "Chicago", notes: "" }, { location: "Old location", purpose: "" }).location).toBe("Chicago");
  });
  it("copies trip comments into event purpose, including multiple lines", () => {
    expect(tripEventPrefill({ location: "Chicago", notes: "Client meeting\nDinner" }, { location: "", purpose: "" }).purpose).toBe("Client meeting\nDinner");
  });
  it("does not erase event values when trip fields are empty", () => {
    expect(tripEventPrefill({ location: " ", notes: "" }, { location: "Tokyo", purpose: "Wedding" })).toEqual({ location: "Tokyo", purpose: "Wedding" });
  });
});