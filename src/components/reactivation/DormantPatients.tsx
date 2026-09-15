"use client";

import { LoadingRegion, Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { ArrowDownUp, ArrowUpRight, CalendarCheck, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, HeartHandshake, Plus, MailX, MessageCircleReply, RefreshCw, Search, ShieldCheck, Users, XCircle } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { DEFAULT_CAMPAIGN, CLINIC_ZONE, MAX_ENROLL, MAX_PER_DAY, staggeredSendAt, activeEnrollment, exclusionReasons, nextClinicSend, clinicSendISO, type Patient, type PatientMessage, type Workspace, type EnrollmentResult } from "@/lib/reactivation/model";
import PatientDialog from "./PatientDialog";
import AddPatients from "./AddPatients";
import DeletePatientButton from "./DeletePatientButton";
import s from "./reactivation.module.css";

function date(value:string,withTime=false) {
  if(!value)return "Not recorded";
  const d=DateTime.fromISO(value,{zone:CLINIC_ZONE}).setZone(CLINIC_ZONE);
  return d.isValid?d.toFormat(withTime?"MMM d, yyyy · h:mm a ZZZZ":"MMM d, yyyy"):"Not recorded";
}
const PAGE_SIZE=50;
const count=(n:number)=>n.toLocaleString("en-US");
function downloadCsv(filename:string,rows:string[][]){
  const text=rows.map(r=>r.map(v=>/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
// Read the clock only from event handlers; the server re-checks the send time.
const currentTime=()=>Date.now();
type SortKey="name"|"phone"|"email"|"lastVisit"|"days"|"lastTreatment"|"status"|"emailConsent"|"enrollment";
const columns:[SortKey,string][]=[["name","Patient"],["phone","Phone"],["email","Email"],["lastVisit","Last visit"],["days","Days away"],["lastTreatment","Last treatment"],["status","Status"],["emailConsent","Email consent"],["enrollment","Enrollment"]];
async function json<T>(url:string,options?:RequestInit):Promise<T> {
  const response=await fetch(url,{...options,cache:"no-store"});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"Request failed. Please retry.");
  return data;
}
export default function DormantPatients({initial,initialError,canManage,canDelete=false}:{initial:Workspace|null;initialError:string;canManage:boolean;canDelete?:boolean}) {
  const router=useRouter();
  const [data,setData]=useState(initial);
  const [error,setError]=useState(initialError);
  const [loading,setLoading]=useState(false);
  const [statuses,setStatuses]=useState<string[]>([]);
  const [hideEnrolled,setHideEnrolled]=useState(true);
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [perDay,setPerDay]=useState("");
  const [resultRows,setResultRows]=useState<string[][]>([]);
  const [actionBusy,setActionBusy]=useState("");
  const [sort,setSort]=useState<{key:SortKey;desc:boolean}>({key:"days",desc:true});
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [modal,setModal]=useState(false);
  const [campaign,setCampaign]=useState(initial?.campaigns.includes(DEFAULT_CAMPAIGN)?DEFAULT_CAMPAIGN:initial?.campaigns[0]||"");
  const [send,setSend]=useState("");
  const [now,setNow]=useState(0);
  const [busy,setBusy]=useState(false);
  const [reviewError,setReviewError]=useState("");
  const [result,setResult]=useState<EnrollmentResult|null>(null);
  const [toast,setToast]=useState<{message:string;variant:"success"|"danger"|"warning"}|null>(null);
  const [patientId,setPatientId]=useState<string|null>(null);
  const [detail,setDetail]=useState<{patient:Patient;messages:PatientMessage[]}|null>(null);
  const [detailError,setDetailError]=useState("");
  const [detailLoading,setDetailLoading]=useState(false);
  const [stopId,setStopId]=useState<string|null>(null);
  const allCheck=useRef<HTMLInputElement>(null);
  const loadVersion=useRef(0);
  const load=useCallback(async()=>{
    const version=++loadVersion.current;setLoading(true);setError("");
    try {const next=await json<Workspace>("/api/reactivation/patients?scope=all");if(version!==loadVersion.current)return;setData(next);setSelected(new Set());setCampaign(c=>next.campaigns.includes(c)?c:next.campaigns[0]||"");}
    catch(e){if(version===loadVersion.current)setError(e instanceof Error?e.message:"Could not load patients.");}
    finally{if(version===loadVersion.current)setLoading(false);}
  },[]);
  useEffect(()=>{
    if(!patientId)return;
    const controller=new AbortController();setDetail(null);setDetailError("");setDetailLoading(true);setStopId(null);
    json<{patient:Patient;messages:PatientMessage[]}>("/api/reactivation/patients/"+patientId,{signal:controller.signal}).then(setDetail).catch(e=>{if(!controller.signal.aborted)setDetailError(e.message);}).finally(()=>{if(!controller.signal.aborted)setDetailLoading(false);});
    return()=>controller.abort();
  },[patientId]);
  const patients=useMemo(()=>data?.patients??[],[data]);
  const visible=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return patients.filter(p=>(!hideEnrolled||!activeEnrollment(p))&&(!statuses.length||statuses.includes(p.status))&&[p.name,p.email,p.phone,p.phone.replace(/\D/g,"")].some(v=>v.toLowerCase().includes(needle))).sort((a,b)=>{
      const value=(p:Patient):string|number=>sort.key==="enrollment"?(activeEnrollment(p)?.currentStep||"Not enrolled"):sort.key==="emailConsent"?Number(p.emailConsent):sort.key==="days"?(p.days??-1):p[sort.key];
      const av=value(a),bv=value(b);const diff=typeof av==="number"&&typeof bv==="number"?av-bv:String(av).localeCompare(String(bv));
      return sort.desc?-diff:diff;
    });
  },[patients,query,hideEnrolled,statuses,sort]);
  const pages=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
  const currentPage=Math.min(page,pages);
  const pageRows=visible.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  const visibleSelected=visible.filter(p=>selected.has(p.id)).length;
  const pageSelected=pageRows.filter(p=>selected.has(p.id)).length;
  useEffect(()=>{if(allCheck.current)allCheck.current.indeterminate=pageSelected>0&&pageSelected<pageRows.length;},[pageSelected,pageRows.length]);
  // Changing what is shown clears the selection so hidden rows are never enrolled by accident.
  function refilter(apply:()=>void){apply();setPage(1);setSelected(new Set());}
  const selectedPatients=patients.filter(p=>selected.has(p.id));
  const excluded=selectedPatients.map(p=>({patient:p,reasons:exclusionReasons(p,campaign)})).filter(p=>p.reasons.length);
  const eligibleCount=selectedPatients.length-excluded.length;
  const sendISO=clinicSendISO(send);
  const validSend=Boolean(sendISO&&Date.parse(sendISO)>now);
  const perDayValue=perDay.trim()?Number(perDay):null;
  const validPerDay=perDayValue===null||(Number.isInteger(perDayValue)&&perDayValue>=1&&perDayValue<=MAX_PER_DAY);
  const sendDays=perDayValue&&validPerDay&&eligibleCount?Math.ceil(eligibleCount/perDayValue):1;
  const lastStart=sendISO&&perDayValue&&validPerDay&&eligibleCount?staggeredSendAt(sendISO,eligibleCount-1,perDayValue):sendISO;
  function toggle(id:string){setSelected(old=>{const next=new Set(old);if(next.has(id))next.delete(id);else next.add(id);return next;});}
  // Enroll a single patient from the drawer through the same review step.
  function enrollOne(id:string){setSelected(new Set([id]));setPatientId(null);void openReview();}
  async function openReview(){
    setReviewError("");setNow(currentTime());setSend(nextClinicSend());setModal(true);setBusy(true);
    try{
      const fresh=await json<Workspace>("/api/reactivation/patients?scope=all");
      // Keep deleted selected records visible so the server can explicitly report them.
      setData({...fresh,patients:[...fresh.patients,...selectedPatients.filter(p=>!fresh.patients.some(n=>n.id===p.id))]});
      setCampaign(c=>fresh.campaigns.includes(c)?c:fresh.campaigns[0]||"");
    }catch(e){setReviewError(e instanceof Error?e.message:"Could not verify eligibility.");}
    finally{setBusy(false);}
  }
  async function enroll(){
    if(!eligibleCount||!validSend||!sendISO||busy||reviewError)return;
    setBusy(true);
    try{
      const next=await json<EnrollmentResult>("/api/reactivation/enroll",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({patientIds:[...selected],campaign,firstSendAt:sendISO,perDay:validPerDay?perDayValue:null})});
      const skipped=new Map(next.skipped.map(r=>[r.id,r.reason]));
      setResultRows([["Name","Email","Outcome","Reason"],...selectedPatients.map(p=>[p.name,p.email,skipped.has(p.id)?"Skipped":"Enrolled",skipped.get(p.id)||""])]);
      setResult(next);setToast({message:next.created+" enrolled · "+next.skipped.length+" skipped",variant:next.skipped.length?"warning":"success"});setModal(false);setSelected(new Set());await load();router.refresh();
    }catch(e){setReviewError(e instanceof Error?e.message:"Enrollment failed.");}
    finally{setBusy(false);}
  }
  async function patientAction(action:"replied"|"booked"|"opted-out"){
    if(!patientId||actionBusy)return;setActionBusy(action);setDetailError("");
    try{
      const r=await json<{stopped:number}>("/api/reactivation/patients/"+patientId+"/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
      const label=action==="replied"?"Marked as replied":action==="booked"?"Marked as booked":"Unsubscribed from emails";
      setToast({message:label+(r.stopped?" · "+r.stopped+" enrollment stopped":""),variant:"success"});
      setDetail(await json("/api/reactivation/patients/"+patientId));await load();router.refresh();
    }catch(e){setDetailError(e instanceof Error?e.message:"Could not update patient.");}finally{setActionBusy("");}
  }
  async function stop(){
    if(!stopId)return;setBusy(true);setDetailError("");
    try{
      await json("/api/reactivation/stop",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enrollmentId:stopId})});
      setStopId(null);setToast({message:"Removed from campaign. Scheduled sends cleared; history retained.",variant:"success"});
      if(patientId)setDetail(await json("/api/reactivation/patients/"+patientId));
      await load();router.refresh();
    }catch(e){setDetailError(e instanceof Error?e.message:"Could not stop enrollment.");}finally{setBusy(false);}
  }
  const statusOptions=[...new Set(patients.map(p=>p.status))].sort();
  const ready=patients.filter(p=>(p.days===null||p.days>=90)&&!exclusionReasons(p,DEFAULT_CAMPAIGN).length).length;
  return <div className={s.workspace}>
    <section className={s.hero}>
      <div className={s.heroCopy}><span className={s.eyebrow}><HeartHandshake size={15}/> Patient reactivation</span><h2>A thoughtful reason<br/>to return to Harmony.</h2><p className={s.muted}>Find patients who haven’t visited recently, review their contact preferences, and plan a personal invitation back.</p><div className="mt-5 flex flex-wrap gap-2"><span className={s.badge}><ShieldCheck size={12}/> Contact preferences checked before enrollment</span><span className={s.badge+" "+s.neutral}><Clock3 size={12}/> New York time</span></div></div>
      <div className={s.heroStats}>{[[patients.length,"Patients in this view",""],[ready,"Ready for September","90+ days or unknown · contact checks passed"],[patients.filter(p=>activeEnrollment(p)).length,"In active reactivation",""],[patients.filter(p=>(p.days??0)>=180).length,"Away 180+ days",""]].map(([value,label,hint])=><div key={label} className={s.stat}><strong>{data?value:"—"}</strong><span>{label}</span>{hint&&<small>{hint}</small>}</div>)}</div>
    </section>
    {canManage&&<AddPatients onAdded={load}/>}
    {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    {result&&<div className={s.notice} role="status"><div className="flex justify-between gap-3"><strong>{result.created} patients enrolled · {result.skipped.length} skipped</strong><div className="flex gap-3"><button className={s.linkButton} onClick={()=>downloadCsv("reactivation-enrollment-"+new Date().toISOString().slice(0,10)+".csv",resultRows)}><Download size={14}/>Download results</button><button onClick={()=>setResult(null)} aria-label="Dismiss enrollment results">Dismiss</button></div></div>{result.skipped.length>0&&<ul className={s.exclusions}>{result.skipped.map(p=><li key={p.id}><strong>{p.name}</strong> — {p.reason}</li>)}</ul>}</div>}
    <section className={s.panel}>
      <div className={s.toolbar}><div><h3>Patient directory <span className={s.badge+" "+s.gold}>{visible.length}</span></h3><p className={s.muted}>{data?.source||<Skeleton className="mt-1 h-3 w-40 rounded-full"/>}</p></div><div className="flex gap-2 flex-wrap"><button className={s.button} onClick={()=>load()} disabled={loading}><RefreshCw size={14} className={loading?"animate-spin":""}/>Refresh</button>{canManage&&<button className={s.button+" "+s.primary} onClick={openReview} disabled={!selected.size||loading}><Users size={15}/>Enroll selected in Reactivation{selected.size>0?" ("+selected.size+")":""}</button>}</div></div>
      <div className={s.filters}>
        <label className={s.search}><Search size={16}/><input aria-label="Search patients by name, email or phone" className={s.input} placeholder="Search name, email, or phone…" value={query} onChange={e=>{const v=e.target.value;refilter(()=>setQuery(v));}}/></label>
        <label className={s.toggle}><input type="checkbox" checked={hideEnrolled} onChange={e=>{const v=e.target.checked;refilter(()=>setHideEnrolled(v));}}/>Hide already enrolled</label>
      </div>
      <div className={s.statusChoices}><span className={s.muted}>Status</span>{statusOptions.map(status=><label key={status} className={s.choice}><input type="checkbox" checked={statuses.includes(status)} onChange={()=>refilter(()=>setStatuses(old=>old.includes(status)?old.filter(v=>v!==status):[...old,status]))}/>{status}</label>)}{(statuses.length>0||query)&&<button className={s.muted} onClick={()=>refilter(()=>{setStatuses([]);setQuery("");})}>Clear filters</button>}<span className="ml-auto text-xs">{selected.size} selected{selected.size>visibleSelected?" · "+(selected.size-visibleSelected)+" outside current filters":""}</span>{selected.size>0&&<button className={s.muted} onClick={()=>setSelected(new Set())}>Clear selection</button>}</div>
      {canManage&&!error&&!loading&&visible.length>PAGE_SIZE&&pageRows.length>0&&pageSelected===pageRows.length&&<div className={s.selectBanner} role="status">{visibleSelected===visible.length?<><span>All <strong>{count(visible.length)}</strong> matching patients are selected.</span><button onClick={()=>setSelected(new Set())}>Clear selection</button></>:<><span>All {pageRows.length} patients on this page are selected.</span><button onClick={()=>setSelected(old=>{const next=new Set(old);visible.forEach(p=>next.add(p.id));return next;})}>Select all {count(visible.length)} matching patients</button></>}</div>}
      {error?<div className={s.empty} role="alert"><XCircle size={26}/><h3>Patient records couldn’t be loaded</h3><p className={s.muted}>{error}</p><button className={s.button+" mt-4"} onClick={()=>load()}>Try again</button></div>:loading?<LoadingRegion label="Loading patient records" className={s.tableWrap}><SkeletonRows rows={8}/></LoadingRegion>:!visible.length?<div className={s.empty}><Search size={28}/><h3>No patients match these filters</h3><p className={s.muted}>Add patients above, or adjust the search, status, and enrollment filters.</p></div>:<div className={s.tableWrap}><table className={s.table}><thead><tr><th><input ref={allCheck} type="checkbox" aria-label="Select all patients on this page" disabled={!canManage} checked={pageRows.length>0&&pageSelected===pageRows.length} onChange={e=>setSelected(old=>{const next=new Set(old);pageRows.forEach(p=>e.target.checked?next.add(p.id):next.delete(p.id));return next;})}/></th>{columns.map(([key,label])=><th key={key} aria-sort={sort.key===key?(sort.desc?"descending":"ascending"):"none"}><button onClick={()=>{setSort({key,desc:sort.key===key?!sort.desc:false});setPage(1);}}>{label}<ArrowDownUp size={11}/></button></th>)}</tr></thead><tbody>{pageRows.map(p=>{const active=activeEnrollment(p);return <tr key={p.id} onClick={()=>setPatientId(p.id)} className={selected.has(p.id)?s.selected:""}><td onClick={e=>e.stopPropagation()}><input type="checkbox" disabled={!canManage} aria-label={"Select "+p.name} checked={selected.has(p.id)} onChange={()=>toggle(p.id)}/></td><td><button className={s.person} onClick={e=>{e.stopPropagation();setPatientId(p.id);}}><span className={s.avatar}>{p.name.split(" ").slice(0,2).map(n=>n[0]).join("")}</span><strong>{p.name}</strong><ArrowUpRight size={12} className="opacity-40"/></button></td><td>{p.phone||"—"}</td><td>{p.email||"—"}</td><td>{date(p.lastVisit)}</td><td>{p.days===null?<span className={s.badge+" "+s.neutral} title="No last visit date recorded">Unknown</span>:<span className={s.days}><strong>{p.days}</strong><span className={s.bar}><i style={{width:Math.min(p.days/365*100,100)+"%"}}/></span></span>}</td><td>{p.lastTreatment||"—"}</td><td><span className={s.badge+" "+s.neutral}>{p.status}</span></td><td><span className={s.badge+" "+(!p.emailConsent?s.neutral:"")}>{p.emailConsent?<CheckCircle2 size={12}/>:null}{p.emailConsent?"Confirmed":"Not recorded"}</span></td><td>{active?<div><span className={s.badge}>{active.status}</span><p className="mt-1 text-xs">{active.currentStep}</p></div>:<span className={s.muted}>Not enrolled</span>}</td></tr>;})}</tbody></table></div>}
      <footer className={s.footer}><span>{visible.length?count((currentPage-1)*PAGE_SIZE+1)+"–"+count((currentPage-1)*PAGE_SIZE+pageRows.length)+" of "+count(visible.length):"0"} patients · sorted by {columns.find(c=>c[0]===sort.key)?.[1].toLowerCase()}</span>{pages>1?<nav className={s.pager} aria-label="Patient pages"><button className={s.button} disabled={currentPage===1} onClick={()=>setPage(currentPage-1)} aria-label="Previous page"><ChevronLeft size={15}/></button><span>Page {currentPage} of {pages}</span><button className={s.button} disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)} aria-label="Next page"><ChevronRight size={15}/></button></nav>:<span>Contact permissions are verified again when enrolling.</span>}</footer>
    </section>
    <PatientDialog open={modal} onClose={()=>{if(!busy)setModal(false);}} title="Review reactivation enrollment" eyebrow="Plan the next conversation" busy={busy} footer={<><button className={s.button} disabled={busy} onClick={()=>setModal(false)}>Cancel</button><button className={s.button+" "+s.primary} disabled={busy||!eligibleCount||!validSend||!campaign||Boolean(reviewError)||selected.size>MAX_ENROLL||!validPerDay||data?.unsubscribeReady===false} onClick={enroll}>{busy?"Enrolling…":"Enroll "+eligibleCount.toLocaleString("en-US")+(eligibleCount===1?" patient":" patients")}</button></>}>
      {data?.unsubscribeReady===false&&<p role="alert" className={s.notice+" "+s.warning}><strong>Enrollment is blocked:</strong> unsubscribe links aren’t configured on the server yet, so emails would go out with a broken unsubscribe link. Add REACTIVATION_UNSUBSCRIBE_SECRET in the hosting settings and redeploy.</p>}
      <p className={s.muted}>{selectedPatients.length} selected · <strong>{eligibleCount} eligible</strong> · {excluded.length} excluded</p>
      <label className={s.label}>Campaign<select className={s.input} disabled={busy} value={campaign} onChange={e=>setCampaign(e.target.value)}>{data?.campaigns.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className={s.label}>First Send At · America/New_York<input className={s.input} type="datetime-local" value={send} disabled={busy} onChange={e=>{setNow(currentTime());setSend(e.target.value);}}/></label>
      <label className={s.label}>Patients per day · optional<input className={s.input} type="number" min={1} max={MAX_PER_DAY} step={1} inputMode="numeric" placeholder="Leave blank to start everyone at the same time" value={perDay} disabled={busy} onChange={e=>setPerDay(e.target.value)}/></label>
      {!validPerDay&&<p role="alert" className={s.notice+" "+s.warning}>Enter a whole number from 1 to {count(MAX_PER_DAY)}, or leave it blank.</p>}
      {validPerDay&&perDayValue&&eligibleCount>0&&<p className={s.notice}>First emails start over <strong>{sendDays} {sendDays===1?"day":"days"}</strong>, {count(Math.min(perDayValue,eligibleCount))} per day. The last group starts {date(lastStart||"",true)}.</p>}
      <p className={s.muted}><CalendarClock size={14} className="inline mr-2"/>Scheduled in the clinic’s timezone. Enrollment queues the first email for your reactivation automation.</p>
      {!validSend&&<p role="alert" className={s.notice+" "+s.warning}>Choose a valid future date and time.</p>}
      {selected.size>MAX_ENROLL&&<p role="alert" className={s.notice+" "+s.warning}>Select up to {MAX_ENROLL.toLocaleString("en-US")} patients per enrollment.</p>}
      {excluded.length>0&&<div className={s.notice+" "+s.warning}><strong>{excluded.length} patients will be excluded</strong><ul className={s.exclusions}>{excluded.map(({patient,reasons})=><li key={patient.id}><strong>{patient.name}</strong> — {reasons.join("; ")}</li>)}</ul></div>}
      {reviewError&&<div role="alert" className={s.notice+" "+s.warning}>{reviewError}<button className={s.button+" mt-2"} disabled={busy} onClick={openReview}>Recheck eligibility</button></div>}
    </PatientDialog>
    <PatientDialog open={Boolean(patientId)} onClose={()=>{if(!busy)setPatientId(null);}} title={detail?.patient.name||"Patient details"} eyebrow="Patient profile" drawer busy={busy}>
      {detailLoading?<LoadingRegion label="Loading patient history" className="grid gap-5"><div className={s.detailGrid}>{[0,1,2,3,4,5].map(i=><div key={i}><Skeleton className="h-2.5 w-16 rounded-full"/><Skeleton className="mt-2.5 h-3.5 w-3/4 rounded-full"/></div>)}</div><div className="flex flex-wrap gap-2">{[0,1,2,3].map(i=><Skeleton key={i} className="h-6 w-28 rounded-full"/>)}</div><Skeleton className="h-3.5 w-40 rounded-full"/>{[0,1].map(i=><div key={i} className={s.history}><Skeleton className="h-3.5 w-1/2 rounded-full"/><Skeleton className="mt-3 h-3 w-1/3 rounded-full"/><Skeleton className="mt-3 h-14 w-full rounded-lg"/></div>)}</LoadingRegion>:detailError?<div className={s.notice+" "+s.warning} role="alert">{detailError}<button className={s.button+" mt-3"} onClick={async()=>{setDetailLoading(true);try{setDetail(await json("/api/reactivation/patients/"+patientId));setDetailError("");}catch(e){setDetailError(e instanceof Error?e.message:"Could not load history.");}finally{setDetailLoading(false);}}}>Retry history</button></div>:null}
      {detail&&!detailLoading&&<><dl className={s.detailGrid}>{[["Phone",detail.patient.phone],["Email",detail.patient.email],["Last visit",date(detail.patient.lastVisit)],["Days since last visit",detail.patient.days===null?"Unknown":String(detail.patient.days)],["Last treatment",detail.patient.lastTreatment],["Status",detail.patient.status]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||"Not recorded"}</dd></div>)}</dl><div className="flex flex-wrap gap-2">{[["Email consent",detail.patient.emailConsent],["Opted out",detail.patient.optedOut],["Do not contact",detail.patient.doNotContact],["Future booking",detail.patient.futureBooking]].map(([label,value])=><span key={String(label)} className={s.badge+" "+s.neutral}>{label}: {value?"Yes":"No"}</span>)}</div>
      {canManage&&(()=>{const current=activeEnrollment(detail.patient);const reasons=exclusionReasons(detail.patient,campaign||DEFAULT_CAMPAIGN).filter(r=>r!=="Already active in this campaign");return current?<p className={s.notice}>Enrolled in {current.campaign} · {current.currentStep}</p>:<><button className={s.button+" "+s.primary} disabled={reasons.length>0||busy} onClick={()=>enrollOne(detail.patient.id)}><Plus size={15}/>Enroll in {campaign||DEFAULT_CAMPAIGN}</button>{reasons.length>0&&<p className={s.muted}>Can’t enroll: {reasons.join("; ")}.</p>}</>;})()}
      {canManage&&<div className={s.actionRow}>{([["replied","Mark replied",MessageCircleReply],["booked","Mark booked",CalendarCheck],["opted-out","Unsubscribe",MailX]] as const).map(([action,label,Icon])=><button key={action} className={s.button} disabled={Boolean(actionBusy)||busy} onClick={()=>void patientAction(action)}>{actionBusy===action?<RefreshCw size={14} className="animate-spin"/>:<Icon size={14}/>}{label}</button>)}</div>}
      {canDelete&&<DeletePatientButton id={detail.patient.id} name={detail.patient.name} onDeleted={async()=>{setPatientId(null);setDetail(null);await load();router.refresh();setToast({message:"Patient permanently deleted. History retained.",variant:"success"});}}/>}<section><h3 className={s.sectionTitle}>Enrollment history · {detail.patient.enrollments.length}</h3>{!detail.patient.enrollments.length?<p className={s.muted}>This patient hasn’t been enrolled in reactivation.</p>:<div className={s.timeline}>{detail.patient.enrollments.map(e=><article key={e.id} className={s.history}><div className="flex justify-between gap-2"><h4>{e.campaign}</h4><span className={s.badge+" "+(e.status==="Active"?"":s.neutral)}>{e.status}</span></div><p>{e.currentStep}</p><p className={s.muted}>Enrolled: {date(e.createdAt,true)}<br/>Next send: {date(e.nextSendAt,true)}<br/>Last sent: {date(e.lastSentAt,true)}<br/>Stop reason: {e.stopReason||"—"}</p>{["Active","Paused"].includes(e.status)&&canManage&&(stopId===e.id?<div className={s.notice}><p>Remove this patient from the campaign? Scheduled sends will be cleared; enrollment and message history will remain.</p><div className="flex gap-2 mt-3"><button className={s.button} disabled={busy} onClick={()=>setStopId(null)}>Cancel</button><button className={s.button} disabled={busy} onClick={stop}>{busy?"Stopping…":"Remove from campaign"}</button></div></div>:<button className={s.button+" mt-3"} disabled={busy} onClick={()=>setStopId(e.id)}>Remove from campaign</button>)}</article>)}</div>}</section>
      <section><h3 className={s.sectionTitle}>Message history · {detail.messages.length}</h3>{!detail.messages.length?<p className={s.muted}>No messages have been logged for this patient yet.</p>:<div className={s.timeline}>{detail.messages.map(m=><article key={m.id} className={s.history}><div className="flex justify-between gap-2"><h4>{m.channel} · {m.step||"Step not recorded"}</h4><span className={s.badge+" "+s.neutral}>{m.status}</span></div><span className={s.muted}>{date(m.sentAt,true)}</span><p>{m.body||"Message body not recorded."}</p></article>)}</div>}</section></>}
    </PatientDialog>
  </div>;
}
