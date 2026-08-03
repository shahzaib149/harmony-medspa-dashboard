async function main() {
  const jsRes = await fetch("https://harmony-medspa.vercel.app/_next/static/chunks/3t9noi29quzv0.js");
  const js = await jsRes.text();
  console.log("Chunk length:", js.length);

  const idx = js.indexOf("CONTACT_WEBHOOK_URL");
  if (idx !== -1) {
    console.log("=== Context around CONTACT_WEBHOOK_URL ===");
    console.log(js.slice(Math.max(0, idx - 500), Math.min(js.length, idx + 1000)));
  } else {
    console.log("CONTACT_WEBHOOK_URL not found directly");
  }
}

main().catch(console.error);
