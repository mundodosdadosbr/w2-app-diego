import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("dedupes conflicting utilities", () => {
    expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
  });
});
