/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node script, run with plain `node`. */
// Black Friday 2026 blog (Phase F of the Black Friday build brief).
// Creates ONE Blogs record with Status "In Review" (never Published; the website reads
// Published only). Facts come only from the staff menu in the build brief §1.
// Usage: node content/2026-11-20-black-friday-blog.cjs            -> dry run (word count only)
//        node content/2026-11-20-black-friday-blog.cjs --create   -> create the record
const { readFileSync } = require("node:fs");
const path = require("node:path");

const SITE = "https://www.harmonymedspafl.com";
const EARLY_ACCESS = "https://mailchi.mp/harmonymedspafl/black-friday-specials";
const ASSETS = "https://jwbngsdmdwaagpksyxxn.supabase.co/storage/v1/object/public/Black%20Friday%202026";
const ENTITY = "Harmony Med Spa, 2184 Gulf Gate Dr., Unit B, Sarasota, FL 34231";

let n = 0;
const id = (prefix) => `bf26-${prefix}-${++n}`;
const p = (text) => ({ id: id("p"), type: "paragraph", text });
const h2 = (text) => ({ id: id("h2"), type: "heading2", text });
const h3 = (text) => ({ id: id("h3"), type: "heading3", text });
const ul = (lines) => ({ id: id("ul"), type: "bulleted-list", text: lines.join("\n") });
const ol = (lines) => ({ id: id("ol"), type: "numbered-list", text: lines.join("\n") });

const faq = [
  ["When is Harmony Med Spa's Black Friday 2026 sale?",
    "Member early access runs November 23–26, 2026, and the public Black Friday sale runs November 27–30, 2026. All offers end at the close of November 30, 2026 (Eastern time)."],
  ["Can new patients get member pricing during Black Friday?",
    "Yes. New patients who enroll in an eligible Harmony membership receive member pricing as soon as their first membership payment is completed, including during member early access November 23–26, 2026."],
  ["Can I combine Black Friday offers with other discounts?",
    "Generally no. Black Friday offers are not stacked with other discounts, except the stated injectable benefit: members' 10% injectable discount is applied first, before the Black Friday offer on RHA fillers and Sculptra."],
  ["Do I have to use my treatments during Black Friday?",
    "No. You prepay during the sale dates (November 23–30, 2026) and can schedule treatments later. Treatments are redeemable within 365 days of purchase unless listed otherwise, with provider approval."],
  ["How does the Black Friday gift card bonus work?",
    "Buy a gift card of $100 or more November 27–30, 2026, paid with new funds, and you receive a separate promotional credit worth 10% of the amount. The credit goes to the purchaser, can be used starting December 1, 2026 on regular-priced services and skincare, and can't be used toward another gift card. Purchased gift cards never expire."],
  ["How do I purchase a Black Friday special?",
    "Call or text Harmony Med Spa at (941) 923-8990, visit the clinic, or book online. Full prepayment is required during the sale dates; there are no deposits or price holds."],
  ["Where is Harmony Med Spa located?",
    `${ENTITY}, in the Gulf Gate area. The clinic serves patients from Sarasota, Siesta Key, Osprey, Venice, Lakewood Ranch and Bradenton.`],
  ["Who decides dosing and treatment eligibility?",
    "Your Harmony provider. Every Black Friday treatment requires provider approval, and eligibility and dosing are determined at your consultation."],
];

