// @vitest-environment jsdom
import React, { StrictMode, useEffect } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AdSlot, Consent } from "../src/components/consent";
import { CommentForm } from "../src/components/engagement";
import { RequestForm } from "../src/components/forms";
import { Screenshot } from "../src/components/screenshot";

vi.mock("next/script", () => ({
  default: function Script({
    src,
    id,
    onReady,
  }: {
    src?: string;
    id?: string;
    onReady?: () => void;
  }) {
    useEffect(() => onReady?.(), [onReady]);
    return <span data-testid="external-script" data-src={src} data-id={id} />;
  },
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_GA_ID", "");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT", "");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
});
afterEach(() => {
  // Clear any in-memory privacy choice while its subscription is still active.
  fireEvent(window, new StorageEvent("storage", { key: "st_consent" }));
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureOptionalServices() {
  vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-test");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT", "test-slot");
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
  const idle = vi.fn<(callback: IdleRequestCallback) => number>(() => 1);
  const cancel = vi.fn();
  vi.stubGlobal("requestIdleCallback", idle);
  vi.stubGlobal("cancelIdleCallback", cancel);
  vi.stubGlobal("adsbygoogle", []);
  return { idle, cancel };
}

describe("optional services stay outside the critical rendering path", () => {
  it("ships no optional scripts or ad space when services are unconfigured", () => {
    localStorage.setItem("st_consent", "yes");
    const { container } = render(
      <>
        <Consent />
        <AdSlot />
      </>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("reserves configured ad space in server HTML without requesting an ad before consent", () => {
    configureOptionalServices();
    const html = renderToString(<AdSlot />);
    expect(html).toContain('class="ad-slot"');
    expect(html).not.toContain("adsbygoogle");
    const { container } = render(
      <>
        <Consent />
        <AdSlot />
      </>,
    );
    expect(
      screen.getByRole("complementary", { name: "Advertisement" }),
    ).toBeTruthy();
    expect(container.querySelector("ins")).toBeNull();
    expect(screen.queryAllByTestId("external-script")).toHaveLength(0);
    expect(
      (window as Window & { adsbygoogle?: object[] }).adsbygoogle,
    ).toHaveLength(0);
  });

  it("waits for idle after consent and only requests each ad element once", () => {
    const { idle } = configureOptionalServices();
    localStorage.setItem("st_consent", "yes");
    render(
      <StrictMode>
        <Consent />
        <AdSlot />
      </StrictMode>,
    );
    expect(screen.queryAllByTestId("external-script")).toHaveLength(0);
    expect(
      (window as Window & { adsbygoogle?: object[] }).adsbygoogle,
    ).toHaveLength(1);
    act(() =>
      idle.mock.calls.at(-1)![0]({ didTimeout: false, timeRemaining: () => 5 }),
    );
    expect(screen.getAllByTestId("external-script")).toHaveLength(3);
  });

  it("cancels deferred optional downloads when the visitor reopens privacy choices", () => {
    const { cancel } = configureOptionalServices();
    localStorage.setItem("st_consent", "yes");
    render(<Consent />);
    fireEvent.click(screen.getByRole("button", { name: "Privacy choices" }));
    expect(cancel).toHaveBeenCalledWith(1);
    expect(localStorage.getItem("st_consent")).toBeNull();
    expect(screen.queryAllByTestId("external-script")).toHaveLength(0);
  });

  it("remains usable with blocked browser storage and defaults to no optional services after a reload", () => {
    configureOptionalServices();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage is blocked", "SecurityError");
    });
    const { unmount } = render(<Consent />);
    // jsdom cannot navigate; emulate the reload after exercising its handler.
    vi.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Essential only" }));
    expect(
      screen.getByRole("button", { name: "Privacy choices" }),
    ).toBeTruthy();
    fireEvent(window, new StorageEvent("storage", { key: "st_consent" }));
    unmount();
    render(<Consent />);
    expect(screen.getByRole("button", { name: "Essential only" })).toBeTruthy();
    expect(screen.queryAllByTestId("external-script")).toHaveLength(0);
  });

  it("keeps revocation after a reload when localStorage contains an old grant and writes fail", () => {
    configureOptionalServices();
    localStorage.setItem("st_consent", "yes");
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      function (this: Storage, key, value) {
        if (this === localStorage)
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        return originalSet.call(this, key, value);
      },
    );
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
      function (this: Storage, key) {
        if (this === localStorage)
          throw new DOMException("Storage is read-only", "SecurityError");
        return originalRemove.call(this, key);
      },
    );
    const { unmount } = render(<Consent />);
    fireEvent.click(screen.getByRole("button", { name: "Privacy choices" }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Essential only" }));
    expect(localStorage.getItem("st_consent")).toBe("yes");
    expect(sessionStorage.getItem("st_consent_essential")).toBe("yes");
    fireEvent(window, new StorageEvent("storage", { key: "st_consent" }));
    unmount();
    render(<Consent />);
    expect(screen.queryAllByTestId("external-script")).toHaveLength(0);
  });
});

describe("form challenges", () => {
  it("does not load the article challenge until the visitor enters the comment form", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-key");
    const widget = { render: vi.fn(() => "widget-1"), remove: vi.fn() };
    vi.stubGlobal("turnstile", widget);
    render(<CommentForm postId="test-post" />);
    expect(screen.queryAllByTestId("external-script")).toHaveLength(0);
    fireEvent.focus(screen.getByLabelText("Display name"));
    await waitFor(() => expect(widget.render).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("external-script").dataset.src).toContain(
      "turnstile",
    );
  });

  it("keeps failed comments and obtains a fresh single-use challenge before retry", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-key");
    const widget = {
      render: vi.fn<
        (element: HTMLElement, options: Record<string, unknown>) => string
      >(() => "widget-1"),
      remove: vi.fn(),
    };
    vi.stubGlobal("turnstile", widget);
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Please try again later." }),
    });
    vi.stubGlobal("fetch", fetch);
    render(<CommentForm postId="test-post" />);
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Reader" },
    });
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "The repair worked." },
    });
    fireEvent.focus(screen.getByLabelText("Display name"));
    await waitFor(() => expect(widget.render).toHaveBeenCalledTimes(1));
    const form = screen
      .getByRole("button", { name: "Submit comment" })
      .closest("form")!;
    fireEvent.submit(form);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain(
      "complete the spam check",
    );
    const complete = widget.render.mock.calls[0][1].callback as (
      token: string,
    ) => void;
    act(() => complete("first-token"));
    fireEvent.submit(form);
    await waitFor(() => expect(widget.render).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetch.mock.calls[0][1].body).token).toBe("first-token");
    expect(
      (screen.getByLabelText("Comment") as HTMLTextAreaElement).value,
    ).toBe("The repair worked.");
    expect(widget.remove).toHaveBeenCalledWith("widget-1");
    fireEvent.submit(form);
    expect(fetch).toHaveBeenCalledTimes(1);
    act(() =>
      (widget.render.mock.calls[1][1].callback as (token: string) => void)(
        "fresh-token",
      ),
    );
    fireEvent.submit(form);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetch.mock.calls[1][1].body).token).toBe("fresh-token");
  });

  it("submits both public forms normally when no challenge is configured", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: "request-reference" }),
      });
    vi.stubGlobal("fetch", fetch);
    const { unmount } = render(<RequestForm />);
    fireEvent.change(screen.getByLabelText("What is the problem?"), {
      target: { value: "SSD missing" },
    });
    fireEvent.change(screen.getByLabelText("Describe what happens"), {
      target: { value: "The Windows installer cannot detect my SSD." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(
      screen.getByRole("button", { name: "Send request" }).closest("form")!,
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "request-reference",
      ),
    );
    expect(fetch.mock.calls[0][0]).toBe("/api/requests");
    unmount();
    render(<CommentForm postId="test-post" />);
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Reader" },
    });
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "This worked." },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Submit comment" }).closest("form")!,
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "waiting for review",
      ),
    );
    expect(fetch.mock.calls[1][0]).toBe("/api/comments");
    expect(screen.queryAllByTestId("external-script")).toHaveLength(0);
  });
});

describe("responsive media", () => {
  it("uses real variant widths and retains preview authorization in every candidate", () => {
    render(
      <Screenshot
        src="/api/media/example?preview=1"
        alt="Repair evidence"
        width={800}
        height={600}
      />,
    );
    const image = screen.getByAltText("Repair evidence") as HTMLImageElement;
    expect(image.getAttribute("srcset")).toBe(
      "/api/media/example?preview=1&w=480 480w, /api/media/example?preview=1&w=960 800w",
    );
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.width).toBe(800);
    expect(image.height).toBe(600);
  });

  it("does not advertise upscaled variants for small originals", () => {
    render(
      <Screenshot
        src="/api/media/small"
        alt="Small screenshot"
        width={320}
        height={240}
        sizes="300px"
      />,
    );
    const image = screen.getByAltText("Small screenshot");
    expect(image.getAttribute("srcset")).toBe("/api/media/small?w=480 320w");
    expect(image.getAttribute("sizes")).toBe("300px");
  });
});
