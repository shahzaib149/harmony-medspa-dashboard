"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import s from "./reactivation.module.css";
export default function PatientDialog({open,onClose,title,eyebrow,drawer=false,children,footer,busy=false}:{open:boolean;onClose:()=>void;title:string;eyebrow:string;drawer?:boolean;children:ReactNode;footer?:ReactNode;busy?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current; if(!d)return; if(open&&!d.open)d.showModal(); if(!open&&d.open)d.close();},[open]);
  useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=old;};},[open]);
  return <dialog ref={ref} className={s.dialog+" "+(drawer?s.drawer:"")} aria-label={title} onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
    <header className={s.dialogHeader}><div><span className={s.eyebrow}>{eyebrow}</span><h2>{title}</h2></div><button className={s.button} aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={17}/></button></header>
    <div className={s.dialogBody}>{children}</div>{footer&&<footer className={s.dialogFooter}>{footer}</footer>}
  </dialog>;
}
