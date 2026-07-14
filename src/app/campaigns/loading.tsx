export default function Loading() { return <div className="grid gap-4 p-6 md:grid-cols-2">{[1,2,3,4].map((item)=><div key={item} className="h-40 animate-pulse rounded-2xl bg-white/5" />)}</div>; }