const img = (id, url, alt, caption) => ({ id, type: "image", url, alt, caption });
const content = [
  img("bf26-img-room", `${ASSETS}/Signature%20Facials/DJI_20261104_103423_693.JPG`, "A treatment room at Harmony Med Spa in Sarasota", "Harmony Med Spa's Signature Facial room in Gulf Gate, Sarasota."),
  p(`Harmony Med Spa's Black Friday Beauty Event runs in two windows in 2026: member early access November 23–26, and the public sale November 27–30. ${ENTITY}, is offering prepaid savings on Daxxify, RHA fillers, Sculptra, Glo2Facial and Signature Facial packages, RF microneedling, CO2, IPL and laser hair removal packages, selected skincare, gift cards and a $150 hormone optimization exam.`),
  p("In short: prepay during the sale, then schedule your treatments any time within 365 days, with your provider's approval. Members save more, and new patients can unlock member pricing by joining a membership."),
  p("The event is for patients across Sarasota and the Gulf Gate neighborhood, and for those who visit from Siesta Key, Osprey, Venice, Lakewood Ranch and Bradenton. Whether you already have a treatment in mind or want to plan the year ahead, Black Friday is the one time each year these package prices are available."),
  h3("How member early access works"),
  p("From November 23 through November 26, 2026, Harmony members can shop the Black Friday specials before the public sale opens. If you are not a member yet, you can still take part: new patients who enroll in an eligible membership receive member pricing as soon as their first membership payment is completed. The public sale then opens to everyone from November 27 through November 30, 2026."),

  h2("Black Friday Injectable Specials in Sarasota"),
  p("Injectables are the centerpiece of the event. Each offer is prepaid and can be used over multiple visits within 365 days. Your provider determines dosing and eligibility."),
  h3("Daxxify: buy 100 units, get 40 free"),
  p("Prepay for 100 units of Daxxify and receive 40 more, for 140 prepaid units in total. The price is $1,200.00 for nonmembers and $1,080.00 for members, a member saving of $120.00. The limit is one bundle per patient unless your provider approves more."),
  h3("RHA fillers: buy one syringe, get the second 50% off"),
  p("Mix and match RHA 2, RHA 3, RHA 4 and RHA Redensity. The lower-priced syringe is 50% off. Based on two $714 syringes, a pair is $1,071.00 for nonmembers and $963.90 for members, a member saving of $107.10. Multiple pairs are available with provider approval."),
  h3("Sculptra: save up to $1,000"),
  ul([
    "2 vials, $250 off: $1,382.00 nonmember, $1,218.80 member",
    "4 vials: $600 off (package total confirmed when you call)",
    "6 vials: $1,000 off (package total confirmed when you call)",
  ]),
  p("How member pricing works on fillers and Sculptra: members' usual 10% injectable discount is applied first, and then the Black Friday offer is applied. That is why the member price is lower than a simple percentage off. Sculptra can be used over multiple visits with provider approval."),

  h2("Facial Specials: Glo2Facial & Signature Facial Packages"),
  p("Both facial packages are priced the same for members and nonmembers, are limited to one 4-pack per patient, and are redeemable within 365 days."),
  ul([
    "Glo2Facial, 4 treatments: $499.00. Full prepayment; no further discounts.",
    "Signature Facial, 4 treatments plus enhancements: $399.00. Each visit includes one free enhancement, up to $100 in added value: Diamond Microdermabrasion, Hydrofacial or Dermaplaning.",
  ]),

  h2("Laser & Skin Resurfacing Packages: RF Microneedling, CO2, IPL & Laser Hair Removal"),
  p(`Eligible device packages are 20% off for nonmembers and 30% off for members. This covers Secret PRO RF microneedling, fractional CO2, IPL photofacial and laser hair removal. See every treatment area and package price at ${SITE}/black-friday#devices.`),
  ul([
    "RF microneedling, fractional CO2 and IPL packages include 3 sessions of the same treatment.",
    "Laser hair removal packages include 6 sessions.",
    "Existing RF + CO2 combination packages also qualify. Standalone add-ons are excluded.",
    "Multiple package purchases are allowed with provider approval.",
    "Pay in full during Black Friday and schedule your sessions later, within 365 days of purchase, subject to clinical eligibility.",
  ]),
  p("Example package totals (nonmember / member): RFMN Face $1,632.00 / $1,428.00; FCO2 Face $1,468.80 / $1,285.20; IPL Full Face $1,060.80 / $928.20; laser hair removal for underarms $600.00 / $525.00. No other discounts may be stacked on device packages."),

  h2("Skincare Savings & Free Gift"),
  p("Selected skincare products are 25% off for everyone during the event. Only individually approved products qualify, and this replaces members' normal 10% skincare discount rather than adding to it."),
  p("Spend $399 or more on skincare, after the discount and before tax, and choose one free gift from the approved options, including a Revision Brightening Facial Wash travel size, while supplies last."),

  h2("Black Friday Gift Cards: Get 10% Back"),
  img("bf26-img-giftcard", `${ASSETS}/Gift%20Cards/HMS_Gift%20Card_Granite_Gold.png`, "Harmony Med Spa black and gold gift card", "Harmony Med Spa gift cards never expire."),
  p(`From November 27 through November 30, 2026, buy a Harmony gift card of $100 or more and receive 10% back as a separate bonus credit for you, with no cap. For example, a $250 gift card earns a $25 bonus. Request a gift card at ${SITE}/gift-cards and our team will contact you to arrange secure payment.`),
  ul([
    "The bonus applies to gift cards purchased November 27–30, 2026 with new funds (not a prepaid balance, gift card, credit or Beauty Bank).",
    "The bonus credit is issued to the purchaser after payment and can be used starting December 1, 2026.",
    "It applies to regular-priced services and skincare, never toward another gift card. Full bonus terms are provided at purchase.",
    "Purchased gift cards never expire.",
    "We contact the purchaser only, never the gift recipient, so the surprise stays a surprise.",
  ]),

  h2("Hormone Optimization: $150 BHRT Initial Exam"),
  p("The bioidentical hormone replacement therapy (BHRT) initial examination is $150.00 (regularly $300) when you enroll and pay by November 30, 2026. The prepaid exam has no expiration date. It includes an assessment with a nurse practitioner, a customized plan and follow-up consultations for one year from the exam. Labs, medications, pellets and other procedures are extra."),

  h2("How to Shop Harmony's Black Friday Event"),
  ol([
    `Call or text (941) 923-8990, or book online, to claim an offer. Members can shop from November 23; everyone can shop November 27–30, 2026. Want the specials first? Request early access at ${EARLY_ACCESS}.`,
    "Prepay in full during the sale dates, in the office, by phone or through approved online checkout. There are no deposits or price holds.",
    "Schedule your treatments when it suits you. Treatments are redeemable within 365 days unless listed otherwise, and every treatment requires provider approval.",
  ]),
  p("Member pricing requires an active membership with the first payment completed. VIP Beauty Bank funds may be used toward treatments after the discount."),

  h2("Why Sarasota Patients Choose Harmony Med Spa"),
  p(`Harmony Med Spa is a provider-led medical spa in Sarasota's Gulf Gate area. Treatments are planned and performed with a licensed provider, who reviews your goals, health history and eligibility before any treatment. Visit ${ENTITY}, or call (941) 923-8990 with questions about any Black Friday special.`),
  p("Results vary. Eligibility and dosing determined by your provider. No results are guaranteed."),

  { id: id("faq"), type: "faq", items: faq.map(([question, answer], index) => ({ id: `bf26-faq-${index + 1}`, question, answer })) },
];

