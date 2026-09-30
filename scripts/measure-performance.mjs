/**
 * Read-only mobile lab measurements. Never sends engagement or other writes.
 * Uses the project's existing Playwright and a local Chrome installation.
 *
 * node scripts/measure-performance.mjs > /tmp/performance.json
 * PERFORMANCE_ORIGIN=http://localhost:3000 PERFORMANCE_RUNS=3 node scripts/measure-performance.mjs
 * Optional PERFORMANCE_ARTICLE=/solutions/example keeps before/after routes identical.
 * This is a synthetic page-load sample, not field Core Web Vitals or an INP test.
 */
import { chromium, devices } from "@playwright/test";

const origin = new URL(
  process.env.PERFORMANCE_ORIGIN || "https://simple-technologies.vercel.app",
).origin;
const runs = Math.max(
  1,
  Math.min(10, Number(process.env.PERFORMANCE_RUNS) || 3),
);
const profile = {
  device: "Pixel 7",
  latencyMs: 150,
  downloadBytesPerSecond: (1.6 * 1024 * 1024) / 8,
  uploadBytesPerSecond: (750 * 1024) / 8,
  cpuSlowdown: 4,
  observationAfterLoadMs: 2000,
};
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  headless: true,
});
const results = [];
let article = process.env.PERFORMANCE_ARTICLE;

