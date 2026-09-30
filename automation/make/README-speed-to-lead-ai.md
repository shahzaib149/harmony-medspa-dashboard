# Speed to Lead — AI Classification (Make.com)

Current blueprint: `Harmony MedSpa - Speed to Lead (AI Classification, gated reply).blueprint.json`
Built from the live export on 2026-09-29, so the Mandrill key, OpenAI and Gmail connections are already in it.
Webhook is unchanged (`roya-speed-to-lead`, hook 2515926).

## What changed in this version

The AI now decides **before** anything is sent. Solicitors, spam and job seekers get no
email and no SMS at all — previously everyone got the instant reply and the AI only
decided about Hayden's alert and nurture.

```
Webhook → Search Leads → Router
├─ Duplicate found → update record → Classify (first matching record only)
│    ├─ Paid-click signal → Rule: Real Lead + "Paid Ad"   (no OpenAI call, still instant)
│    ├─ No paid signal    → OpenAI gpt-4o-mini            (on error: hold + retry)
│    └─ Finalize → validate + whitelist → Router
│         ├─ Speed-to-lead email + SMS + logs   (only if the reply is allowed)
│         ├─ Save classification                (skipped if staff set it manually)
│         └─ Notify Hayden                      (Real Lead / Unclear / Existing Patient)
└─ No duplicate → Create Lead (Status New, full attribution) → Classify (same three branches)
     → write classification → Router
        ├─ Speed-to-lead email + SMS + logs → Status becomes Contacted
        ├─ Notify Hayden
        └─ 14-Day Nurture enrollment          (Real Lead / Unclear only)
```

| Lead Type | Instant reply | Hayden email | Nurture | Status |
|---|---|---|---|---|
| Real Lead / Unclear | yes | yes | yes | Contacted |
| Existing Patient | yes | yes | no | Not a Lead |
| Appointment Change | yes | no | no | Not a Lead |
| **Solicitor / Spam / Job Seeker** | **no** | no | no | Not a Lead |

The lead row is always created first, so a submission is never lost and everything still
shows in the dashboard. Paid-ad leads skip the AI, so they stay instant; everyone else
waits about one to three seconds for the model.

## If OpenAI is down

The OpenAI module uses **Break**: retry 6 times, 5 minutes apart. While it is holding,
nothing is sent — no reply, no alert, no nurture — which is what Harmony asked for.
The lead row already exists with Status `New`, so:

- the dashboard's "new leads need contact" alert picks it up after 15 minutes, and
- after 6 failed retries the run waits in **Scenario → History → Incomplete executions**
  for someone to resolve it by hand.

This needs **Allow storing of incomplete executions** on (scenario settings); the blueprint
sets it, but confirm it after import.

## After importing — check these four mappings

Importing the previous blueprint silently dropped every Airtable mapping that was not a
plain `{{module.variable}}` reference: **AI Tags**, **Is Real Lead** and **Status** on
modules 308 and 408. That is why leads classified between Sep 22 and Sep 29 have no tags
and show "Contacted" instead of "Not a Lead". This version computes those values in the
Set variables modules (317 / 417) so the Airtable modules only hold plain references.

Open modules **308** and **408** (Update a record) and confirm all four are still mapped:

| Field | Should be |
|---|---|
| Status | `{{317.status_value}}` (module 408 has no Status — duplicates keep theirs) |
| AI Tags | `{{317.tags_array}}` |
| Is Real Lead | `{{317.is_real_flag}}` |
| Email / SMS Sent Status | `{{317.delivery_value}}` (308 only) |

If any are blank, re-add them by hand; the variables exist in the dropdown. The dashboard
works either way — it reads Lead Type, not the checkbox — but Airtable views and Hayden's
own filters use them.

## Test cases

Run **#1 first**: it needs no OpenAI call and proves the variable bridge works.

- If #1 shows Classification Method `Fallback` instead of `Rule`, variables are not reaching
  the Finalize branch. Change `scope` from *roundtrip* to *execution* on 301/304/306/307/317
  (and 401/404/406/407/417). If it still fails, move the Finalize chain into routes 1 and 2.
- If #8 writes no Lead Type on the duplicate and sends no email, the "First matching record
  only" filter on router 400 is not resolving — delete that filter.

| # | Send | Expect |
|---|---|---|
| 1 | Landing form with `GCLID=TEST123` | Rule → Real Lead, tag Paid Ad, no OpenAI run, reply + email + nurture |
| 2 | "How much is your weight loss program?" | AI → Real Lead, reply + email + nurture, Status Contacted |
| 3 | "I'm a freelance writer, need content?" | Solicitor: **no email, no SMS**, no alert, no nurture, Status Not a Lead, Email/SMS Sent Status empty |
| 4 | "Need to move my Thursday appointment" | Appointment Change: reply sent, no alert, no nurture |
| 5 | Empty message | Unclear + Needs Review: reply + email + nurture |
| 6 | "We can get you to page 1 on Google" | Solicitor + SEO/Marketing Pitch, silent |
| 7 | Break the OpenAI connection | Nothing sent; run holds in Incomplete executions; lead row exists with Status New |
| 8 | Resubmit #2 | Duplicate route: classified + Hayden email, one reply, **no** second nurture |

Also confirm no Message Log rows are created for test #3 — a suppressed submission was
never messaged, so it should have no log entries.

## Earlier fixes still in place

- Create Lead stores Source (whitelisted), Treatment Interest, GCLID/GBRAID/WBRAID, all UTMs,
  Match Type, Device, Network, Page URL, Landing URL, Best Time to Reach.
- SMS log stores the SMS message ID and the real sent text; timestamps use `{{now}}`.
- First name uses `split(Name; space)`.
- A failed SMS no longer stops the scenario (`stopOnHttpError` off; logged as `rejected`).
- Duplicates now reply once, not once per matching record.

`Harmony - Manual Notify Hayden (fixed link).blueprint.json` is the dashboard's manual
"Notify Hayden" scenario with the duplicate `href` removed.
