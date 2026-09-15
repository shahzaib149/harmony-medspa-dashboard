import type { Metadata } from "next";
import s from "./unsubscribe.module.css";
import { verifyUnsubscribe } from "@/lib/reactivation/unsubscribe";

export const metadata: Metadata = { title: "Email preferences · Harmony Med Spa", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Search = { p?: string; t?: string; status?: string };

// Opening the link never unsubscribes on its own: mail scanners follow links,
// so the change happens only when the patient presses the button.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Search> }) {
  const { p, t, status } = await searchParams;
  const valid = verifyUnsubscribe(p, t);

  let title = "Unsubscribe from Harmony Med Spa emails";
  let body = "You'll stop receiving follow-up and promotional emails from us. Appointment confirmations from our booking system are not affected.";
  if (status === "done") {
    title = "You're unsubscribed";
    body = "We won't send you any more follow-up or promotional emails. If this was a mistake, reply to any earlier email or call the spa and we'll add you back.";
  } else if (status === "invalid" || (!status && !valid)) {
    title = "This link has expired or is incomplete";
    body = "Please use the unsubscribe link from your most recent email, or reply to that email and ask us to remove you. We'll take care of it.";
  }

  return (
    <main className={s.page}>
      <section className={s.card}>
        <p className={s.brand}>Harmony Med Spa · Sarasota</p>
        <h1>{title}</h1>
        <p className={s.body}>{body}</p>
        {status === "error" && <p className={s.error} role="alert">We couldn&apos;t save your preference just now. Please try again in a moment.</p>}
        {valid && status !== "done" && status !== "invalid" && (
          <form method="post" action="/api/reactivation/unsubscribe">
            <input type="hidden" name="p" value={p} />
            <input type="hidden" name="t" value={t} />
            <button type="submit" className={s.button}>Unsubscribe</button>
          </form>
        )}
      </section>
    </main>
  );
}
