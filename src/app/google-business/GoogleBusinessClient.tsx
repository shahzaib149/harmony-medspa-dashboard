"use client";

import { useState } from "react";
import KPICard from "@/components/ui/KPICard";
import DateRangePicker from "@/components/ui/DateRangePicker";
import type { DateRangeOption } from "@/lib/types";
import { Star, MessageSquare, MapPin, Phone, Globe, Image as ImageIcon, Loader2, Send, Pencil, Navigation } from "lucide-react";

interface Review {
  reviewId: string;
  reviewer: { displayName: string };
  starRating: string;
  comment: string;
  createTime: string;
  reviewReply?: { comment: string };
}

const RATING_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

const MOCK_INSIGHTS = {
  QUERIES_DIRECT: 142,
  QUERIES_INDIRECT: 389,
  VIEWS_MAPS: 284,
  VIEWS_SEARCH: 531,
  ACTIONS_PHONE: 67,
  ACTIONS_DRIVING_DIRECTIONS: 43,
  ACTIONS_WEBSITE: 112,
  PHOTOS_VIEWS_MERCHANT: 1840,
};

const MOCK_REVIEWS: Review[] = [
  { reviewId: "r1", reviewer: { displayName: "Sarah M." }, starRating: "FIVE", comment: "Absolutely love Harmony MedSpa! The staff is so welcoming and my Botox results are incredible. Will definitely be back!", createTime: "2026-06-18T14:30:00Z" },
  { reviewId: "r2", reviewer: { displayName: "Jennifer T." }, starRating: "FOUR", comment: "Great experience overall. The HydraFacial was amazing — my skin glowed for weeks. Only minor issue was the wait time.", createTime: "2026-06-15T11:00:00Z" },
  { reviewId: "r3", reviewer: { displayName: "Amanda C." }, starRating: "THREE", comment: "Mixed experience. The treatment was fine but I felt rushed during the consultation. Expected more personalised attention.", createTime: "2026-06-10T09:45:00Z" },
  { reviewId: "r4", reviewer: { displayName: "Rachel K." }, starRating: "FIVE", comment: "Best medspa in the area! I've been coming for 2 years and the quality is always consistent. Highly recommend the filler!", createTime: "2026-06-05T16:20:00Z" },
];

const POST_TYPES = [
  { value: "STANDARD", label: "Update" },
  { value: "OFFER", label: "Offer" },
  { value: "EVENT", label: "Event" },
] as const;

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

