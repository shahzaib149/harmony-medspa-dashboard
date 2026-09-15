import DashboardLayout from "@/components/layout/DashboardLayout";
import s from "@/components/reactivation/reactivation.module.css";

export default function Loading() {
  return (
    <DashboardLayout title="Patient reactivation" subtitle="Enrollment, scheduled follow-up and delivery history.">
      <div className={s.workspace} role="status" aria-live="polite">
        <span className={s.srOnly}>Loading reactivation campaign</span>
        <div className={s.campaignTop}><span className={s.skeleton} style={{ width: 120, height: 16 }} /><span className={s.skeleton} style={{ width: 210, height: 42 }} /></div>
        <div className={s.campaignHero}>
          <span className={s.skeleton} style={{ width: 34, height: 34, borderRadius: 11 }} />
          <div className="grid flex-1 gap-3"><span className={s.skeleton} style={{ width: 170, height: 10 }} /><span className={s.skeleton} style={{ width: "min(360px,80%)", height: 28 }} /><span className={s.skeleton} style={{ width: "min(620px,95%)", height: 12 }} /></div>
        </div>
        <div className={s.kpis}>{[0, 1, 2, 3].map((i) => <div key={i} className={s.kpi}><span className={s.skeleton} style={{ width: 80, height: 10 }} /><span className={s.skeleton} style={{ width: 56, height: 28, margin: "14px 0 10px" }} /><span className={s.skeleton} style={{ width: 110, height: 10 }} /></div>)}</div>
        <div className={s.campaignGrid}>{[0, 1].map((i) => <div key={i} className={s.panel}><div className={s.toolbar}><span className={s.skeleton} style={{ width: 150, height: 14 }} /></div><div className="grid gap-5 p-6">{[0, 1, 2].map((j) => <div key={j} className="flex items-center gap-4"><span className={s.skeleton} style={{ width: 34, height: 34, borderRadius: 11 }} /><div className="grid flex-1 gap-2"><span className={s.skeleton} style={{ width: "40%", height: 12 }} /><span className={s.skeleton} style={{ width: "25%", height: 10 }} /></div></div>)}</div></div>)}</div>
      </div>
    </DashboardLayout>
  );
}
