import "server-only";

import { request as httpsRequest } from "node:https";
import { resilientLookup } from "@/lib/network/resilient-fetch";

const DEFAULT_MAKE_PUBLISH_AD_WEBHOOK_URL =
  "https://hook.us2.make.com/j51ev3akcj3svqgnxbi52f8a9v4rczhk";
const MAKE_TIMEOUT_MS = 15_000;

function publishAdWebhookUrl() {
  return process.env.MAKE_PUBLISH_AD_WEBHOOK_URL?.trim()
    || DEFAULT_MAKE_PUBLISH_AD_WEBHOOK_URL;
}

export function makePublishAdFormBody(payload: Record<string, unknown>) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    body.set(
      key,
      value !== null && typeof value === "object"
        ? JSON.stringify(value)
        : String(value ?? ""),
    );
  }
  body.set("payloadJson", JSON.stringify(payload));
  return body;
}

export async function postPublishAdToMake(payload: Record<string, unknown>) {
  const target = new URL(publishAdWebhookUrl());
  if (target.protocol !== "https:") {
    throw new Error("The Make publishing webhook must use HTTPS.");
  }
  const encodedBody = makePublishAdFormBody(payload).toString();
  const body = Buffer.from(encodedBody, "utf8");

  return new Promise<{ status: number }>((resolve, reject) => {
    const request = httpsRequest(target, {
      method: "POST",
      lookup: resilientLookup,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Content-Length": String(body.byteLength),
        ...(process.env.MAKE_WEBHOOK_SECRET?.trim()
          ? { "x-harmony-webhook-secret": process.env.MAKE_WEBHOOK_SECRET.trim() }
          : {}),
      },
    }, (response) => {
      response.resume();
      response.once("end", () => {
        const status = response.statusCode ?? 502;
        if (status < 200 || status >= 300) {
          reject(new Error(`The Make publishing workflow rejected the request (${status}).`));
          return;
        }
        resolve({ status });
      });
    });

    request.setTimeout(MAKE_TIMEOUT_MS, () => {
      request.destroy(new Error("The Make publishing workflow timed out."));
    });
    request.once("error", (error) => {
      reject(new Error(
        error.message.includes("timed out")
          ? "The Make publishing workflow timed out."
          : "The Make publishing workflow could not be reached.",
        { cause: error },
      ));
    });
    request.end(body);
  });
}
