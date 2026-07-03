"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, MapPin, Phone, Globe, Navigation, Loader2, Send, Pencil, RefreshCw, AlertCircle } from "lucide-react";

const GOLD = "#C9A84C";
const CARD = "#111117";
const BORDER = "rgba(201,168,76,0.12)";
const TEXT = "#F0ECE4";
const MUTED = "#7A7A8A";
const DIM = "#5A5A6A";

const RATING_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

interface Review {
  name?: string;
  reviewId: string;
  reviewer: { displayName: string };
  starRating: string;
  comment: string;
  createTime: string;
  reviewReply?: { comment: string };
}

interface Insights {
  queriesDirect: number;
  queriesIndirect: number;
  viewsMaps: number;
  viewsSearch: number;
  actionsPhone: number;
  actionsDirections: number;
  actionsWebsite: number;
  photosViewsMerchant: number;
  error?: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} style={{ color: i <= rating ? GOLD : "#2A2A32", fill: i <= rating ? GOLD : "#2A2A32" }} />
      ))}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, ...style }}>
      {children}
    </div>
  );
}

function Pill({ label, color = GOLD }: { label: string; color?: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}>
      {label}
    </span>
  );
}

export default function GoogleBusinessClient() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"reviews" | "insights" | "posts">("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [loadingReply, setLoadingReply] = useState<string | null>(null);
  const [postType, setPostType] = useState<"STANDARD" | "OFFER" | "EVENT">("OFFER");
  const [postTopic, setPostTopic] = useState("");
  const [postDraft, setPostDraft] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadingReviews(true);
    setLoadingInsights(true);
    setReviewError(null);
    setInsightError(null);

    fetch("/api/google-business/reviews")
      .then(r => r.json())
      .then((d: { reviews?: Review[]; averageRating?: number; totalReviewCount?: number; error?: string }) => {
        if (d.error) { setReviewError(d.error); return; }
        setReviews(d.reviews ?? []);
        setAvgRating(d.averageRating ?? 0);
        setTotalCount(d.totalReviewCount ?? 0);
      })
      .catch(e => setReviewError(String(e)))
      .finally(() => setLoadingReviews(false));

    fetch(`/api/google-business/insights?days=${days}`)
      .then(r => r.json())
      .then((d: Insights & { error?: string }) => {
        if (d.error) { setInsightError(d.error); return; }
        setInsights(d);
      })
      .catch(e => setInsightError(String(e)))
      .finally(() => setLoadingInsights(false));
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      const data = await res.json() as { reply?: string };
      if (data.reply) setDraftReplies(p => ({ ...p, [review.reviewId]: data.reply! }));
    } finally { setLoadingReply(null); }
  };

  const postReply = async (reviewId: string, comment: string) => {
    await fetch("/api/google-business/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, comment }),
    });
    setDraftReplies(p => { const n = { ...p }; delete n[reviewId]; return n; });
    fetchData();
  };

  const generatePost = async () => {
    setLoadingPost(true);
    try {
      const res = await fetch(`/api/google-business/posts?type=${postType}&topic=${encodeURIComponent(postTopic || "Summer special")}`);
      const data = await res.json() as { draft?: string };
      if (data.draft) setPostDraft(data.draft);
    } finally { setLoadingPost(false); }
  };

  const publishPost = async () => {
    setPublishingPost(true);
    try {
      await fetch("/api/google-business/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicType: postType, summary: postDraft }),
      });
      setPostDraft(""); setPostTopic(""); setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } finally { setPublishingPost(false); }
  };

  const isLoading = loadingReviews && loadingInsights;

  // KPI summary
  const totalViews = (insights?.viewsMaps ?? 0) + (insights?.viewsSearch ?? 0);
  const totalSearches = (insights?.queriesDirect ?? 0) + (insights?.queriesIndirect ?? 0);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Google Business Profile
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: TEXT }}>Local Presence Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Reviews, search visibility, and customer actions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={days === d ? { backgroundColor: GOLD, color: "#0A0A0D" } : { color: MUTED }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={fetchData} disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg Rating", value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—", sub: `${totalCount} reviews` },
          { label: "Total Views", value: totalViews > 0 ? totalViews.toLocaleString() : "—", sub: "Maps + Search" },
          { label: "Searches", value: totalSearches > 0 ? totalSearches.toLocaleString() : "—", sub: "Direct + discovery" },
          { label: "Phone Calls", value: insights?.actionsPhone != null ? insights.actionsPhone.toLocaleString() : "—", sub: "From listing" },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16 }} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: DIM }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: TEXT }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: DIM }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {([
            { key: "reviews", label: "Reviews", icon: Star },
            { key: "insights", label: "Local Insights", icon: MapPin },
            { key: "posts", label: "GBP Posts", icon: Pencil },
          ] as const).map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors"
                style={{
                  borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
                  color: active ? GOLD : MUTED,
                }}>
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Reviews Tab ─── */}
      {tab === "reviews" && (
        loadingReviews ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: GOLD }} />
          </div>
        ) : reviewError ? (
          <div className="flex items-start gap-3 p-5 rounded-xl" style={{ backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#F87171" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#F87171" }}>Could not load reviews</p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>{reviewError}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Summary card */}
            <Card>
              <div className="p-6">
                <h2 className="text-sm font-semibold mb-5" style={{ color: TEXT }}>Rating Summary</h2>
                <div className="flex items-center gap-4 mb-5">
                  <div className="text-center">
                    <p className="text-5xl font-bold" style={{ color: GOLD }}>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
                    <StarRow rating={Math.round(avgRating)} />
                    <p className="text-xs mt-1" style={{ color: DIM }}>{totalCount} total</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map(n => {
                      const count = reviews.filter(r => RATING_MAP[r.starRating] === n).length;
                      const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                      return (
                        <div key={n} className="flex items-center gap-2">
                          <span className="text-xs w-2" style={{ color: DIM }}>{n}</span>
                          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GOLD }} />
                          </div>
                          <span className="text-xs w-4 text-right" style={{ color: DIM }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-4 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: MUTED }}>Response rate</span>
                    <span className="font-medium" style={{ color: "#22C55E" }}>
                      {reviews.length > 0
                        ? `${Math.round((reviews.filter(r => r.reviewReply).length / reviews.length) * 100)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Review feed */}
            <div className="md:col-span-2 space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-16" style={{ color: MUTED }}>No reviews found</div>
              ) : (
                reviews.map(review => {
                  const stars = RATING_MAP[review.starRating] ?? 0;
                  const draft = draftReplies[review.reviewId];
                  return (
                    <Card key={review.reviewId}>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>
                              {review.reviewer.displayName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: TEXT }}>{review.reviewer.displayName}</p>
                              <StarRow rating={stars} />
                            </div>
                          </div>
                          <span className="text-xs" style={{ color: DIM }}>
                            {new Date(review.createTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed mb-4" style={{ color: MUTED }}>{review.comment}</p>
                        {review.reviewReply ? (
                          <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: `${GOLD}08`, borderLeft: `3px solid ${GOLD}` }}>
                            <span className="font-semibold" style={{ color: GOLD }}>Owner reply: </span>
                            <span style={{ color: MUTED }}>{review.reviewReply.comment}</span>
                          </div>
                        ) : draft ? (
                          <div className="space-y-2">
                            <textarea value={draft}
                              onChange={e => setDraftReplies(p => ({ ...p, [review.reviewId]: e.target.value }))}
                              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                              style={{ backgroundColor: "#1A1A22", border: `1px solid ${BORDER}`, color: TEXT }}
                              rows={3} />
                            <button onClick={() => postReply(review.reviewId, draft)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                              style={{ backgroundColor: GOLD, color: "#0A0A0D" }}>
                              <Send size={13} /> Post Reply
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => draftReply(review)} disabled={loadingReply === review.reviewId}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            style={{ border: `1px solid ${GOLD}30`, color: GOLD }}>
                            {loadingReply === review.reviewId
                              ? <><Loader2 size={13} className="animate-spin" /> Drafting...</>
                              : <><MessageSquare size={13} /> AI Draft Reply</>}
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )
      )}

      {/* ─── Insights Tab ─── */}
      {tab === "insights" && (
        loadingInsights ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: GOLD }} />
          </div>
        ) : insightError ? (
          <div className="flex items-start gap-3 p-5 rounded-xl" style={{ backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#F87171" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#F87171" }}>Could not load insights</p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>{insightError}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <div className="p-6">
                <h2 className="text-sm font-semibold mb-5" style={{ color: TEXT }}>Search Visibility</h2>
                <div className="space-y-5">
                  {[
                    { label: "Direct searches", value: insights?.queriesDirect ?? 0, icon: Globe, color: GOLD },
                    { label: "Discovery searches", value: insights?.queriesIndirect ?? 0, icon: MapPin, color: "#2DD4BF" },
                    { label: "Views on Maps", value: insights?.viewsMaps ?? 0, icon: MapPin, color: "#7C3AED" },
                    { label: "Views on Search", value: insights?.viewsSearch ?? 0, icon: Globe, color: "#22C55E" },
                  ].map(item => {
                    const Icon = item.icon;
                    const total = (insights?.queriesDirect ?? 0) + (insights?.queriesIndirect ?? 0) + (insights?.viewsMaps ?? 0) + (insights?.viewsSearch ?? 0);
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                          <span className="flex items-center gap-2" style={{ color: TEXT }}>
                            <Icon size={13} style={{ color: item.color }} /> {item.label}
                          </span>
                          <span className="font-semibold tabular-nums" style={{ color: item.color }}>{item.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-sm font-semibold mb-5" style={{ color: TEXT }}>Customer Actions</h2>
                <div className="space-y-1">
                  {[
                    { label: "Phone calls", value: insights?.actionsPhone ?? 0, icon: Phone, color: GOLD },
                    { label: "Direction requests", value: insights?.actionsDirections ?? 0, icon: Navigation, color: "#2DD4BF" },
                    { label: "Website clicks", value: insights?.actionsWebsite ?? 0, icon: Globe, color: "#22C55E" },
                    { label: "Photo views", value: insights?.photosViewsMerchant ?? 0, icon: MapPin, color: "#7C3AED" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center justify-between py-3"
                        style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <span className="flex items-center gap-3 text-sm" style={{ color: TEXT }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${item.color}15` }}>
                            <Icon size={14} style={{ color: item.color }} />
                          </div>
                          {item.label}
                        </span>
                        <span className="text-xl font-bold tabular-nums" style={{ color: item.color }}>
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )
      )}

      {/* ─── Posts Tab ─── */}
      {tab === "posts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <div className="p-6 space-y-4">
              <h2 className="text-sm font-semibold" style={{ color: TEXT }}>Create GBP Post</h2>
              {publishSuccess && (
                <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}>
                  ✓ Post published to Google Business
                </div>
              )}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: DIM }}>Post Type</p>
                <div className="flex gap-2">
                  {(["STANDARD", "OFFER", "EVENT"] as const).map(t => (
                    <button key={t} onClick={() => setPostType(t)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                      style={postType === t
                        ? { backgroundColor: GOLD, color: "#0A0A0D" }
                        : { border: `1px solid ${BORDER}`, color: MUTED }}>
                      {t === "STANDARD" ? "Update" : t === "OFFER" ? "Offer" : "Event"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: DIM }}>Topic / Offer</p>
                <input value={postTopic} onChange={e => setPostTopic(e.target.value)}
                  placeholder="e.g. Summer Botox special — 10% off"
                  className="w-full rounded-lg px-3 py-2 text-sm" />
              </div>
              <button onClick={generatePost} disabled={loadingPost}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: GOLD, color: "#0A0A0D", opacity: loadingPost ? 0.7 : 1 }}>
                {loadingPost ? <><Loader2 size={14} className="animate-spin" /> Drafting...</> : "✦ AI Draft Post"}
              </button>
              {postDraft && (
                <>
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: DIM }}>Post Content</p>
                    <textarea value={postDraft} onChange={e => setPostDraft(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm resize-none" rows={6} />
                    <p className="text-xs mt-1" style={{ color: DIM }}>{postDraft.length} / 1500</p>
                  </div>
                  <button onClick={publishPost} disabled={publishingPost}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: "#1A2A1A", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E", opacity: publishingPost ? 0.7 : 1 }}>
                    {publishingPost ? <><Loader2 size={14} className="animate-spin" /> Publishing...</> : <><Send size={14} /> Publish to Google Business</>}
                  </button>
                </>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-sm font-semibold mb-4" style={{ color: TEXT }}>Posting Tips</h2>
              <div>
                {[
                  { tip: "Post at least once per week to maintain visibility in local search", color: GOLD },
                  { tip: "Offer posts with promo codes get 2× more clicks than standard updates", color: "#2DD4BF" },
                  { tip: "Include a clear CTA — 'Book now', 'Call us', or 'Learn more'", color: "#7C3AED" },
                  { tip: "Add a photo to every post — posts with photos get 42% more direction requests", color: "#22C55E" },
                  { tip: "Respond to all reviews within 24 hours — it directly affects local ranking", color: GOLD },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-3"
                    style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
