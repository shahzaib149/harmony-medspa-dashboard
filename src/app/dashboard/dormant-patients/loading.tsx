import DashboardLayout from "@/components/layout/DashboardLayout";
import s from "@/components/reactivation/reactivation.module.css";

export default function Loading() {
  return (
    <DashboardLayout title="Dormant patients" subtitle="Reconnect thoughtfully. Review, enroll, and follow each patient's return.">
      <div className={s.workspace} role="status" aria-live="polite">
        <span className={s.srOnly}>Loading patient directory</span>
        <div className={s.hero}>
          <div className={s.heroCopy}><div className="grid gap-4"><span className={s.skeleton} style={{ width: 140, height: 10 }} /><span className={s.skeleton} style={{ width: "min(420px,90%)", height: 34 }} /><span className={s.skeleton} style={{ width: "min(360px,80%)", height: 12 }} /></div></div>
          <div className={s.heroStats}>{[0, 1, 2, 3].map((i) => <div key={i} className={s.stat}><span className={s.skeleton} style={{ width: 54, height: 26 }} /><span className={s.skeleton} style={{ width: 100, height: 10, marginTop: 10 }} /></div>)}</div>
        </div>
        <div className={s.panel}>
          <div className={s.toolbar}><span className={s.skeleton} style={{ width: 160, height: 14 }} /><span className={s.skeleton} style={{ width: 230, height: 42 }} /></div>
          <div className="grid gap-0">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="flex items-center gap-4 border-t px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}><span className={s.skeleton} style={{ width: 34, height: 34, borderRadius: 11 }} /><span className={s.skeleton} style={{ width: "22%", height: 12 }} /><span className={s.skeleton} style={{ width: "26%", height: 12 }} /><span className={s.skeleton} style={{ width: "12%", height: 12 }} /></div>)}</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
