"use client";

import { LoadingRegion, Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { Download, FileSpreadsheet, UserPlus, Users, ArrowUpRight, Search, CheckCircle2, UploadCloud, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import PatientDialog from "./PatientDialog";
import { csvPatient, emptyPatient, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, PATIENT_STATUSES, patientContactKeys, validatePatient, type PatientInput, type PatientImportResult, type LeadCandidate } from "@/lib/reactivation/patient-input";
import s from "./reactivation.module.css";
type Mode="leads"|"manual"|"csv";
const titles={leads:"Add patients from leads",manual:"Add a patient",csv:"Import patients from CSV"};
const PREVIEW_ROWS=8;
// Each request stays well inside serverless time limits; rows are sent in order.
const IMPORT_CHUNK=200;
const formatCount=(n:number)=>n.toLocaleString("en-US");
const formatBytes=(n:number)=>n<1_000_000?Math.max(1,Math.round(n/1000))+" KB":(n/1_000_000).toFixed(1)+" MB";
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
  const [file,setFile]=useState<{name:string;size:number}|null>(null);
  const [dragging,setDragging]=useState(false);
  const [progress,setProgress]=useState({done:0,total:0});
  const fileInput=useRef<HTMLInputElement>(null);
  const [result,setResult]=useState<PatientImportResult|null>(null);
  const inFlight=useRef(false);const loadId=useRef(0);
  async function fetchLeads(){
    const id=++loadId.current;setLoading(true);setError("");
    try{const b=await request<{leads:LeadCandidate[]}>("/api/reactivation/patients/leads");if(loadId.current===id)setLeads(b.leads);}
    catch(e){if(loadId.current===id)setError(e instanceof Error?e.message:"Could not load leads.");}
    finally{if(loadId.current===id)setLoading(false);}
  }
  function open(next:Mode){setMode(next);setError("");setResult(null);setLeadIds(new Set());setQuery("");setCsvRows([]);setFile(null);setManual({...emptyPatient});if(next==="leads")void fetchLeads();}
  function close(){if(busy)return;++loadId.current;setMode(null);}
  const visible=leads.filter(l=>[l.name,l.email,l.phone].join(" ").toLowerCase().includes(query.toLowerCase()));
  const available=visible.filter(l=>!l.alreadyPatient);
  const preview=useMemo(()=>{
    const seen=new Set<string>();
    return csvRows.map((r,i)=>{
      const v=validatePatient(r);const keys=v.patient?patientContactKeys(v.patient):[];
      const duplicate=keys.some(k=>seen.has(k));keys.forEach(k=>seen.add(k));
      return {row:i+1,...v,duplicate,name:String(r.name||"Unnamed row")};
    });
  },[csvRows]);
  const validCount=preview.filter(r=>r.patient&&!r.duplicate).length;
  const invalidRows=preview.filter(r=>!r.patient);
  const duplicateCount=preview.filter(r=>r.patient&&r.duplicate).length;
  function parseFile(next?:File){
    setResult(null);setCsvRows([]);setError("");setFile(next?{name:next.name,size:next.size}:null);
    if(fileInput.current)fileInput.current.value="";
    if(!next)return;
    if(!next.name.toLowerCase().endsWith(".csv")){setError("Choose a .csv file. Export your spreadsheet as CSV and try again.");return;}
    if(next.size>MAX_IMPORT_BYTES){setError("This file is "+formatBytes(next.size)+". Choose a CSV up to "+formatBytes(MAX_IMPORT_BYTES)+".");return;}
    setLoading(true);
    Papa.parse<Record<string,string>>(next,{header:true,skipEmptyLines:"greedy",transformHeader:h=>h.trim(),complete:parsed=>{
      setLoading(false);
      const fatal=parsed.errors.find(e=>e.type!=="Delimiter");
      if(fatal){setError("Row "+((fatal.row??0)+2)+" could not be read: "+fatal.message);return;}
      if(!parsed.data.length){setError("This CSV has a header row but no patients.");return;}
      if(parsed.data.length>MAX_IMPORT_ROWS){setError("This CSV has "+formatCount(parsed.data.length)+" rows. Split it into files of up to "+formatCount(MAX_IMPORT_ROWS)+" rows.");return;}
      const rows=parsed.data.map(csvPatient);
      if(!rows.some(r=>"name" in r)){setError('Include a "Name" column. Download the template for supported headers.');return;}
      setCsvRows(rows);
    },error:()=>{setLoading(false);setError("Could not read this CSV file.");}});
  }
  function template(){
    const text="Name,First Name,Email,Phone,Last Visit Date,Last Treatment,Status,Source,Email Consent,Consent Source,Opted Out,Do Not Contact,Future Booking,Notes\r\n";
    const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="harmony-patients-template.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function save(){
    if(!mode||inFlight.current)return;
    if(mode==="manual"){const v=validatePatient(manual);if(v.errors.length){setError(v.errors.join(". "));return;}}
    if(mode==="csv"&&!validCount)return;
    if(mode==="leads"&&(!leadIds.size||leadIds.size>200))return;
    inFlight.current=true;setBusy(true);setError("");
    const post=(payload:unknown)=>request<PatientImportResult>("/api/reactivation/patients/add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    try{
      if(mode!=="csv"){setResult(await post(mode==="leads"?{mode,leadIds:[...leadIds]}:{mode,patients:[manual]}));await onAdded();return;}
      const ready=preview.filter(r=>r.patient&&!r.duplicate);
      const total:PatientImportResult={created:0,skipped:[],failed:[]};
      setProgress({done:0,total:ready.length});
      for(let i=0;i<ready.length;i+=IMPORT_CHUNK){
        const chunk=ready.slice(i,i+IMPORT_CHUNK);
        // Server rows are numbered within the chunk; map them back to CSV rows.
        const toCsvRow=<T extends {row:number}>(r:T)=>({...r,row:chunk[r.row-1]?.row??r.row});
        try{
          const part=await post({mode,patients:chunk.map(r=>csvRows[r.row-1])});
          total.created+=part.created;total.skipped.push(...part.skipped.map(toCsvRow));total.failed.push(...part.failed.map(toCsvRow));
        }catch(e){
          const reason=(e instanceof Error?e.message:"Could not save patients.")+" Refresh the directory before retrying these rows.";
          for(const r of ready.slice(i))total.failed.push({row:r.row,name:r.name,reason});
          break;
        }finally{setProgress({done:Math.min(i+IMPORT_CHUNK,ready.length),total:ready.length});}
      }
      setResult(total);await onAdded();
    }catch(e){setError(e instanceof Error?e.message:"Could not save patients.");}
    finally{inFlight.current=false;setBusy(false);}
  }
  const actions:[Mode,typeof Users,string,string][]=[["leads",Users,"From existing leads","Select leads to copy into Patients. Original lead records stay unchanged."],["manual",UserPlus,"Add manually","Create one patient with contact details and an optional last visit."],["csv",FileSpreadsheet,"Import a CSV","Upload a patient list. Review validation and duplicates before saving."]];
  const count=mode==="leads"?leadIds.size:mode==="csv"?validCount:1;
  return <section className={s.panel}>
    <div className={s.addHeader}><div><span className={s.eyebrow}>Patient management</span><h3>Bring your patient directory together.</h3><p className={s.muted}>Create a patient record, choose existing CRM contacts, or upload a patient list.</p></div><span className={s.addHint}>01 · Add patients<br/>02 · Review and enroll</span></div>
    <div className={s.addGrid}>{actions.map(([key,Icon,title,description])=><button key={key} className={s.addCard} onClick={()=>open(key)}><span className={s.avatar}><Icon size={21}/></span><span><strong>{title}</strong><small>{description}</small></span><span className={s.addAction}>Get started <ArrowUpRight size={14}/></span></button>)}</div>
    <PatientDialog open={mode!==null} onClose={close} title={mode?titles[mode]:"Add patients"} eyebrow="Patient directory" busy={busy||loading} footer={result?<button className={s.button+" "+s.primary} onClick={close}>Done</button>:<><button className={s.button} disabled={busy||loading} onClick={close}>Cancel</button><button className={s.button+" "+s.primary} disabled={busy||loading||!count||(mode==="leads"&&(count>200||Boolean(error)))} onClick={save}>{busy?<><Loader2 size={15} className="animate-spin"/>Saving patients…</>:"Add "+formatCount(count)+" patient"+(count===1?"":"s")}</button></>}>
      {result?<><div className={s.notice} role="status"><CheckCircle2 size={20}/><strong className="block mt-2">{result.created} added · {result.skipped.length} skipped · {result.failed.length} not confirmed</strong><p className={s.muted}>Patient records are saved separately from campaign enrollment. No messages were sent.</p></div>{[...result.skipped,...result.failed].length>0&&<ul className={s.exclusions}>{[...result.skipped,...result.failed].sort((a,b)=>a.row-b.row).map(r=><li key={r.row}><strong>Row {r.row} · {r.name}</strong><br/>{r.reason}</li>)}</ul>}{!result.created&&<button className={s.button} onClick={()=>{setResult(null);setError("");}}>Back to edit</button>}</>:<>
      {mode==="manual"&&<form id="new-patient-form" onSubmit={e=>{e.preventDefault();void save();}} className="space-y-4">
        <div className={s.formGrid}>{([["name","Patient name","text"],["phone","Phone","tel"],["email","Email","email"],["lastVisit","Last visit date","date"],["lastTreatment","Last treatment","text"]] as const).map(([key,label,type])=><label className={s.label} key={key}>{label}{key==="name"?" *":""}<input className={s.input} type={type} value={manual[key]} disabled={busy} required={key==="name"} maxLength={key==="email"?254:200} onChange={e=>setManual(p=>({...p,[key]:e.target.value}))}/></label>)}<label className={s.label}>Patient status<select className={s.input} disabled={busy} value={manual.status} onChange={e=>setManual(p=>({...p,status:e.target.value}))}>{PATIENT_STATUSES.map(v=><option key={v}>{v}</option>)}</select></label></div>
        <p className={s.muted}>Provide a phone number or email. Leave the last visit blank if it is unknown.</p>
        <details><summary className="cursor-pointer text-sm font-semibold">Contact preferences</summary><div className="mt-3 space-y-2">{([["emailConsent","Email consent confirmed"],["optedOut","Opted out"],["doNotContact","Do not contact"],["futureBooking","Has a future booking"]] as const).map(([key,label])=><label key={key} className={s.toggle}><input type="checkbox" checked={manual[key]} disabled={busy} onChange={e=>setManual(p=>({...p,[key]:e.target.checked}))}/>{label}</label>)}<label className={s.label}>Consent source<input className={s.input} value={manual.consentSource} disabled={busy} placeholder="Where the patient's consent was recorded" onChange={e=>setManual(p=>({...p,consentSource:e.target.value}))}/></label></div></details>
      </form>}
      {mode==="leads"&&<><p className={s.muted}>Selected leads are copied into Patients. Their existing lead records stay unchanged. Unknown visit dates and consent are left unconfirmed.</p><label className={s.search}><Search size={16}/><input className={s.input} aria-label="Search leads to add" placeholder="Search name, phone, or email…" value={query} onChange={e=>setQuery(e.target.value)}/></label>{loading?<LoadingRegion label="Loading leads" className={s.leadList}><SkeletonRows rows={5}/></LoadingRegion>:!leads.length&&!error?<p className={s.muted}>No leads are available yet.</p>:!visible.length&&!error?<p className={s.muted}>No leads match this search.</p>:<><label className={s.toggle}><input type="checkbox" disabled={busy||!available.length} checked={available.length>0&&available.every(l=>leadIds.has(l.id))} onChange={e=>setLeadIds(old=>{const next=new Set(old);available.forEach(l=>e.target.checked?next.add(l.id):next.delete(l.id));return next;})}/>Select all available in this search · {leadIds.size} selected</label><div className={s.leadList}>{visible.map(l=><label key={l.id} className={s.leadChoice}><input type="checkbox" disabled={busy||l.alreadyPatient} checked={leadIds.has(l.id)} onChange={()=>setLeadIds(old=>{const next=new Set(old);if(next.has(l.id))next.delete(l.id);else next.add(l.id);return next;})}/><span><strong>{l.name}</strong><small>{l.email||l.phone||"No contact details"}{l.email&&l.phone?" · "+l.phone:""}</small></span><span className={s.badge+" "+s.neutral}>{l.alreadyPatient?"Already a patient":l.status||"Lead"}</span></label>)}</div>{leadIds.size>200&&<p role="alert">Choose up to 200 leads at a time.</p>}</>}</>}
      {mode==="csv"&&<>
        {busy?<div className={s.importProgress} role="status" aria-live="polite"><Loader2 size={22} className="animate-spin"/><div><strong>Importing patients · {formatCount(progress.done)} of {formatCount(progress.total)}</strong><span>Large lists take a minute or two. Keep this window open until the import finishes.</span></div><span className={s.progressTrack}><b style={{width:(progress.total?Math.max(4,progress.done/progress.total*100):4)+"%"}}/></span></div>
        :!file||(!csvRows.length&&!loading)?<>
          <input ref={fileInput} id="patient-csv" className={s.srOnly} type="file" accept=".csv,text/csv" disabled={loading} onChange={e=>parseFile(e.target.files?.[0])}/>
          <label htmlFor="patient-csv" className={s.upload+" "+(dragging?s.uploadActive:"")} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);parseFile(e.dataTransfer.files?.[0]);}}>
            <span className={s.uploadIcon}><UploadCloud size={22}/></span>
            <strong>Drop your patient CSV here</strong>
            <span>or <u>browse your computer</u> · up to {formatCount(MAX_IMPORT_ROWS)} rows, {formatBytes(MAX_IMPORT_BYTES)}</span>
          </label>
          <div className={s.csvHelp}><div><strong>Required columns</strong><span>Name, and Email or Phone</span></div><div><strong>Optional</strong><span>First Name, Last Visit Date (YYYY-MM-DD), Status, Source, Notes, Opted Out, Do Not Contact</span></div><button type="button" className={s.linkButton} onClick={template}><Download size={14}/>Download template</button></div>
        </>:<>
          <div className={s.fileCard}><span className={s.uploadIcon}><FileSpreadsheet size={20}/></span><div><strong title={file.name}>{file.name}</strong><span>{formatBytes(file.size)}{csvRows.length?" · "+formatCount(csvRows.length)+" rows":""}</span></div>{loading?<Skeleton className="h-10 w-24 rounded-xl"/>:<button type="button" className={s.button} onClick={()=>parseFile()}><RefreshCw size={14}/>Replace</button>}</div>
          {csvRows.length>0&&<>
            <div className={s.csvStats}><div><strong>{formatCount(validCount)}</strong><span>Ready to add</span></div><div className={invalidRows.length?s.statWarn:""}><strong>{formatCount(invalidRows.length)}</strong><span>Need fixing</span></div><div><strong>{formatCount(duplicateCount)}</strong><span>Duplicates in file</span></div></div>
            {invalidRows.length>0&&<div className={s.issueList}><p><AlertTriangle size={14}/>These rows will be skipped. Fix them in the file and re-upload if you want them included.</p><ul>{invalidRows.slice(0,50).map(r=><li key={r.row}><strong>Row {r.row} · {r.name}</strong><span>{r.errors.join("; ")}</span></li>)}</ul>{invalidRows.length>50&&<small>+ {formatCount(invalidRows.length-50)} more rows need fixing</small>}</div>}
            <div className={s.previewTable}><table><thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Source</th></tr></thead><tbody>{preview.filter(r=>r.patient&&!r.duplicate).slice(0,PREVIEW_ROWS).map(r=><tr key={r.row}><td>{r.row}</td><td>{r.patient?.name}</td><td>{r.patient?.email||r.patient?.phone}</td><td>{r.patient?.source||"Manual"}</td></tr>)}</tbody></table>{validCount>PREVIEW_ROWS&&<small>Showing {PREVIEW_ROWS} of {formatCount(validCount)} ready rows</small>}</div>
          </>}
        </>}
      </>}
      <p className={s.muted}>Duplicate records are skipped rather than overwritten. Adding patients does not enroll them or trigger messages.</p>
      </>}
      {error&&<div className={s.notice+" "+s.warning} role="alert">{error}{mode==="leads"&&!busy&&<button className={s.button+" mt-2"} onClick={fetchLeads}>Retry loading leads</button>}</div>}
    </PatientDialog>
  </section>;
}
