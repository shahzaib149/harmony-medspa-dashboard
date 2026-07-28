import EntityPage from "../../EntityPage";
export default async function Page({ params }: { params: Promise<{ campaignId: string }> }) { const { campaignId } = await params; return <EntityPage kind="campaign" id={decodeURIComponent(campaignId)} />; }
