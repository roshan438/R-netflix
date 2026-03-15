import { describe, expect, it } from "vitest";
import { demoMediaItems } from "@/lib/demo-data";
import { findNextMediaInCollection } from "@/services/player/autoplay";
import { shouldMarkCompleted } from "@/services/player/resumePlayback";

describe("player helpers", () => {
  it("finds the next media item in a collection", () => {
    const next = findNextMediaInCollection(demoMediaItems, "media_anniversary_film");
    expect(next?.id).toBe("media_anniversary_slideshow");
  });

  it("marks media completed near the end", () => {
    expect(shouldMarkCompleted(92, 100)).toBe(true);
    expect(shouldMarkCompleted(30, 100)).toBe(false);
  });
});
