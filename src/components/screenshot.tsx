import { getImageProps } from "next/image";
export function Screenshot({
  src,
  alt,
  width,
  height,
  sizes = "(max-width: 600px) calc(100vw - 36px), (max-width: 900px) calc(100vw - 60px), (max-width: 1165px) calc(100vw - 375px), 790px",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
}) {
  const variant = (size: number) =>
    `${src}${src.includes("?") ? "&" : "?"}w=${size}`;
  const widths = [480, 960, 1600];
  const srcSet = widths
    .filter((_, index) => index === 0 || width > widths[index - 1])
    .map((size) => `${variant(size)} ${Math.min(width, size)}w`)
    .join(", ");
  const { props } = getImageProps({
    src: variant(1600),
    alt,
    width,
    height,
    loading: "lazy",
    // These WebP variants are already resized by our authenticated media route.
    unoptimized: true,
  });
  // The media pipeline already provides WebP variants; getImageProps preserves
  // native lazy loading without shipping an Image component to every reader.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} srcSet={srcSet} sizes={sizes} />;
}
