# Daily Call Import (Make.com)

Scenario **6807651** "Harmony – Daily Call Import (Google Ads → Calls)", org 8106641 (us2), team 2465229.
Blueprint: `Harmony - Daily Call Import.blueprint.json`. Email template source: `../make-call-lead-email-template.html`.

Status: **built, inactive, never run.** Schedule is set to daily 08:00 but does nothing until activated.

## Flow

```
1  Google Ads report (call_view, last 3 days)        one bundle per call
2  Set variables: call values (time, duration, source, area code)
3  Set variables: classification (id, kind, assessment, search formulas)
4  Airtable search Calls: same Google call, or a hand-entered call ±60s / ±2s
5  Array aggregator (always emits, even when nothing is found)
6  Router
   ├─ Hand-entered match (found, no Google Call) → 7 update: store Google Call. No email.
   ├─ New call (nothing found)
   │    → 8 search Call ID (same-minute clash) → 9 aggregator → 10 final id + dashboard link
   │    → 11 create Calls row (Origin "Google Ads sync") → 12 Gmail alert
   └─ (already imported: no route matches, nothing happens)
```

The classification mirrors `classifyCall` / `planCallSync` in `src/lib/leads/call-sync-plan.ts`.
Change both together. Sources are mapped by campaign ID: 24134330302 → CS2, 24080482948 → Website ("Website new").

| Item | Value |
|---|---|
| Google Ads | `google-ads-reports:runCustomReport`, connection 9624908, account 7080113749 |
| Airtable | connection 9625252, base appNL010pW9LUpgST, Calls tbl81JwtzjS2wFRLD (fields mapped by ID) |
| Gmail | connection 11267570 (shahzaibhamid02@gmail.com, same as Speed-to-Lead) |
| Email to | **abdulqayyum3116@gmail.com only, for testing.** Add haydenalamo@harmonymedspafl.com when activating. |
| Link | `https://crm.harmonymedspafl.com/leads?view=all&source=Call+Leads&call=<Call ID>`; opens the call's Add details form, survives sign-in |
| Settings | sequential processing on, incomplete executions stored |

## Before activating (one-time verification)

None of this has run yet. Two things are assumptions until the first run:

- **Output key names** of the report module. The blueprint uses `callView_startCallDateTime`, `callView_callDurationSeconds`, `callView_callStatus`, `callView_callerAreaCode`, `callView_callerCountryCode`, `callView_resourceName`, `campaign_id`, `campaign_name` (same pattern as the Search Terms scenario's `searchTermView_searchTerm`). If module 1's output differs, remap module 2.
- **Google accepts the WHERE on `start_call_date_time`.** If module 1 errors on it, delete the WHERE and add a filter after module 2 on the parsed date.

Steps:

1. Widen the window once: in module 1 change `addDays(now; -3)` to `addDays(now; -8)`. This fills the gap since the last hand-entered call (Oct 21).
2. **Run once.** Check the Calls table:
   - New rows exist from Oct 22 onward with Origin "Google Ads sync". Kind is a valid choice, and Occurred At is in the right ET time.
   - The Oct 21 9:52 AM call was **linked** (its row now has a Google Call), not duplicated.
   - No two rows share a Call ID.
   - Abdul received one email per new row, and the button opens that call.
3. **Run once again.** Nothing new should be created and no email sent. This proves de-duplication.
4. Set module 1 back to `-3`. Add Hayden to module 12's To. Confirm the org timezone is ET (Make schedules in the org/user timezone), or adjust 08:00. **Activate.**

Expected cost: about 1 operation per run with no calls, about 4 per already-imported call (re-checked for 3 days), and about 10 per new call.

## Not to run alongside

The dashboard has its own importer (`/api/calls/sync`). Both de-duplicate on Google Call, but they would race if both were scheduled. Keep only this Make scenario on a schedule.

## Also noticed

Gmail connection **11027469** ("Gmail connection") has an expired refresh token. It is used by the dashboard's manual **Notify Hayden** scenario (6237724), so that button's emails fail until the connection is reauthorized in Make → Connections.
