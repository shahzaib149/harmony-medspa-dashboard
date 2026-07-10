"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Clock3, Mail, MessageSquare, Phone, Sparkles, X } from "lucide-react";
import { NURTURE_STEPS, type NurtureEnrollment, type NurtureMessage } from "@/lib/types/nurture";

function date(value: string | null) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function NurtureDetail({ enrollment, onClose }: { enrollment: NurtureEnrollment | null; onClose: () => void }) {
  const [messages, setMessages] = useState<NurtureMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enrollment) return;
    let ignore = false;
    setLoading(true);
    setError("");
    fetch(`/api/airtable/nurture/${enrollment.id}/messages`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { messages?: NurtureMessage[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load message timeline");
        if (!ignore) setMessages(data.messages ?? []);
      })
      .catch((reason: unknown) => { if (!ignore) setError(reason instanceof Error ? reason.message : "Could not load message timeline"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [enrollment]);

  if (!enrollment) return null;
  const currentIndex = Math.max(0, NURTURE_STEPS.indexOf(enrollment.currentStep as (typeof NURTURE_STEPS)[number]));

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/60" aria-label="Close nurture details" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l bg-[#09090D]" style={{ borderColor: "rgba(201,168,76,.12)", boxShadow: "-28px 0 80px rgba(0,0,0,.45)" }}>
        <div className="flex items-start justify-between border-b p-5" style={{ borderColor: "rgba(201,168,76,.12)" }}>
          <div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#C9A84C]">Nurture profile</p><h2 className="mt-1 text-xl font-extrabold text-[#F0ECE4]">{enrollment.leadName}</h2><p className="mt-1 text-xs text-[#7A7A8A]">{enrollment.leadSource || "Unknown source"} · {enrollment.leadTreatmentInterest || "No treatment captured"}</p></div>
          <button onClick={onClose} className="rounded-xl border p-2 text-[#7A7A8A]" style={{ borderColor: "rgba(201,168,76,.12)" }}><X size={17} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Phone", value: enrollment.leadPhone, icon: Phone }, { label: "Email", value: enrollment.leadEmail, icon: Mail }, { label: "Lead status", value: enrollment.leadStatus, icon: Sparkles }, { label: "Replied", value: enrollment.leadReplied ? "Yes" : "No", icon: MessageSquare }].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border p-3" style={{ backgroundColor: "#111117", borderColor: "rgba(255,255,255,.06)" }}><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#5A5A6A]"><Icon size={11} />{label}</p><p className="mt-1 break-words text-sm font-semibold text-[#F0ECE4]">{value || "Not captured"}</p></div>
            ))}
          </div>
          {enrollment.status === "Stopped" && <div className="mt-4 rounded-2xl border p-4" style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,.08)", borderColor: "rgba(248,113,113,.24)" }}><p className="text-xs font-bold uppercase tracking-wider">Sequence stopped</p><p className="mt-1 text-sm">{enrollment.stopReason || "No reason recorded"} at {enrollment.currentStep || "unknown step"}</p></div>}
          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: "#111117", borderColor: "rgba(255,255,255,.06)" }}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#C9A84C]">Sequence timeline</p>
            {loading ? <p className="flex items-center gap-2 text-sm text-[#7A7A8A]"><Clock3 className="animate-spin" size={15} />Loading messages...</p> : error ? <p className="flex gap-2 text-sm text-[#F87171]"><AlertCircle size={16} />{error}</p> : (
              <div className="space-y-0">
                {NURTURE_STEPS.map((step, index) => {
                  const message = messages.find((item) => item.sequenceStep === step);
                  const sent = Boolean(message) || index < currentIndex || (index === currentIndex && Boolean(enrollment.lastSentAt));
                  const stoppedHere = enrollment.status === "Stopped" && index === currentIndex;
                  const tone = stoppedHere ? "#F87171" : sent ? "#2DD4BF" : "#5A5A6A";
                  return <div key={step} className="flex gap-3"><div className="flex flex-col items-center"><span className="flex h-8 w-8 items-center justify-center rounded-full border" style={{ color: tone, borderColor: `${tone}55`, backgroundColor: `${tone}12` }}>{sent ? <Check size={14} /> : <Clock3 size={13} />}</span>{index < NURTURE_STEPS.length - 1 && <span className="h-16 w-px bg-white/[.07]" />}</div><div className="min-w-0 pb-5 pt-1"><p className="text-sm font-bold" style={{ color: sent ? "#F0ECE4" : "#7A7A8A" }}>{step}</p><p className="mt-0.5 text-xs text-[#7A7A8A]">{message ? `${message.deliveryStatus} · ${date(message.sentAt)}` : sent ? date(index === currentIndex ? enrollment.lastSentAt : null) : index === currentIndex + 1 ? `Scheduled ${date(enrollment.nextSendAt)}` : "Upcoming"}</p>{message?.messageBody && <p className="mt-2 rounded-xl bg-white/[.025] p-3 text-xs leading-5 text-[#A3A3AF]">{message.messageBody}</p>}</div></div>;
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
