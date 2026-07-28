import EntityPage from "../../EntityPage";
export default async function Page({ params }: { params: Promise<{ adId: string }> }) { const { adId } = await params; return <EntityPage kind="ad" id={decodeURIComponent(adId)} />; }
