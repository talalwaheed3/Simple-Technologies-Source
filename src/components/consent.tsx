"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Script from "next/script";
type Choice = "yes" | "no" | null;
let sessionChoice: Choice | undefined;
function subscribe(callback: () => void) {
  const changed = (event: StorageEvent) => {
    if (event.key !== null && event.key !== "st_consent") return;
    sessionChoice = undefined;
    callback();
  };
  window.addEventListener("st-consent", callback);
  window.addEventListener("storage", changed);
  return () => {
    window.removeEventListener("st-consent", callback);
    window.removeEventListener("storage", changed);
  };
}
function snapshot() {
  if (sessionChoice !== undefined) return sessionChoice;
  try {
    if (sessionStorage.getItem("st_consent_essential") === "yes") return "no";
  } catch {}
  try {
    const value = localStorage.getItem("st_consent");
    return value === "yes" || value === "no" ? value : null;
  } catch {
    return null;
  }
}
function useConsent() {
  return useSyncExternalStore(subscribe, snapshot, () => "pending");
}
function choose(value: Choice) {
  sessionChoice = value;
  try {
    // A tab-level denial also survives a reload if localStorage is read-only.
    if (value === "no") sessionStorage.setItem("st_consent_essential", "yes");
    else sessionStorage.removeItem("st_consent_essential");
  } catch {}
  try {
    if (value === null) localStorage.removeItem("st_consent");
    else localStorage.setItem("st_consent", value);
    sessionChoice = undefined;
  } catch {
    // Storage may be disabled. Keep the explicit choice for this page only.
  }
  window.dispatchEvent(new Event("st-consent"));
}
function OptionalServices() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(() => setReady(true), {
          timeout: 2000,
        });
      } else {
        timer = setTimeout(() => setReady(true), 1);
      }
    };
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });
    return () => {
      window.removeEventListener("load", load);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  if (!ready) return null;
  return (
    <>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
          <Script id="ga-init">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(process.env.NEXT_PUBLIC_GA_ID)});`}</Script>
        </>
      )}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
        <Script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
        />
      )}
    </>
  );
}
export function Consent() {
  const choice = useConsent();
  const enabled = Boolean(
    process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
  );
  return (
    <>
      {enabled && choice === null && (
        <div className="consent" role="region" aria-label="Privacy choices">
          <p>
            Optional analytics and advertising use third-party services.
            Essential anonymous helpful votes and security cookies work without
            them.
          </p>
          <div className="form-actions">
            <button
              onClick={() => {
                choose("no");
                window.location.reload();
              }}
              className="secondary"
            >
              Essential only
            </button>
            <button onClick={() => choose("yes")}>
              Allow optional services
            </button>
          </div>
        </div>
      )}
      {enabled && choice !== "pending" && choice !== null && (
        <button
          className="secondary small"
          style={{ margin: "0 18px 15px" }}
          onClick={() => choose(null)}
        >
          Privacy choices
        </button>
      )}
      {enabled && choice === "yes" && <OptionalServices />}
    </>
  );
}
export function AdSlot() {
  const show = useConsent() === "yes";
  const slot = useRef<HTMLModElement>(null);
  const requested = useRef<HTMLModElement | null>(null);
  useEffect(() => {
    if (
      show &&
      slot.current &&
      requested.current !== slot.current &&
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT &&
      process.env.NEXT_PUBLIC_ADSENSE_SLOT
    ) {
      const win = window as Window & { adsbygoogle?: object[] };
      try {
        (win.adsbygoogle = win.adsbygoogle || []).push({});
        requested.current = slot.current;
      } catch {}
    }
  }, [show]);
  if (
    !process.env.NEXT_PUBLIC_ADSENSE_CLIENT ||
    !process.env.NEXT_PUBLIC_ADSENSE_SLOT
  )
    return null;
  return (
    <aside className="ad-slot" aria-label="Advertisement">
      <span className="small muted">Advertisement</span>
      {show && (
        <ins
          ref={slot}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: 250 }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT}
          data-full-width-responsive="false"
        />
      )}
    </aside>
  );
}
