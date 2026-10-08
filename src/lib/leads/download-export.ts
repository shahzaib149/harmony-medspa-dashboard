export async function downloadLeadExport(format: "csv" | "xlsx") {
  const response = await fetch(`/api/airtable/leads/export?format=${format}`, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || "Lead export could not be prepared");
  }
  const url = URL.createObjectURL(await response.blob());
  const download = document.createElement("a");
  download.href = url;
  download.download = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] || `harmony-all-leads.${format}`;
  document.body.appendChild(download);
  download.click();
  download.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
