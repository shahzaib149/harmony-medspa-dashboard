"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import PatientDialog from "./PatientDialog";
import s from "./reactivation.module.css";
export default function DeletePatientButton({id,name,onDeleted}:{id:string;name:string;onDeleted:()=>void|Promise<void>}){
  const [open,setOpen]=useState(false),[confirmation,setConfirmation]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function remove(){
    if(busy||confirmation!=="DELETE")return;setBusy(true);setError("");
    try{
      const r=await fetch("/api/reactivation/patients/"+id,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({confirmation})});
      const b=await r.json();if(!r.ok)throw new Error(b.error||"Could not delete patient.");
      setOpen(false);await onDeleted();
    }catch(e){setError(e instanceof Error?e.message:"Could not confirm deletion. Refresh before retrying.");}finally{setBusy(false);}
  }
  return <><button className={s.button+" "+s.dangerButton} onClick={()=>{setConfirmation("");setError("");setOpen(true);}}><Trash2 size={14}/>Delete patient</button>
    <PatientDialog open={open} onClose={()=>{if(!busy)setOpen(false);}} title="Permanently delete patient?" eyebrow="Admin action" busy={busy} footer={<><button className={s.button} disabled={busy} onClick={()=>setOpen(false)}>Cancel</button><button className={s.button+" "+s.dangerButton} disabled={busy||confirmation!=="DELETE"} onClick={remove}>{busy?"Deleting…":"Permanently delete"}</button></>}>
      <p>This removes <strong>{name}</strong> from the Patients table. It cannot be undone in the CRM.</p>
      <div className={s.notice}>Scheduled reactivation sends will be cleared first. Enrollment and message history remain; the patient link will be removed. Any original lead stays unchanged. Messages already handed to a delivery provider cannot be recalled.</div>
      <label className={s.label}>Type DELETE to confirm<input className={s.input} value={confirmation} autoComplete="off" disabled={busy} onChange={e=>setConfirmation(e.target.value)}/></label>
      {error&&<p role="alert" className={s.notice+" "+s.warning}>{error}</p>}
    </PatientDialog></>;
}
