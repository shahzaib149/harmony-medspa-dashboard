"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { DEFAULT_CAMPAIGN, type ReactivationMetrics } from "@/lib/reactivation/model";
import { REACTIVATION_PATH, type ReactivationCampaignData } from "@/lib/reactivation/campaign";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
export default function ReactivationCampaignCard({query,status,type,onMetrics}:{query:string;status:string;type:string;onMetrics:(data:ReactivationMetrics)=>void}){
  const [data,setData]=useState<ReactivationCampaignData|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);setError("");try{const r=await fetch("/api/reactivation/campaign",{cache:"no-store"});const b=await r.json();if(!r.ok)throw new Error(b.error);setData(b);onMetrics({...b.metrics,paused:b.paused});}catch(e){setError(e instanceof Error?e.message:"Could not load campaign.");}finally{setLoading(false);}},[onMetrics]);
  useEffect(()=>{void load();},[load]);
  const state=data?.metrics.active?"Active":data?.paused?"Paused":"Idle";
  if(!DEFAULT_CAMPAIGN.toLowerCase().includes(query.toLowerCase())||(type!=="All"&&type!=="Manual Enrollment")||(status!=="All"&&(!data||status!==state)))return null;
  const style={background:"var(--surface-1)",borderColor:"rgba(201,168,76,.2)",color:"var(--text-primary)"};
  if(error)return <article className="rounded-2xl border p-5" style={style}><h2 className="font-bold">{DEFAULT_CAMPAIGN}</h2><p role="alert" className="mt-3 text-sm">{error}</p><button className="mt-3 rounded-lg border px-4 py-2" onClick={load}>Retry</button></article>;
  return <Link href={REACTIVATION_PATH} className="block rounded-2xl border p-4 transition-colors hover:bg-white/[.02] sm:p-5" style={style}><article>
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl" style={{background:"var(--brand-primary-soft)",color:"var(--brand-primary)"}}><HeartHandshake size={20}/></div><div className="min-w-0"><h2 className="text-base font-bold sm:text-lg">{DEFAULT_CAMPAIGN}</h2><p className="mt-1 line-clamp-2 text-sm leading-5" style={{color:"var(--text-muted)"}}>SMS and email follow-up for returning patients.</p></div></div>{!loading&&<CampaignStatusBadge status={state}/>}</div>
    <div className="mt-4 flex flex-wrap gap-2 text-[11px]" style={{color:"var(--text-muted)"}}>{["Manual Enrollment","Email","SMS"].map(v=><span key={v} className="rounded-full bg-white/5 px-2 py-1">{v}</span>)}</div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-busy={loading}>{[["Patients",data?.metrics.total],["Active",data?.metrics.active],["Completed",data?.metrics.completed],["Messages",data?data.metrics.sms+data.metrics.email:undefined]].map(([label,value])=><div key={label} className="rounded-xl bg-white/[.025] px-3 py-2.5"><p className="font-bold">{loading?"…":value}</p><p className="text-[10px]" style={{color:"var(--text-muted)"}}>{label}</p></div>)}</div>
    <div className="mt-4 border-t border-white/5 pt-3"><p className="text-xs" style={{color:"var(--text-muted)"}}>Last activity: {loading?"Loading…":formatCampaignDate(data?.lastActivity||null,"No activity yet")}</p></div>
  </article></Link>;
}
