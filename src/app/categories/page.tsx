import Link from "next/link";
import { categories } from "@/lib/types";
export const metadata = {
  title: "Troubleshooting categories",
  description:
    "Browse computer troubleshooting by category: Windows, storage and recovery, BIOS and boot, drivers and Wi-Fi, Linux, macOS, hardware and development.",
  alternates: { canonical: "/categories" },
};
export default function Categories() {
  return (
    <div className="wrap section">
      <h1>Troubleshooting categories</h1>
      <p className="muted">
        Start with the part of your system that needs attention.
      </p>
      <div className="categories">
        {categories.map((c) => (
          <Link
            className="category"
            key={c}
            href={`/solutions?category=${encodeURIComponent(c)}`}
          >
            {c} →
          </Link>
        ))}
      </div>
    </div>
  );
}
