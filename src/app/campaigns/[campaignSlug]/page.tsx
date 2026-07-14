import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignDetailClient from "./CampaignDetailClient";
export default async function Page({params}:{params:Promise<{campaignSlug:string}>}){const {campaignSlug}=await params;return <DashboardLayout title="Campaign"><CampaignDetailClient slug={campaignSlug}/></DashboardLayout>}