export default function GoogleBusinessClient() {
  const [dateRange, setDateRange] = useState<DateRangeOption>("30");
  const [activeTab, setActiveTab] = useState<"reviews" | "insights" | "posts">("reviews");
  const [reviews] = useState<Review[]>(MOCK_REVIEWS);
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [loadingReply, setLoadingReply] = useState<string | null>(null);
  const [postType, setPostType] = useState<"STANDARD" | "OFFER" | "EVENT">("OFFER");
  const [postTopic, setPostTopic] = useState("");
  const [postDraft, setPostDraft] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);

  const avgRating = reviews.reduce((s, r) => s + (RATING_MAP[r.starRating] ?? 0), 0) / reviews.length;

  const draftReply = async (review: Review) => {
    setLoadingReply(review.reviewId);
    try {
      const res = await fetch("/api/google-business/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName: review.reviewer.displayName.split(" ")[0],
          rating: RATING_MAP[review.starRating],
          reviewText: review.comment,
        }),
      });
      const data = await res.json();
      if (data.reply) setDraftReplies((p) => ({ ...p, [review.reviewId]: data.reply }));
    } finally {
      setLoadingReply(null);
    }
  };

  const generatePost = async () => {
    setLoadingPost(true);
    try {
      const res = await fetch(`/api/google-business/posts?type=${postType}&topic=${encodeURIComponent(postTopic || "Summer special")}`);
      const data = await res.json();
      if (data.draft) setPostDraft(data.draft);
    } finally {
      setLoadingPost(false);
    }
  };

  const publishPost = async () => {
    setPublishingPost(true);
    try {
      await fetch("/api/google-business/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicType: postType, summary: postDraft }),
      });
      setPostDraft("");
      setPostTopic("");
    } finally {
      setPublishingPost(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard title="Avg Rating" value={`${avgRating.toFixed(1)} ★`} subtitle={`${reviews.length} reviews`} color="green" />
        <KPICard title="Search Views" value={MOCK_INSIGHTS.VIEWS_SEARCH.toLocaleString()} subtitle="Last 30 days" color="teal" />
        <KPICard title="Maps Views" value={MOCK_INSIGHTS.VIEWS_MAPS.toLocaleString()} subtitle="Last 30 days" color="teal" />
        <KPICard title="Phone Calls" value={MOCK_INSIGHTS.ACTIONS_PHONE} subtitle="From GBP listing" color="green" />
        <KPICard title="Website Clicks" value={MOCK_INSIGHTS.ACTIONS_WEBSITE} subtitle="From GBP listing" color="teal" />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#E5E7EB]">
        {([
          { key: "reviews", label: "Reviews", icon: Star },
          { key: "insights", label: "Local Insights", icon: MapPin },
          { key: "posts", label: "GBP Posts", icon: Pencil },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key ? "border-[#1A6B6B] text-[#1A6B6B]" : "border-transparent text-[#6B7280] hover:text-[#1A1A2E]"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
        <div className="ml-auto pb-1">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* ── Reviews Tab ── */}
      {activeTab === "reviews" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Rating Summary</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-[#1A1A2E]">{avgRating.toFixed(1)}</p>
                <StarRow rating={Math.round(avgRating)} />
                <p className="text-xs text-[#6B7280] mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = reviews.filter((r) => RATING_MAP[r.starRating] === n).length;
                  const pct = Math.round((count / reviews.length) * 100);
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs">
                      <span className="text-[#6B7280] w-2">{n}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[#6B7280] w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-[#E5E7EB]">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Avg response time</span>
                <span className="font-medium text-green-600">2.4 hrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Response rate</span>
                <span className="font-medium text-[#1A1A2E]">75%</span>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="col-span-2 space-y-4">
            {reviews.map((review) => {
              const stars = RATING_MAP[review.starRating] ?? 0;
              const draft = draftReplies[review.reviewId];
              return (
                <div key={review.reviewId} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0D2B45] flex items-center justify-center text-white text-sm font-semibold">
                        {review.reviewer.displayName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E]">{review.reviewer.displayName}</p>
                        <StarRow rating={stars} />
                      </div>
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      {new Date(review.createTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-[#1A1A2E] leading-relaxed mb-4">{review.comment}</p>
                  {review.reviewReply ? (
                    <div className="bg-[#F5F7FA] rounded-xl p-3 border-l-4 border-[#1A6B6B] text-sm text-[#6B7280] italic">
                      <span className="font-medium not-italic text-[#1A1A2E]">Owner reply: </span>
                      {review.reviewReply.comment}
                    </div>
                  ) : draft ? (
                    <div className="space-y-2">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraftReplies((p) => ({ ...p, [review.reviewId]: e.target.value }))}
                        className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A6B6B]/30"
                        rows={3}
                      />
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "#1A6B6B" }}>
                        <Send size={13} />Post Reply
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => draftReply(review)}
                      disabled={loadingReply === review.reviewId}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-[#1A6B6B]/30 text-[#1A6B6B] hover:bg-teal-50 disabled:opacity-60"
                    >
                      {loadingReply === review.reviewId
                        ? <><Loader2 size={13} className="animate-spin" />Drafting with Claude...</>
                        : <><MessageSquare size={13} />AI Draft Reply</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Insights Tab ── */}
      {activeTab === "insights" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1A1A2E] mb-5">Search Visibility</h2>
            <div className="space-y-4">
              {[
                { label: "Direct searches (name/address)", value: MOCK_INSIGHTS.QUERIES_DIRECT, icon: Globe, color: "#0D2B45" },
                { label: "Discovery searches (category/service)", value: MOCK_INSIGHTS.QUERIES_INDIRECT, icon: MapPin, color: "#1A6B6B" },
                { label: "Views on Google Maps", value: MOCK_INSIGHTS.VIEWS_MAPS, icon: MapPin, color: "#10B981" },
                { label: "Views on Google Search", value: MOCK_INSIGHTS.VIEWS_SEARCH, icon: Globe, color: "#F59E0B" },
              ].map((item) => {
                const Icon = item.icon;
                const total = 1346;
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="flex items-center gap-2 text-[#1A1A2E]">
                        <Icon size={13} style={{ color: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-semibold tabular-nums">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1A1A2E] mb-5">Customer Actions</h2>
            <div className="space-y-1">
              {[
                { label: "Calls from GBP", value: MOCK_INSIGHTS.ACTIONS_PHONE, icon: Phone, color: "#1A6B6B" },
                { label: "Direction requests", value: MOCK_INSIGHTS.ACTIONS_DRIVING_DIRECTIONS, icon: Navigation, color: "#0D2B45" },
                { label: "Website clicks", value: MOCK_INSIGHTS.ACTIONS_WEBSITE, icon: Globe, color: "#10B981" },
                { label: "Photo views", value: MOCK_INSIGHTS.PHOTOS_VIEWS_MERCHANT, icon: ImageIcon, color: "#F59E0B" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                    <span className="flex items-center gap-3 text-sm text-[#1A1A2E]">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + "18" }}>
                        <Icon size={14} style={{ color: item.color }} />
                      </div>
                      {item.label}
                    </span>
                    <span className="text-xl font-bold text-[#1A1A2E] tabular-nums">{item.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Posts Tab ── */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A2E]">Create GBP Post</h2>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Post Type</label>
              <div className="flex gap-2">
                {POST_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setPostType(t.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      postType === t.value ? "bg-[#1A6B6B] text-white border-[#1A6B6B]" : "text-[#6B7280] border-[#E5E7EB] hover:border-[#1A6B6B]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Topic / Offer</label>
              <input
                value={postTopic}
                onChange={(e) => setPostTopic(e.target.value)}
                placeholder="e.g. Summer Botox special — 10% off in July"
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B6B]/30"
              />
            </div>
            <button
              onClick={generatePost}
              disabled={loadingPost}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "#1A6B6B" }}
            >
              {loadingPost ? <><Loader2 size={14} className="animate-spin" />Drafting...</> : "AI Draft Post with Claude"}
            </button>
            {postDraft && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Post Content</label>
                  <textarea
                    value={postDraft}
                    onChange={(e) => setPostDraft(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A6B6B]/30"
                    rows={6}
                  />
                  <p className="text-xs text-[#6B7280] mt-1">{postDraft.length} / 1500 characters</p>
                </div>
                <button
                  onClick={publishPost}
                  disabled={publishingPost}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: "#0D2B45" }}
                >
                  {publishingPost ? <><Loader2 size={14} className="animate-spin" />Publishing...</> : <><Send size={14} />Publish to Google Business</>}
                </button>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Posting Tips</h2>
            <div className="space-y-0">
              {[
                { tip: "Post at least once per week to maintain visibility in local search", color: "#1A6B6B" },
                { tip: "Offer posts with promo codes get 2× more clicks than standard updates", color: "#10B981" },
                { tip: "Include a clear CTA — 'Book now', 'Call us', or 'Learn more'", color: "#0D2B45" },
                { tip: "Add a photo to every post — posts with photos get 42% more direction requests", color: "#F59E0B" },
                { tip: "Respond to all reviews within 24 hours — it directly affects local ranking", color: "#1A6B6B" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-[#F3F4F6] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <p className="text-sm text-[#6B7280] leading-relaxed">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
