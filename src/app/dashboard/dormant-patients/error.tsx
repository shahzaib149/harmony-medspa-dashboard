"use client";
export default function ErrorPage({reset}:{reset:()=>void}) { return <div role="alert" className="p-8"><h2>Patient workspace unavailable</h2><p className="my-3">We couldn&apos;t load the patient workspace. Please try again.</p><button className="rounded-xl border px-4 py-3" onClick={reset}>Try again</button></div>; }
