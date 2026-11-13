# Daily Call Import (Make.com)

Scenario **6807651** "Harmony – Daily Call Import (Google Ads → Calls)", org 8106641 (us2), team 2465229.
Blueprint: `Harmony - Daily Call Import.blueprint.json`. Email template source: `../make-call-lead-email-template.html`.

Status: **active since 2026-11-03.** Runs daily at 08:00 America/New_York.

## Flow

```
1  Google Ads report (call_view, last 3 days)        one bundle per call
2  Set variables: call values (time, duration, source, area code)
3  Set variables: classification (id, kind, assessment, search formulas)
4  Airtable search Calls: same Google call, or a hand-entered call ±60s / ±2s
5  Array aggregator (emits even when nothing is found, with no array items)
6  Router
   ├─ Hand-entered match (found, no Google Call) → 7 update: store Google Call. No email.
   ├─ New call (nothing found)
   │    → 8 search Call ID (same-minute clash) → 9 aggregator → 10 final id + dashboard link
   │    → 11 create Calls row (Origin "Google Ads sync") → 12 Gmail alert
   └─ (already imported: no route matches, nothing happens)
```

The classification mirrors `classifyCall` / `planCallSync` in `src/lib/leads/call-sync-plan.ts`.
Change both together. Sources are mapped by campaign ID (module 2 `source` / `line` / `prefix`, and `src/lib/google/campaign-registry.ts` for the dashboard):

| Campaign ID | Source | Line | Call ID prefix |
|---|---|---|---|
| 24134330302 | CS2 | CS2 | cs2- |
| 24447046761 | CS5 | CS5 Brand | cs5- |
| 24452301491 | CS3 | CS3 Hormone | cs3- |
| 24452305673 | CS4 | CS4 Aesthetics | cs4- |
| 24080482948 | Website | Website new | web- |
| any other | campaign name | campaign name | gads- |

Since 2026-11-13 the scenario also writes Campaign ID, and the dashboard groups calls by it (falling back to Source).

| Item | Value |
|---|---|
| Google Ads | `google-ads-reports:runCustomReport`, connection 9624908, account 7080113749 |
| Airtable | connection 9625252, base appNL010pW9LUpgST, Calls tbl81JwtzjS2wFRLD (fields mapped by ID) |
| Gmail | connection 11267570 (shahzaibhamid02@gmail.com, same as Speed-to-Lead) |
| Email to | haydenalamo@harmonymedspafl.com, abdulqayyum3116@gmail.com |
| Link | `https://crm.harmonymedspafl.com/leads?view=all&source=Call+Leads&call=<Call ID>`; opens the call's Add details form, survives sign-in |
| Settings | sequential processing on, incomplete executions stored |

## Verified on 2026-11-03

Tested against live data with emails going to Abdul only:

- **Google field names and the date filter** work as the blueprint expects.
- **Hand-entered match:** the Oct 21 9:52 AM call linked to its existing row (Google Call filled, same Call ID, no email, no new row).
- **Repeat run:** nothing written and no email, so daily re-checks are safe.
- **New-call path**, with the search forced to find nothing and the save step removed: it ran through to a real email.

**Not yet exercised: module 11 (Save call).** Google had no calls after Oct 21, and creating a test row would pollute the reporting data. The module's configuration validates against the live Calls schema, but the first real new call is its first run. After that call, check that the row and the email both exist. If module 11 ever fails, the run is kept under Incomplete executions and the next day's run retries, because the call stays in the 3-day window.

## Make formula rules learned here

The module validators and `validate_blueprint_schema` do not parse formulas. These only fail at run time, as `BlueprintValidationError: Scenario validation failed`, with no module named:

- Regex literals in `replace()` (`/.../g`) caused the validation failure here; use plain values. New campaigns therefore get the Call ID prefix `gads` instead of a slug of the campaign name.
- Make's reference says logical operators are `&` and `|`, not the words `and` / `or`, so the formulas use those. The error count did not change when they were replaced, so the words alone may not fail validation.
- After an aggregator receives nothing, `length(n.array) = 0` does **not** pass a filter. Test `first(map(n.array; "id"))` with `notexist` instead.

To debug, reduce the flow to read-only modules and compare `operations` from `executions_get`; `executions_get-detail` returns no module data for these runs.

Expected cost: 1 operation per run with no calls, 5 per already-imported call (re-checked for 3 days), and about 10 per new call.

## Not to run alongside

The dashboard has its own importer (`/api/calls/sync`). Both de-duplicate on Google Call, but they would race if both were scheduled. Keep only this Make scenario on a schedule.

## Also noticed

Gmail connection **11027469** ("Gmail connection") has an expired refresh token. It is used by the dashboard's manual **Notify Hayden** scenario (6237724), so that button's emails fail until the connection is reauthorized in Make → Connections.
