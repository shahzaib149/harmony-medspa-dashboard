import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignsClient from "./CampaignsClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
export default async function CampaignsPage() { await requirePageAuth({ next: "/campaigns" }); return <DashboardLayout title="Campaigns" subtitle="Manage automated lead follow-up, performance, and enrollment."><CampaignsClient /></DashboardLayout>; }
