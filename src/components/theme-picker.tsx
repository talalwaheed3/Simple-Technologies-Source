"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_KEY, themePreference, type ThemePreference } from "@/lib/theme";

const eventName = "site-theme-change";
const getSnapshot = () =>
  themePreference(document.documentElement.dataset.themePreference);
const getServerSnapshot = (): ThemePreference => "system";

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme =
    preference === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;
}

function subscribe(callback: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const update = () => {
    applyTheme(getSnapshot());
    callback();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === THEME_KEY || event.key === null) {
      applyTheme(themePreference(event.newValue));
      callback();
    }
  };
  window.addEventListener(eventName, update);
  window.addEventListener("storage", storage);
  media.addEventListener("change", update);
  update();
  return () => {
    window.removeEventListener(eventName, update);
    window.removeEventListener("storage", storage);
    media.removeEventListener("change", update);
  };
}

export function ThemePicker() {
  const preference = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const picker = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    // A label briefly blurs the radio before forwarding its click. Hiding the
    // details in that blur interrupts native activation and can crash Chrome.
    // Dismiss only on an actual pointer/focus target outside the picker.
    function closeOutside(event: Event) {
      const menu = picker.current;
      if (
        menu &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      ) {
        menu.open = false;
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, []);
  function choose(value: ThemePreference) {
    applyTheme(value);
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* The current page still works without storage. */
    }
    window.dispatchEvent(new Event(eventName));
  }
  return (
    <details
      className="theme-picker"
      ref={picker}
      onKeyDown={(event) => {
        if (event.key === "Escape" && picker.current) {
          picker.current.open = false;
          picker.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Color theme" title="Choose color theme">
        <Sun className="theme-sun" size={20} aria-hidden="true" />
        <Moon className="theme-moon" size={20} aria-hidden="true" />
      </summary>
      <fieldset className="theme-options">
        <legend>Color theme</legend>
        {(["light", "dark", "system"] as const).map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="color-theme"
              value={value}
              checked={preference === value}
              onChange={() => choose(value)}
            />
            {value === "system"
              ? "Use device setting"
              : value === "dark"
                ? "Dark"
                : "Light"}
          </label>
        ))}
      </fieldset>
    </details>
  );
}
