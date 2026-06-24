"use client";

import { useState } from "react";
import { X, Copy, Loader2, Check } from "lucide-react";
import type { AdDraft } from "@/lib/types";

interface AdDraftModalProps {
  open: boolean;
  onClose: () => void;
  defaultTreatment?: string;
}

const treatments = [
  "Botox",
  "Dermal Filler",
  "HydraFacial",
  "Microneedling",
  "Laser Hair Removal",
  "Chemical Peel",
];

const audiences = [
  "Women 30–45 in [City]",
  "Women 45–60 anti-aging",
  "Bridal & event prep",
  "First-time MedSpa visitors",
  "Existing patients — rebooking",
];

const offers = [
  "Free consultation",
  "15% off first treatment",
  "$50 off Botox",
  "Buy 1 get 1 50% off",
  "Summer special — limited spots",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded text-[#6B7280] hover:text-[#1A6B6B] hover:bg-teal-50 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
    </button>
  );
}

export default function AdDraftModal({
  open,
  onClose,
  defaultTreatment,
}: AdDraftModalProps) {
  const [treatment, setTreatment] = useState(defaultTreatment ?? treatments[0]);
  const [audience, setAudience] = useState(audiences[0]);
  const [offer, setOffer] = useState(offers[0]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<AdDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draft-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatment, audience, offer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#1A1A2E]">
            AI Ad Draft Generator
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#6B7280] hover:text-[#1A1A2E] hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
              Treatment
            </label>
            <select
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6B6B]/30"
            >
              {treatments.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6B6B]/30"
            >
              {audiences.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
              Offer / Promo
            </label>
            <select
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6B6B]/30"
            >
              {offers.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#1A6B6B" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating with Claude...
              </>
            ) : (
              "Generate Ad Copy"
            )}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {draft && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                  Headlines (max 30 chars)
                </p>
                <div className="space-y-2">
                  {draft.headlines.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-[#1A1A2E]">{h}</span>
                      <CopyButton text={h} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                  Descriptions (max 90 chars)
                </p>
                <div className="space-y-2">
                  {draft.descriptions.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-[#1A1A2E]">{d}</span>
                      <CopyButton text={d} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                  Suggested CTA
                </p>
                <div className="flex items-center justify-between bg-teal-50 rounded-lg px-3 py-2 border border-teal-100">
                  <span className="text-sm font-medium text-[#1A6B6B]">
                    {draft.cta}
                  </span>
                  <CopyButton text={draft.cta} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
