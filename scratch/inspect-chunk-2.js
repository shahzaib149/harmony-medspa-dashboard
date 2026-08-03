async function main() {
  const jsRes = await fetch("https://harmony-medspa.vercel.app/_next/static/chunks/3t9noi29quzv0.js");
  const js = await jsRes.text();
  
  // Find submission handler logic
  const idx = js.indexOf("CONTACT_WEBHOOK_URL");
  console.log("=== CONTACT_WEBHOOK_URL ===");
  console.log(js.slice(idx, idx + 300));

  // Search for handleSubmit or fetch in other chunks or this chunk
  const fetchIdx = js.indexOf("fetch(");
  console.log("=== fetch in 3t9noi29quzv0.js ===");
  if (fetchIdx !== -1) {
    console.log(js.slice(fetchIdx - 100, fetchIdx + 400));
  }
}

main().catch(console.error);
