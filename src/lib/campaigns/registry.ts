import type { CampaignDefinition, CampaignSlug } from "@/lib/types/campaigns";

export const CAMPAIGNS: CampaignDefinition[] = [
  {
    slug: "speed-to-lead",
    name: "Speed-to-Lead",
    description: "Immediate email and SMS response for new website leads.",
    type: "Automatic",
    status: "Active",
    channels: ["Email", "SMS"],
    icon: "Zap",
    accent: "#C9A84C",
    dataSources: ["Leads", "Message Log"],
    sequence: "Speed-to-Lead",
    capabilities: { addLeads: false, pauseControl: false, stepFunnel: false, leadsTab: true, messageHistory: true },
  },
  {
    slug: "14-day-nurture",
    name: "14-Day Nurture",
    description: "Multi-step follow-up for leads who have not booked or replied.",
    type: "Manual Enrollment",
    status: "Active",
    channels: ["Email", "SMS"],
    icon: "GitBranch",
    accent: "#4ECDC4",
    dataSources: ["Nurture Enrollments", "Leads", "Message Log"],
    sequence: "14-Day Nurture",
    capabilities: { addLeads: true, pauseControl: false, stepFunnel: true, leadsTab: true, messageHistory: true },
  },
];

export function getCampaign(slug: string): CampaignDefinition | undefined {
  return CAMPAIGNS.find((campaign) => campaign.slug === slug);
}

export function isCampaignSlug(value: string): value is CampaignSlug {
  return Boolean(getCampaign(value));
}
