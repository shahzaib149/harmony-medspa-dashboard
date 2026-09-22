# Speed to Lead — AI Classification (Make.com)

Blueprint: `Harmony MedSpa - Speed to Lead (AI Classification).blueprint.json`
Replaces: `Harmony MedSpa - Speed to Lead (Complete)` (same webhook, `roya-speed-to-lead`, hook 2515926).

## What it does

```
Webhook → Search Leads → Router
├─ Duplicate found (existing flow: update, speed-to-lead email + SMS, logs)
│    └─ Classify (first matching record only)
│         ├─ Paid-click signal → Rule: Real Lead + "Paid Ad"         (no OpenAI call)
│         ├─ No paid signal    → OpenAI gpt-4o-mini (JSON)            (errors ignored → fallback)
│         └─ Finalize → validate / whitelist → Router
│              ├─ Save classification (skipped if staff set it manually, never downgrades a real lead)
│              └─ Notify Hayden (Real Lead / Unclear / Existing Patient)       — never nurture
└─ No duplicate (Create Lead with full attribution, speed-to-lead email + SMS, logs)
     └─ Classify (same three branches) → Update Lead (type, tags, reason, status) → Router
          ├─ Notify Hayden (Real Lead / Unclear / Existing Patient)
          └─ 14-Day Nurture enrollment (Real Lead / Unclear only)
```

Speed-to-lead email + SMS still go to everyone, before any AI step.
Fail-open: if OpenAI errors, times out or returns bad JSON, the lead becomes
`Unclear` + `Needs Review`, method `Fallback`, and is still notified + nurtured.

| Lead Type | Hayden email | Nurture | Status |
|---|---|---|---|
| Real Lead / Unclear / AI failure | yes | yes | Contacted |
| Existing Patient | yes | no | Not a Lead |
| Appointment Change, Solicitor, Job Seeker, Spam | no | no | Not a Lead |

## Import steps

1. **Rotate the Mandrill key** (the old one is visible in the previous export). In modules
   **202** and **210** (HTTP → send-sms), replace `PASTE_NEW_MANDRILL_API_KEY_HERE` with the new key.
   Until you do, SMS will fail (logged as `rejected` / "Invalid API key") but the rest of the flow keeps running.
2. In modules **302** and **402** (OpenAI → Generate a completion) select Harmony's OpenAI connection.
   Model is `gpt-4o-mini`, temperature 0, max 200 tokens, JSON object, "Parse JSON response" on.
   Set a monthly spend limit ($10–20) on that OpenAI account.
3. Check modules **310** and **410** (Gmail) use the right Gmail connection. Recipients:
   haydenalamo@ and management@harmonymedspafl.com.
4. Re-select the Airtable / Mandrill connections if Make asks (same IDs as before).
5. Open the webhook (module 5) data structure and confirm it contains GCLID, GBRAID, WBRAID, UTM Term,
   UTM Content, Match Type, Device, Network, Landing URL, Best Time to Reach. If not, click
   "Re-determine data structure" and submit a landing-page form with `?gclid=TEST123` in the URL.
6. Run the test cases below with the scenario **off** and "Run once", then turn off the old
   scenario and turn this one on (one active scenario per webhook).

## Test cases

Run **#1 first** — it needs no OpenAI connection and proves the design works:

- If #1 shows Classification Method **Fallback** instead of **Rule**, variables are not reaching the
  Finalize branch. Change `scope` from *roundtrip* to *execution* on modules 301/304/306/307 and
  401/404/406/407 and retest. If it still fails, move the Finalize chain (305 → 309) into the end of
  routes 1 and 2 instead of its own route.
- If #8 writes no Lead Type on the duplicate record and sends no email, the "First matching record
  only" filter on router 400 is not resolving — delete that filter.

| # | Send | Expect |
|---|---|---|
| 1 | Landing form with `GCLID=TEST123` | Method Rule, Real Lead, tag Paid Ad, no OpenAI run, email + nurture |
| 2 | "How much is your weight loss program?" | AI → Real Lead, email + nurture |
| 3 | "I'm a freelance writer, need content?" | Solicitor, Not a Lead, no email, no nurture |
| 4 | "Need to move my Thursday appointment" | Appointment Change, Not a Lead |
| 5 | Empty message | Unclear + Needs Review, email + nurture |
| 6 | "We can get you to page 1 on Google" | Solicitor + SEO/Marketing Pitch |
| 7 | Disconnect OpenAI temporarily | Fallback, Unclear + Needs Review, email + nurture, speed-to-lead still sent |
| 8 | Resubmit #2 | Duplicate route: classified + Hayden email, **no** second nurture |

## Other fixes in this version

- Create Lead now stores Source (whitelisted to known form names), Treatment Interest, GCLID/GBRAID/WBRAID,
  all UTMs, Match Type, Device, Network, Page URL, Landing URL, Best Time to Reach.
- SMS log stores the SMS message ID (was the email ID), real sent text, `{{now}}` timestamps.
- Email log stores the real email text. First name uses `split(Name; space)` (was splitting on nothing).
- A failed SMS no longer stops the scenario (`stopOnHttpError` off; failure logged as `rejected`).

`Harmony - Manual Notify Hayden (fixed link).blueprint.json` is the dashboard's manual
"Notify Hayden" scenario with the duplicate `href` removed; the dashboard now sends a link to the exact lead.