try {
  for (const kind of ["home", "article"]) {
    for (let run = 1; run <= runs; run++) {
      if (kind === "article" && !article)
        throw new Error("No published article link was found on the homepage.");
      const path = kind === "home" ? "/" : article;
      const context = await browser.newContext({
        ...devices["Pixel 7"],
        serviceWorkers: "block",
      });
      let preventedWrites = 0;
      await context.route("**/*", (route) => {
        const request = route.request();
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
          preventedWrites++;
          if (new URL(request.url()).pathname === "/api/engagement")
            return route.fulfill({
              json: { ok: true, likes: 0, liked: false },
            });
          return route.abort("blockedbyclient");
        }
        return route.continue();
      });
      const page = await context.newPage();
      const errors = [];
      const failedRequests = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) => {
        if (request.method() === "GET")
          failedRequests.push({
            path: new URL(request.url()).pathname,
            error: request.failure()?.errorText,
            resourceType: request.resourceType(),
            prefetch: Boolean(request.headers()["next-router-prefetch"]),
          });
      });
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: profile.latencyMs,
        downloadThroughput: profile.downloadBytesPerSecond,
        uploadThroughput: profile.uploadBytesPerSecond,
        connectionType: "cellular4g",
      });
      await cdp.send("Emulation.setCPUThrottlingRate", {
        rate: profile.cpuSlowdown,
      });
      const network = new Map();
      cdp.on("Network.responseReceived", ({ requestId, type, response }) => {
        network.set(requestId, {
          type,
          path: new URL(response.url).pathname,
          status: response.status,
          encodedBytes: 0,
        });
      });
      cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
        const request = network.get(requestId);
        if (request) request.encodedBytes = encodedDataLength;
      });
      await page.addInitScript(() => {
        window.__lab = {
          lcp: null,
          cls: 0,
          longestTaskMs: 0,
          totalBlockingMs: 0,
        };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__lab.lcp = {
              ms: entry.startTime,
              element: entry.element?.tagName || null,
              text: entry.element?.textContent?.trim().slice(0, 120) || null,
              image: entry.url ? new URL(entry.url).pathname : null,
            };
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
        let sessionValue = 0;
        let sessionStart = 0;
        let previousShift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;
            if (
              entry.startTime - previousShift >= 1000 ||
              entry.startTime - sessionStart >= 5000
            ) {
              sessionStart = entry.startTime;
              sessionValue = 0;
            }
            sessionValue += entry.value;
            previousShift = entry.startTime;
            window.__lab.cls = Math.max(window.__lab.cls, sessionValue);
          }
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__lab.longestTaskMs = Math.max(
              window.__lab.longestTaskMs,
              entry.duration,
            );
            window.__lab.totalBlockingMs += Math.max(0, entry.duration - 50);
          }
        }).observe({ type: "longtask", buffered: true });
      });
      const response = await page.goto(new URL(path, origin).href, {
        waitUntil: "load",
        timeout: 90000,
      });
      await page.waitForTimeout(profile.observationAfterLoadMs);
      if (!response || response.status() !== 200)
        throw new Error(
          `${kind}: expected HTTP 200, got ${response?.status()}`,
        );
      if (kind === "home" && !article) {
        article = await page
          .locator('a[href^="/solutions/"]')
          .first()
          .getAttribute("href");
      }
      const documentMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const paints = performance.getEntriesByType("paint");
        return {
          title: document.title,
          h1: document.querySelector("h1")?.textContent?.trim(),
          htmlDecodedBytes: navigation.decodedBodySize,
          htmlEncodedBytes: navigation.encodedBodySize,
          ttfbMs: navigation.responseStart,
          responseEndMs: navigation.responseEnd,
          domContentLoadedMs: navigation.domContentLoadedEventEnd,
          loadMs: navigation.loadEventEnd,
          fcpMs:
            paints.find((entry) => entry.name === "first-contentful-paint")
              ?.startTime ?? null,
          ...window.__lab,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const requests = [...network.values()].filter(
        (request) => request.path !== "/api/engagement",
      );
      const headers = await response.allHeaders();
      results.push({
        kind,
        run,
        path,
        ...documentMetrics,
        requests: requests.length,
        transferredBytes: requests.reduce(
          (sum, request) => sum + request.encodedBytes,
          0,
        ),
        scriptBytes: requests
          .filter((request) => request.type === "Script")
          .reduce((sum, request) => sum + request.encodedBytes, 0),
        imageBytes: requests
          .filter((request) => request.type === "Image")
          .reduce((sum, request) => sum + request.encodedBytes, 0),
        largestTransfers: requests
          .sort((a, b) => b.encodedBytes - a.encodedBytes)
          .slice(0, 5),
        responseHeaders: Object.fromEntries(
          [
            "cache-control",
            "x-vercel-cache",
            "x-vercel-id",
            "x-nextjs-cache",
            "age",
          ]
            .filter((key) => headers[key])
            .map((key) => [key, headers[key]]),
        ),
        preventedWrites,
        errors: [...errors],
        failedRequests: [...failedRequests],
      });
      await context.close();
    }
  }
  const median = (values) => {
    const sorted = values
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const medians = ["home", "article"].map((kind) => {
    const matching = results.filter((result) => result.kind === kind);
    return {
      kind,
      path: matching[0].path,
      ttfbMs: median(matching.map((result) => result.ttfbMs)),
      fcpMs: median(matching.map((result) => result.fcpMs)),
      lcpMs: median(matching.map((result) => result.lcp?.ms ?? null)),
      cls: median(matching.map((result) => result.cls)),
      scriptBytes: median(matching.map((result) => result.scriptBytes)),
      transferredBytes: median(
        matching.map((result) => result.transferredBytes),
      ),
      totalBlockingMs: median(matching.map((result) => result.totalBlockingMs)),
    };
  });
  console.log(
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        origin,
        chrome: browser.version(),
        profile,
        notes: [
          "Fresh browser context and disabled browser cache for every navigation; CDN state is recorded, not controlled.",
          "All non-read requests are blocked or mocked; engagement totals are untouched.",
          "4x CPU slowdown and 1.6 Mbps/150 ms network emulation run on this host; this is not a Lighthouse score or field data.",
          "CLS and long tasks cover navigation through two seconds after load; no scrolling, advertising consent or interactions are performed.",
          "Total blocking milliseconds sums long-task excess over 50 ms over the observation window; it is not Lighthouse TBT.",
          "INP requires real interaction/field measurement and is not reported by this script.",
          "TTFB can describe a streamed document shell; response-end and LCP measure when the rest of the page arrives and appears.",
          "Next.js may cancel speculative prefetches; failed GET requests are reported with their type and prefetch header.",
        ],
        medians,
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
