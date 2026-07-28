import EntityPage from "../../EntityPage";
export default async function Page({ params }: { params: Promise<{ criterionId: string }> }) { const { criterionId } = await params; return <EntityPage kind="keyword" id={decodeURIComponent(criterionId)} />; }
