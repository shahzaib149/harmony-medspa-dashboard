import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignDetailClient from "./CampaignDetailClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
export default async function Page({params}:{params:Promise<{campaignSlug:string}>}){const {campaignSlug}=await params;await requirePageAuth({ next: `/campaigns/${campaignSlug}` });return <DashboardLayout title="Campaign"><CampaignDetailClient slug={campaignSlug}/></DashboardLayout>}
