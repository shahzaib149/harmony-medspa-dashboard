import EntityPage from "../../EntityPage";
export default async function Page({ params }: { params: Promise<{ adGroupId: string }> }) { const { adGroupId } = await params; return <EntityPage kind="ad-group" id={decodeURIComponent(adGroupId)} />; }
