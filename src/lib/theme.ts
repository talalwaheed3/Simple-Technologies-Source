export const THEME_KEY = "simple-technologies-theme-v1";
export type ThemePreference = "light" | "dark" | "system";

export function themePreference(
  value: string | null | undefined,
): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

// Runs before page content is painted; only the root attributes differ at hydration.
// Keep the storage key and preference validation aligned with the functions above.
export const themeScript = `(function(){var p="system";try{var s=localStorage.getItem("${THEME_KEY}");if(s==="light"||s==="dark")p=s}catch(e){}var r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p})()`;
