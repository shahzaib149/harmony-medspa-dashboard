import { createHash } from "node:crypto";

export function enrollmentClaimIdentity(
  campaignSlug: string,
  kind: "existing" | "new",
  identity: string,
  scheduledAtUtc: string,
) {
  const identityHash = createHash("sha256").update(`${kind}:${identity}`).digest("hex");
  return {
    identityHash,
    claimKey: createHash("sha256")
      .update(`${campaignSlug}:${scheduledAtUtc}:${identityHash}`)
      .digest("hex"),
  };
}
