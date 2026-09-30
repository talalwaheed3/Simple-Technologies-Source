import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
vi.mock("server-only", () => ({}));
import { processImage } from "../src/lib/images";
describe("private screenshot processing", () => {
  it("rejects a disguised SVG and an oversized upload", async () => {
    await expect(
      processImage(
        new File(
          ['<svg xmlns="http://www.w3.org/2000/svg"></svg>'],
          "fake.png",
          { type: "image/png" },
        ),
      ),
    ).rejects.toThrow();
    await expect(
      processImage(
        new File([new Uint8Array(3145729)], "large.png", { type: "image/png" }),
      ),
    ).rejects.toThrow();
  });
  it("makes bounded WebP derivatives and strips source metadata", async () => {
    const input = await sharp({
      create: { width: 2000, height: 1000, channels: 3, background: "#123456" },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Artist: "Synthetic private fixture" } } })
      .toBuffer();
    const output = await processImage(
      new File([new Uint8Array(input)], "fixture.jpg", { type: "image/jpeg" }),
    );
    const metadata = await sharp(output.data).metadata();
    expect(output.width).toBe(1600);
    expect(output.height).toBe(800);
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    expect(output.variants.map((v) => v.width)).toEqual([480, 960]);
    expect(output.original.equals(input)).toBe(true);
  });
});
