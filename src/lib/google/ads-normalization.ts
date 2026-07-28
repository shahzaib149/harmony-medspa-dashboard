export type SnapshotMetric = {
  id: string;
  _ts: string;
  _key: string;
  cost: number;
  clicks: number;
  impressions: number;
  conversions: number;
  conversionValue: number;
  conversionValueAvailable: boolean;
  _roasWtd: number;
  [key: string]: unknown;
};

/** One result per canonical resource key; descriptive fields come from the newest snapshot. */
export function aggregateEntitySnapshots<T extends SnapshotMetric>(
  items: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = item._key || item.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item });
      continue;
    }
    const totals = {
      cost: existing.cost + item.cost,
      clicks: existing.clicks + item.clicks,
      impressions: existing.impressions + item.impressions,
      conversions: existing.conversions + item.conversions,
      conversionValue: existing.conversionValue + item.conversionValue,
      conversionValueAvailable:
        existing.conversionValueAvailable || item.conversionValueAvailable,
      roasWtd: existing._roasWtd + item._roasWtd,
    };
    if (item._ts > existing._ts) Object.assign(existing, item);
    existing.cost = totals.cost;
    existing.clicks = totals.clicks;
    existing.impressions = totals.impressions;
    existing.conversions = totals.conversions;
    existing.conversionValue = totals.conversionValue;
    existing.conversionValueAvailable = totals.conversionValueAvailable;
    existing._roasWtd = totals.roasWtd;
  }
  return [...map.values()].map((item) => ({
    ...item,
    ctrPct: item.impressions ? (item.clicks / item.impressions) * 100 : 0,
    avgCpc: item.clicks ? item.cost / item.clicks : 0,
    cpa: item.conversions ? item.cost / item.conversions : 0,
    roas:
      item.conversionValueAvailable && item.cost
        ? item.conversionValue / item.cost
        : 0,
  }));
}

/**
 * Keep the complete entity inventory while applying metrics only from the
 * selected reporting window. This prevents quiet entities from disappearing
 * and prevents historical snapshots from leaking into current-period totals.
 */
export function mergeInventoryAndPerformance<T extends SnapshotMetric>(
  inventoryRows: T[],
  performanceRows: T[],
): T[] {
  const inventory = aggregateEntitySnapshots(inventoryRows);
  const performance = new Map(
    aggregateEntitySnapshots(performanceRows).map((item) => [
      item._key || item.id,
      item,
    ]),
  );

  return inventory.map((item) => {
    const period = performance.get(item._key || item.id);
    const cost = period?.cost ?? 0;
    const clicks = period?.clicks ?? 0;
    const impressions = period?.impressions ?? 0;
    const conversions = period?.conversions ?? 0;
    const conversionValue = period?.conversionValue ?? 0;
    const conversionValueAvailable = period?.conversionValueAvailable ?? false;

    return {
      ...item,
      cost,
      clicks,
      impressions,
      conversions,
      conversionValue,
      conversionValueAvailable,
      _roasWtd: period?._roasWtd ?? 0,
      ctrPct: impressions ? (clicks / impressions) * 100 : 0,
      avgCpc: clicks ? cost / clicks : 0,
      cpa: conversions ? cost / conversions : 0,
      roas: conversionValueAvailable && cost ? conversionValue / cost : 0,
    };
  });
}

export function canonicalAdKey(input: {
  resourceName?: string;
  adId?: string;
  adGroupId?: string;
  fallbackId: string;
}) {
  return (
    input.resourceName ||
    (input.adId && input.adGroupId
      ? `${input.adGroupId}~${input.adId}`
      : input.fallbackId)
  );
}

export function canonicalKeywordKey(input: {
  resourceName?: string;
  criterionId?: string;
  adGroupId?: string;
  fallbackId: string;
}) {
  return (
    input.resourceName ||
    (input.criterionId && input.adGroupId
      ? `${input.adGroupId}~${input.criterionId}`
      : input.fallbackId)
  );
}
