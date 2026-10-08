// Preserve the verified caller's session when the export paginates through
// the protected Leads endpoint. Never replace it with a service-role session.
export function leadExportPageRequest(request: Request, params: URLSearchParams) {
  const headers = new Headers();
  for (const name of ["cookie", "authorization"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Request(`${new URL(request.url).origin}/api/airtable/leads?${params}`, { headers });
}

export function allLeadExportParams() {
  return new URLSearchParams({ view: "all", pageSize: "50" });
}

export function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  // Spreadsheet apps must treat lead-supplied text and phone numbers as data.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
