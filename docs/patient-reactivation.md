# Patient reactivation

Email-only follow-up for dormant patients. The dashboard manages patients and enrollments; the Make scenario "System 3 — Dormant Patient Reactivation" sends the emails.

## Setup

Pages: `/dashboard/dormant-patients` (patient directory, import, enrollment) and `/campaigns/patient-reactivation` (campaign state and message history). Public: `/unsubscribe`.

Server environment variables (keep server-only):

- Existing: `AIRTABLE_LEADS_BASE_ID`, `AIRTABLE_API_KEY`, Supabase session configuration, `SUPABASE_SERVICE_ROLE_KEY`. Tables are read by name (Patients, Reactivation Enrollments, Message Log, Leads, Nurture Enrollments).
- `REACTIVATION_UNSUBSCRIBE_SECRET`: at least 24 alphanumeric characters. The Make scenario must use the same value in `{{sha256(2.id; hex; <secret>)}}`. Changing it invalidates links in emails already sent.

Apply `supabase/migrations/003_campaign_enrollment_claims.sql` for cross-instance locking. Without it, reactivation writes fall back to an in-process lock.

## Behavior

- Viewer can read. Editor and Admin can import, enroll, remove from campaign and mark patients replied/booked/unsubscribed. Admin can delete patients.
- Eligible: valid email, not opted out, not Do Not Contact, no future booking, not already active in the campaign, and not active in 14-Day Nurture (matched by email or phone). Email Consent is shown but not required. Patients without a Last Visit Date count as dormant.
- Enrollment accepts up to 1,500 patients. "Patients per day" optionally spreads first sends across days at the chosen New York time.
- CSV import accepts up to 2,000 rows (5 MB), sent in 200-row requests. Duplicates by email or phone are skipped.
- Mark replied / booked / unsubscribe updates the patient and stops Active or Paused enrollments with the matching Stop Reason.
- Unsubscribe links are HMAC-signed. Opening the page changes nothing; the patient confirms with a button. One-click `List-Unsubscribe-Post` requests are also accepted.
- Delivery status: sent, queued, scheduled, delivered and engagement events count as sent; rejected, invalid, bounces and spam count as failed; anything else is pending.
- Message Logs and Overview resolve reactivation messages through the Patients link.

## Sending automation (Make)

Search due enrollments (limit 200, sorted by Next Send At) → get patient → router: STOP (replied, booked, not interested, opted out, DNC, future booking) or send the current step → log to Message Log → advance when Mandrill accepted, pause with Last Error when rejected. Run every 15 minutes with sequential processing on.
