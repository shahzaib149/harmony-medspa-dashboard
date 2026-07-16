import { leadViewFormula, normalizeLeadView } from "@/lib/leads/view";

function formulaString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').slice(0, 150);
}

export function buildLeadFormula(
  searchParams: URLSearchParams,
  options: { includeView?: boolean } = {},
) {
  const filters: string[] = [];
  if (options.includeView !== false) {
    const viewFormula = leadViewFormula(normalizeLeadView(searchParams.get("view")));
    if (viewFormula) filters.push(viewFormula);
  }

  const search = searchParams.get("search")?.trim();
  if (search) {
    const term = formulaString(search.toLowerCase());
    filters.push(
      `OR(FIND("${term}",LOWER({Name}&""))>0,FIND("${term}",LOWER({Email}&""))>0,FIND("${term}",LOWER({Phone}&""))>0)`,
    );
  }

  const recordId = searchParams.get("recordId")?.trim();
  if (recordId && /^rec[a-zA-Z0-9]+$/.test(recordId)) {
    filters.push(`RECORD_ID()="${recordId}"`);
  }

  const exact = (params: string[], field: string) => {
    const value = params
      .map((param) => searchParams.get(param)?.trim())
      .find((candidate) => candidate && candidate.toLowerCase() !== "all");
    if (value) filters.push(`{${field}}="${formulaString(value)}"`);
  };

  const status =
    searchParams.get("leadStatus")?.trim() || searchParams.get("status")?.trim();
  if (status && status.toLowerCase() !== "all") {
    filters.push(
      status === "Duplicate"
        ? 'OR({Status}="Duplicate",{Duplicate Flag}=TRUE())'
        : `{Status}="${formulaString(status)}"`,
    );
  }

  exact(["source"], "Source");

  const delivery = (param: string, field: string) => {
    const value = searchParams.get(param);
    if (value === "sent") {
      filters.push(
        `OR(LOWER({${field}}&"")="sent",LOWER({${field}}&"")="delivered")`,
      );
    }
    if (value === "not_sent") {
      filters.push(
        `AND(LOWER({${field}}&"")!="sent",LOWER({${field}}&"")!="delivered")`,
      );
    }
  };

  delivery("emailStatus", "Email Sent Status");
  delivery("smsStatus", "SMS Sent Status");

  const replied = searchParams.get("replied");
  if (replied === "true" || replied === "false") {
    filters.push(`{Replied}=${replied === "true" ? "TRUE()" : "FALSE()"}`);
  }

  const campaign = searchParams.get("campaign")?.trim();
  if (campaign === "speed-to-lead") {
    filters.push(
      'OR(LOWER({Email Sent Status}&"")="sent",LOWER({Email Sent Status}&"")="delivered",LOWER({SMS Sent Status}&"")="sent",LOWER({SMS Sent Status}&"")="delivered")',
    );
  }
  if (campaign === "14-day-nurture") {
    filters.push("COUNTA({Nurture Enrollments})>0");
  }
  if (campaign === "none") {
    filters.push(
      'AND(COUNTA({Nurture Enrollments})=0,LOWER({Email Sent Status}&"")!="sent",LOWER({Email Sent Status}&"")!="delivered",LOWER({SMS Sent Status}&"")!="sent",LOWER({SMS Sent Status}&"")!="delivered")',
    );
  }

  exact(["campaignStatus"], "Nurture Status");
  exact(["currentStep", "campaignStep"], "Nurture Current Step");

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    filters.push(
      `IS_AFTER({Lead Created At},DATEADD(DATETIME_PARSE("${dateFrom}"),-1,'seconds'))`,
    );
  }
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    filters.push(
      `IS_BEFORE({Lead Created At},DATEADD(DATETIME_PARSE("${dateTo}"),1,'days'))`,
    );
  }

  if (!filters.length) return "";
  return filters.length > 1 ? `AND(${filters.join(",")})` : filters[0];
}
