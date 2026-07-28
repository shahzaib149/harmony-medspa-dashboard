import { Resolver, lookup as systemLookup } from "node:dns";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";

const FALLBACK_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];
const FALLBACK_REQUEST_TIMEOUT_MS = 20_000;
const nativeFetch = globalThis.fetch.bind(globalThis);
const fallbackResolver = new Resolver();
fallbackResolver.setServers(FALLBACK_DNS_SERVERS);

export const resilientLookup: LookupFunction = (hostname, options, callback) => {
  fallbackResolver.resolve4(hostname, (fallbackError, addresses) => {
    if (!fallbackError && addresses.length > 0) {
      callback(
        null,
        options.all
          ? addresses.map((fallbackAddress) => ({ address: fallbackAddress, family: 4 }))
          : addresses[0],
        options.all ? undefined : 4,
      );
      return;
    }

    systemLookup(hostname, options, (systemError, address, family) => {
      if (systemError) callback(systemError || fallbackError, "", 4);
      else callback(null, address, family);
    });
  });
};

async function fetchWithResolvedHttps(request: Request) {
  const target = new URL(request.url);
  if (target.protocol !== "https:") {
    throw new TypeError(`Network fallback only supports HTTPS (${target.protocol})`);
  }

  const headers = Object.fromEntries(request.headers.entries());
  headers["accept-encoding"] = "identity";
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : Buffer.from(await request.arrayBuffer());

  return new Promise<Response>((resolve, reject) => {
    const outgoing = httpsRequest(target, {
      method: request.method,
      headers,
      lookup: resilientLookup,
    }, (incoming) => {
      const chunks: Buffer[] = [];
      incoming.on("data", (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      incoming.once("end", () => {
        const responseHeaders = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (Array.isArray(value)) value.forEach((item) => responseHeaders.append(name, item));
          else if (value !== undefined) responseHeaders.append(name, value);
        }
        resolve(new Response(Buffer.concat(chunks), {
          status: incoming.statusCode ?? 502,
          statusText: incoming.statusMessage,
          headers: responseHeaders,
        }));
      });
    });

    const abort = () => outgoing.destroy(
      request.signal.reason instanceof Error
        ? request.signal.reason
        : new DOMException("The request was aborted.", "AbortError"),
    );
    if (request.signal.aborted) abort();
    else request.signal.addEventListener("abort", abort, { once: true });
    outgoing.setTimeout(FALLBACK_REQUEST_TIMEOUT_MS, () => {
      outgoing.destroy(new Error("The HTTPS fallback request timed out."));
    });
    outgoing.once("error", reject);
    outgoing.end(body);
  });
}

export async function resilientFetch(input: RequestInfo | URL, init?: RequestInit) {
  const request = new Request(input, init);
  try {
    return await fetchWithResolvedHttps(request.clone());
  } catch (fallbackError) {
    try {
      return await nativeFetch(request);
    } catch (nativeError) {
      throw new TypeError("External HTTPS request failed with system and fallback DNS.", {
        cause: nativeError ?? fallbackError,
      });
    }
  }
}
