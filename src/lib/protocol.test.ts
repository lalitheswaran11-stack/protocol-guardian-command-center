import { describe, expect, it } from "vitest";
import {
  createValidators,
  filterValidators,
  formatCompact,
  formatEth,
  isGuardianConfirmationValid,
  mergeProtocolEvents,
} from "./protocol";

describe("protocol utilities", () => {
  it("formats protocol metrics without false precision", () => {
    expect(formatEth(1_006_482.42)).toBe("1,006,482 ETH");
    expect(formatEth(8.246)).toBe("8.25 ETH");
    expect(formatCompact(5000)).toBe("5K");
  });

  it("creates a stable 5,000-row validator fleet", () => {
    const first = createValidators(5000);
    const second = createValidators(5000);
    expect(first).toHaveLength(5000);
    expect(first[2048]).toEqual(second[2048]);
    expect(first.some((row) => row.state === "offline")).toBe(true);
  });

  it("combines search and operational filters", () => {
    const rows = createValidators(5000);
    const offline = filterValidators(rows, "", "offline");
    expect(offline.length).toBeGreaterThan(0);
    expect(offline.every((row) => row.state === "offline")).toBe(true);
    expect(filterValidators(rows, String(offline[0].index), "offline")).toEqual(
      [offline[0]],
    );
  });

  it("requires the exact guardian confirmation phrase", () => {
    expect(isGuardianConfirmationValid("SIMULATE PAUSE")).toBe(true);
    expect(isGuardianConfirmationValid("simulate pause")).toBe(false);
    expect(isGuardianConfirmationValid("PAUSE")).toBe(false);
  });

  it("drops duplicate events and orders late events by sequence", () => {
    const first = { id: "a", sequence: 10, type: "first", at: "2026-01-01" };
    const older = { id: "b", sequence: 8, type: "older", at: "2026-01-01" };
    expect(mergeProtocolEvents([first], first)).toEqual([first]);
    expect(
      mergeProtocolEvents([first], older).map((event) => event.id),
    ).toEqual(["a", "b"]);
  });
});
