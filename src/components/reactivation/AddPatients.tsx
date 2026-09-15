"use client";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { Download, FileSpreadsheet, UserPlus, Users, ArrowUpRight, Search, CheckCircle2 } from "lucide-react";
import PatientDialog from "./PatientDialog";
import { csvPatient, emptyPatient, PATIENT_STATUSES, validatePatient, type PatientInput, type PatientImportResult, type LeadCandidate } from "@/lib/reactivation/patient-input";
import s from "./reactivation.module.css";
type Mode="leads"|"manual"|"csv";
const titles={leads:"Add patients from leads",manual:"Add a patient",csv:"Import patients from CSV"};
async function request<T>(url:string,init?:RequestInit):Promise<T>{const r=await fetch(url,{...init,cache:"no-store"});const b=await r.json();if(!r.ok)throw new Error(b.error||"Could not complete the request.");return b;}
export default function AddPatients({onAdded}:{onAdded:()=>void|Promise<void>}){
  const [mode,setMode]=useState<Mode|null>(null);
  const [manual,setManual]=useState<PatientInput>({...emptyPatient});
  const [leads,setLeads]=useState<LeadCandidate[]>([]);
  const [leadIds,setLeadIds]=useState<Set<string>>(new Set());
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [csvRows,setCsvRows]=useState<Record<string,unknown>[]>([]);
  const [filename,setFilename]=useState("");
  const [result,setResult]=useState<PatientImportResult|null>(null);
  const inFlight=useRef(false);const loadId=useRef(0);
  async function fetchLeads(){
    const id=++loadId.current;setLoading(true);setError("");
    try{const b=await request<{leads:LeadCandidate[]}>("/api/reactivation/patients/leads");if(loadId.current===id)setLeads(b.leads);}
    catch(e){if(loadId.current===id)setError(e instanceof Error?e.message:"Could not load leads.");}
    finally{if(loadId.current===id)setLoading(false);}
  }
  function open(next:Mode){setMode(next);setError("");setResult(null);setLeadIds(new Set());setQuery("");setCsvRows([]);setFilename("");setManual({...emptyPatient});if(next==="leads")void fetchLeads();}
  function close(){if(busy)return;++loadId.current;setMode(null);}
  const visible=leads.filter(l=>[l.name,l.email,l.phone].join(" ").toLowerCase().includes(query.toLowerCase()));
  const available=visible.filter(l=>!l.alreadyPatient);
  const preview=csvRows.map((r,i)=>({row:i+1,...validatePatient(r),name:String(r.name||"Unnamed row")}));
  const validCount=preview.filter(r=>r.patient).length;
  function parseFile(file?:File){
    setResult(null);setCsvRows([]);setError("");setFilename(file?.name||"");
    if(!file)return;
    if(!file.name.toLowerCase().endsWith(".csv")||file.size>2_000_000){setError("Choose a CSV file up to 2 MB with at most 200 patients.");return;}
    setLoading(true);
    Papa.parse<Record<string,string>>(file,{header:true,skipEmptyLines:"greedy",transformHeader:h=>h.trim(),complete:parsed=>{
      setLoading(false);
      if(parsed.errors.length){setError("CSV could not be read: "+parsed.errors[0].message);return;}
      if(!parsed.data.length||parsed.data.length>200){setError("CSV must contain 1–200 patient rows.");return;}
      const rows=parsed.data.map(csvPatient);
      if(!rows.some(r=>"name" in r)){setError('Include a "Name" column. Download the template for supported headers.');return;}
      setCsvRows(rows);
    },error:()=>{setLoading(false);setError("Could not read this CSV file.");}});
  }
  function template(){
    const text="Name,Phone,Email,Last Visit Date,Last Treatment,Status,SMS Consent,Email Consent,Consent Source,Opted Out,Do Not Contact,Future Booking\r\n";
    const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="harmony-patients-template.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function save(){
    if(!mode||inFlight.current)return;
    if(mode==="manual"){const v=validatePatient(manual);if(v.errors.length){setError(v.errors.join(". "));return;}}
    if(mode==="csv"&&!validCount)return;
    if(mode==="leads"&&(!leadIds.size||leadIds.size>200))return;
    inFlight.current=true;setBusy(true);setError("");
    try{
      const payload=mode==="leads"?{mode,leadIds:[...leadIds]}:{mode,patients:mode==="manual"?[manual]:csvRows};
      const response=await request<PatientImportResult>("/api/reactivation/patients/add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      setResult(response);await onAdded();
    }catch(e){setError(e instanceof Error?e.message:"Could not save patients.");}
    finally{inFlight.current=false;setBusy(false);}
  }
  const actions:[Mode,typeof Users,string,string][]=[["leads",Users,"From existing leads","Select leads to copy into Patients. Original lead records stay unchanged."],["manual",UserPlus,"Add manually","Create one patient with contact details and an optional last visit."],["csv",FileSpreadsheet,"Import a CSV","Upload up to 200 rows. Review validation and duplicates before saving."]];
  const count=mode==="leads"?leadIds.size:mode==="csv"?validCount:1;
  return <section className={s.panel}>
    <div className={s.addHeader}><div><span className={s.eyebrow}>Patient management</span><h3>Bring your patient directory together.</h3><p className={s.muted}>Create a patient record, choose existing CRM contacts, or upload a patient list.</p></div><span className={s.addHint}>01 · Add patients<br/>02 · Review and enroll</span></div>
    <div className={s.addGrid}>{actions.map(([key,Icon,title,description])=><button key={key} className={s.addCard} onClick={()=>open(key)}><span className={s.avatar}><Icon size={21}/></span><span><strong>{title}</strong><small>{description}</small></span><span className={s.addAction}>Get started <ArrowUpRight size={14}/></span></button>)}</div>
    <PatientDialog open={mode!==null} onClose={close} title={mode?titles[mode]:"Add patients"} eyebrow="Patient directory" busy={busy||loading} footer={result?<button className={s.button+" "+s.primary} onClick={close}>Done</button>:<><button className={s.button} disabled={busy||loading} onClick={close}>Cancel</button><button className={s.button+" "+s.primary} disabled={busy||loading||!count||count>200||(mode==="leads"&&Boolean(error))} onClick={save}>{busy?"Saving patients…":"Add "+count+" patient"+(count===1?"":"s")}</button></>}>
      {result?<><div className={s.notice} role="status"><CheckCircle2 size={20}/><strong className="block mt-2">{result.created} added · {result.skipped.length} skipped · {result.failed.length} not confirmed</strong><p className={s.muted}>Patient records are saved separately from campaign enrollment. No messages were sent.</p></div>{[...result.skipped,...result.failed].length>0&&<ul className={s.exclusions}>{[...result.skipped,...result.failed].sort((a,b)=>a.row-b.row).map(r=><li key={r.row}><strong>Row {r.row} · {r.name}</strong><br/>{r.reason}</li>)}</ul>}{!result.created&&<button className={s.button} onClick={()=>{setResult(null);setError("");}}>Back to edit</button>}</>:<>
      {mode==="manual"&&<form id="new-patient-form" onSubmit={e=>{e.preventDefault();void save();}} className="space-y-4">
        <div className={s.formGrid}>{([["name","Patient name","text"],["phone","Phone","tel"],["email","Email","email"],["lastVisit","Last visit date","date"],["lastTreatment","Last treatment","text"]] as const).map(([key,label,type])=><label className={s.label} key={key}>{label}{key==="name"?" *":""}<input className={s.input} type={type} value={manual[key]} disabled={busy} required={key==="name"} maxLength={key==="email"?254:200} onChange={e=>setManual(p=>({...p,[key]:e.target.value}))}/></label>)}<label className={s.label}>Patient status<select className={s.input} disabled={busy} value={manual.status} onChange={e=>setManual(p=>({...p,status:e.target.value}))}>{PATIENT_STATUSES.map(v=><option key={v}>{v}</option>)}</select></label></div>
        <p className={s.muted}>Provide a phone number or email. Leave the last visit blank if it is unknown.</p>
        <details><summary className="cursor-pointer text-sm font-semibold">Contact preferences</summary><div className="mt-3 space-y-2">{([["smsConsent","SMS consent confirmed"],["emailConsent","Email consent confirmed"],["optedOut","Opted out"],["doNotContact","Do not contact"],["futureBooking","Has a future booking"]] as const).map(([key,label])=><label key={key} className={s.toggle}><input type="checkbox" checked={manual[key]} disabled={busy} onChange={e=>setManual(p=>({...p,[key]:e.target.checked}))}/>{label}</label>)}<label className={s.label}>Consent source<input className={s.input} value={manual.consentSource} disabled={busy} placeholder="Where the patient's consent was recorded" onChange={e=>setManual(p=>({...p,consentSource:e.target.value}))}/></label></div></details>
      </form>}
      {mode==="leads"&&<><p className={s.muted}>Selected leads are copied into Patients. Their existing lead records stay unchanged. Unknown visit dates and consent are left unconfirmed.</p><label className={s.search}><Search size={16}/><input className={s.input} aria-label="Search leads to add" placeholder="Search name, phone, or email…" value={query} onChange={e=>setQuery(e.target.value)}/></label>{loading?<p role="status">Loading leads…</p>:!leads.length&&!error?<p className={s.muted}>No leads are available yet.</p>:!visible.length&&!error?<p className={s.muted}>No leads match this search.</p>:<><label className={s.toggle}><input type="checkbox" disabled={busy||!available.length} checked={available.length>0&&available.every(l=>leadIds.has(l.id))} onChange={e=>setLeadIds(old=>{const next=new Set(old);available.forEach(l=>e.target.checked?next.add(l.id):next.delete(l.id));return next;})}/>Select all available in this search · {leadIds.size} selected</label><div className={s.leadList}>{visible.map(l=><label key={l.id} className={s.leadChoice}><input type="checkbox" disabled={busy||l.alreadyPatient} checked={leadIds.has(l.id)} onChange={()=>setLeadIds(old=>{const next=new Set(old);if(next.has(l.id))next.delete(l.id);else next.add(l.id);return next;})}/><span><strong>{l.name}</strong><small>{l.email||l.phone||"No contact details"}{l.email&&l.phone?" · "+l.phone:""}</small></span><span className={s.badge+" "+s.neutral}>{l.alreadyPatient?"Already a patient":l.status||"Lead"}</span></label>)}</div>{leadIds.size>200&&<p role="alert">Choose up to 200 leads at a time.</p>}</>}</>}
      {mode==="csv"&&<><button className={s.button} onClick={template}><Download size={15}/>Download CSV template</button><label className={s.upload}><FileSpreadsheet size={28}/><strong>Choose your patient CSV</strong><span>Up to 200 rows · 2 MB maximum</span><input aria-label="Patient CSV file" type="file" accept=".csv,text/csv" disabled={busy||loading} onChange={e=>parseFile(e.target.files?.[0])}/></label><p className={s.muted}>Required: Name and either Phone or Email. Dates use YYYY-MM-DD. Consent values accept yes/no or true/false; blank means unconfirmed. Names, emails, and phone numbers are checked before saving.</p>{loading&&<p role="status">Reading CSV…</p>}{csvRows.length>0&&<><div className={s.notice}>{filename} · {csvRows.length} rows · {validCount} valid · {csvRows.length-validCount} need correction</div><div className={s.leadList}>{preview.map(p=><div key={p.row} className={s.leadChoice}><span><strong>{p.row}. {p.name}</strong><small>{p.patient?[p.patient.email,p.patient.phone].filter(Boolean).join(" · "):p.errors.join("; ")}</small></span><span className={s.badge+" "+(p.patient?"":s.neutral)}>{p.patient?"Ready":"Will be skipped"}</span></div>)}</div></>}</>}
      <p className={s.muted}>Duplicate records are skipped rather than overwritten. Adding patients does not enroll them or trigger messages.</p>
      </>}
      {error&&<div className={s.notice+" "+s.warning} role="alert">{error}{mode==="leads"&&!busy&&<button className={s.button+" mt-2"} onClick={fetchLeads}>Retry loading leads</button>}</div>}
    </PatientDialog>
  </section>;
}