const article = {
  title: "Harmony Med Spa Black Friday 2026: Injectable, Facial, Laser & Wellness Specials in Sarasota",
  slug: "black-friday-2026-sarasota-med-spa-specials",
  primaryKeyword: "black friday med spa deals sarasota",
  category: "Promotions",
  cms: {
    tags: ["Black Friday", "Promotions", "Injectables", "Facials", "Laser", "Gift Cards", "Sarasota"],
    excerpt: "Harmony Med Spa's Black Friday Beauty Event offers member early access November 23–26, 2026 and a public sale November 27–30. Prepay for injectable, facial, laser, skincare and wellness specials and schedule treatments within 365 days.",
    content,
    seoTitle: "Black Friday Med Spa Deals Sarasota 2026 | Harmony",
    metaDescription: "Harmony Med Spa Black Friday 2026 in Sarasota: Daxxify, RHA and Sculptra savings, facial packages and up to 30% off laser. Member early access Nov 23–26.",
    relatedServiceUrl: `${SITE}/black-friday`,
    relatedArticleUrls: [],
    ctaLabel: "View All Black Friday Specials",
    ctaUrl: `${SITE}/black-friday`,
  },
};

function words(text) { return (text.match(/[A-Za-z0-9$][A-Za-z0-9$.,'’%+-]*/g) || []).length; }
const wordCount = content.reduce((sum, block) => sum + (block.type === "faq" ? block.items.reduce((s, i) => s + words(i.question) + words(i.answer), 0) : words(block.text || "")), 0);
console.log(JSON.stringify({ wordCount, seoTitleLength: article.cms.seoTitle.length, metaLength: article.cms.metaDescription.length }));

async function create() {
  const envText = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const token = (envText.match(/^AIRTABLE_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^"|"$/g, "");
  if (!token) throw new Error("AIRTABLE_API_KEY missing");
  const endpoint = "https://api.airtable.com/v0/appNL010pW9LUpgST/Blogs";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const existing = await fetch(`${endpoint}?${new URLSearchParams({ filterByFormula: `{Slug}="${article.slug}"`, "fields[]": "Slug" })}`, { headers });
  const found = await existing.json();
  if (!existing.ok) throw new Error(`read failed ${existing.status}`);
  if (found.records.length) { console.log(JSON.stringify({ skipped: "slug exists", id: found.records[0].id })); return; }
  const now = new Date().toISOString();
  const response = await fetch(endpoint, {
    method: "POST", headers,
    body: JSON.stringify({ fields: {
      Title: article.title, Slug: article.slug, Status: "In Review", "Primary Keyword": article.primaryKeyword,
      Category: article.category, "Created At": now, "Updated At": now, "Created By": "Claude (Black Friday build)", "Updated By": "Claude (Black Friday build)",
      "CMS Data": JSON.stringify(article.cms),
    } }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`create failed ${response.status}: ${JSON.stringify(body.error)}`);
  console.log(JSON.stringify({ created: body.id, status: body.fields.Status }));
}
async function update() {
  const envText = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const token = (envText.match(/^AIRTABLE_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^"|"$/g, "");
  if (!token) throw new Error("AIRTABLE_API_KEY missing");
  const endpoint = "https://api.airtable.com/v0/appNL010pW9LUpgST/Blogs";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const found = await (await fetch(`${endpoint}?${new URLSearchParams({ filterByFormula: `{Slug}="${article.slug}"`, "fields[]": "Status" })}`, { headers })).json();
  const rec = found.records && found.records[0];
  if (!rec) throw new Error("record not found");
  if (rec.fields.Status === "Published") throw new Error("record is Published; not touching it");
  const response = await fetch(`${endpoint}/${rec.id}`, {
    method: "PATCH", headers,
    body: JSON.stringify({ fields: { "CMS Data": JSON.stringify(article.cms), "Updated At": new Date().toISOString(), "Updated By": "Claude (Black Friday build)" } }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`update failed ${response.status}: ${JSON.stringify(body.error)}`);
  console.log(JSON.stringify({ updated: body.id, status: body.fields.Status }));
}
if (process.argv.includes("--update")) update().catch((e) => { console.error(e.message); process.exit(1); });
if (process.argv.includes("--create")) create().catch((e) => { console.error(e.message); process.exit(1); });
