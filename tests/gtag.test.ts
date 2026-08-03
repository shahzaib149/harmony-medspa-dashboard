import assert from "node:assert/strict";
import test from "node:test";
import { trackLeadConversion } from "../src/lib/analytics/gtag";

test("trackLeadConversion returns gracefully when window or gtag is undefined", () => {
  // Should not throw when executed in node environment without window
  assert.doesNotThrow(() => {
    trackLeadConversion();
  });
});

test("trackLeadConversion calls window.gtag with expected conversion payload", () => {
  const originalSendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO;
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO = "AW-11396978687/R0vKCKrFz9kcEP-vwLoq";

  const calls: Array<[string, string, Record<string, unknown>]> = [];
  const fakeGtag = (event: string, action: string, params: Record<string, unknown>) => {
    calls.push([event, action, params]);
  };

  // Mock browser global window object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = {
    gtag: fakeGtag,
  };

  try {
    trackLeadConversion();

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "event");
    assert.equal(calls[0][1], "conversion");
    assert.deepEqual(calls[0][2], {
      send_to: "AW-11396978687/R0vKCKrFz9kcEP-vwLoq",
      value: 100,
      currency: "USD",
    });
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
    if (originalSendTo !== undefined) {
      process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO = originalSendTo;
    } else {
      delete process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO;
    }
  }
});

test("trackLeadConversion skips calling gtag when NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO is missing", () => {
  const originalSendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO;
  delete process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO;

  const calls: unknown[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = {
    gtag: (...args: unknown[]) => calls.push(args),
  };

  try {
    trackLeadConversion();
    assert.equal(calls.length, 0);
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
    if (originalSendTo !== undefined) {
      process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO = originalSendTo;
    }
  }
});
