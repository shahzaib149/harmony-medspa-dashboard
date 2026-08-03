async function main() {
  const res = await fetch("https://harmony-medspa.vercel.app/landing");
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  const html = await res.text();

  const scriptSrcs = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(
    (m) => m[1]
  );
  console.log("Script sources found:", scriptSrcs);

  for (const src of scriptSrcs) {
    const jsRes = await fetch("https://harmony-medspa.vercel.app" + src);
    const js = await jsRes.text();
    if (
      js.includes("landing-contact-form") ||
      js.includes("hook.us2.make.com") ||
      js.includes("fetch(") ||
      js.includes("Submit") ||
      js.includes("submit") ||
      js.includes("http")
    ) {
      console.log("=== Matches in JS chunk:", src, "===");
      const makes = js.match(/https:\/\/[^\s'"]*make[^\s'"]*/gi);
      if (makes) console.log("  Make URLs:", makes);

      const apis = js.match(/\/api\/[a-zA-Z0-9_\-\/]+/gi);
      if (apis) console.log("  API URLs:", apis);

      const fetches = js.match(/fetch\([^)]+\)/gi);
      if (fetches) console.log("  Fetches:", fetches.slice(0, 10));

      const forms = js.match(/on[sS]ubmit[^{=]+[^{}]+\}/g);
      if (forms) console.log("  Submits:", forms.slice(0, 5));
    }
  }
}

main().catch(console.error);
