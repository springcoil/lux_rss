import { describe, expect, it } from "vitest";
import { parseFeedDate } from "../feed-parser";
import { formatDate } from "../format-date";

describe("parseFeedDate", () => {
  it("returns null for null/undefined/empty", () => {
    expect(parseFeedDate(null)).toBeNull();
    expect(parseFeedDate(undefined)).toBeNull();
    expect(parseFeedDate("")).toBeNull();
  });

  it("returns null for unparseable strings", () => {
    expect(parseFeedDate("not a date")).toBeNull();
    expect(parseFeedDate("Mon, 32 Foo 2025 25:99:99")).toBeNull();
    expect(parseFeedDate("2024-13-99T99:99:99Z")).toBeNull();
  });

  it("returns null for an Invalid Date instance", () => {
    expect(parseFeedDate(new Date("garbage"))).toBeNull();
  });

  it("returns Date for valid ISO 8601 string", () => {
    const d = parseFeedDate("2026-05-04T10:00:00Z");
    expect(d).toBeInstanceOf(Date);
    expect(d?.getTime()).toBe(Date.UTC(2026, 4, 4, 10, 0, 0));
  });

  it("returns Date for RFC 2822 / pubDate string", () => {
    const d = parseFeedDate("Tue, 04 May 2026 12:00:00 GMT");
    expect(d).toBeInstanceOf(Date);
    expect(Number.isFinite(d?.getTime())).toBe(true);
    expect(d?.getTime()).toBe(Date.UTC(2026, 4, 4, 12, 0, 0));
  });

  it("returns the same Date for a valid Date input", () => {
    const input = new Date("2026-01-15T00:00:00Z");
    const out = parseFeedDate(input);
    expect(out).toBe(input);
  });
});

describe("formatDate", () => {
  it("returns dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns dash for an Invalid Date instance", () => {
    expect(formatDate(new Date("garbage"))).toBe("—");
  });

  it("returns dash for a malformed string", () => {
    expect(formatDate("not a date")).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("formats a valid Date", () => {
    const out = formatDate(new Date("2026-05-04T10:00:00Z"));
    expect(out).not.toBe("—");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("formats a valid ISO string", () => {
    const out = formatDate("2026-05-04T10:00:00Z");
    expect(out).not.toBe("—");
    expect(typeof out).toBe("string");
  });

  it("does not throw RangeError for any input — regression for prod crash", () => {
    expect(() => formatDate(null)).not.toThrow();
    expect(() => formatDate(new Date("garbage"))).not.toThrow();
    expect(() => formatDate("not a date")).not.toThrow();
    expect(() => formatDate("")).not.toThrow();
    expect(() => formatDate("2026-05-04T10:00:00Z")).not.toThrow();
  });
});
