"use client";

import Link from "next/link";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import ChartLine from "@/components/ui/ChartLine";
import ChartDonut from "@/components/ui/ChartDonut";
import { mockVisitsData, mockLeadSourceData, mockAIInsights } from "@/lib/mock-data";
import { Zap, Mail, RefreshCw, CalendarCheck, Share2 } from "lucide-react";

const automations = [
  { name: "Speed-to-Lead", status: "live" as const, icon: Zap },
  { name: "No-Book Nurture", status: "live" as const, icon: Mail },
  { name: "Dormant Reactivation", status: "pending" as const, icon: RefreshCw },
  { name: "Rebooking Engine", status: "live" as const, icon: CalendarCheck },
  { name: "Referral Engine", status: "paused" as const, icon: Share2 },
];

const chartData = mockVisitsData.slice(-30);
const topInsight = mockAIInsights[0];

export default function OverviewClient() {
  return (
    <div className="space-y-6">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Visits This Month"
          value={312}
          target={400}
          progress={78}
          trend={{ value: 12, positive: true }}
          color="teal"
        />
        <KPICard
          title="New Patients This Month"
          value={19}
          target={25}
          progress={76}
          trend={{ value: 5, positive: true }}
          color="green"
        />
        <KPICard
          title="Total Leads This Month"
          value={47}
          subtitle="Google: 20 · Form: 13 · Ref: 9 · Return: 5"
          color="teal"
        />
        <KPICard
          title="Avg Speed-to-Lead"
          value={52}
          suffix="sec"
          subtitle="Target: <60 seconds"
          trend={{ value: 8, positive: true }}
          color="green"
        />
        <KPICard
          title="Leads Converted to Booked"
          value="34%"
          subtitle="16 of 47 leads booked"
          trend={{ value: 3, positive: true }}
          color="teal"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lead Source Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1A1A2E]">
                Lead Source Breakdown
              </h2>
              <span className="text-xs text-[#6B7280]">Last 30 days</span>
            </div>
            <ChartDonut data={mockLeadSourceData} height={220} />
          </div>

          {/* Visits vs New Patients */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1A1A2E]">
                Visits vs New Patients
              </h2>
              <span className="text-xs text-[#6B7280]">Last 30 days</span>
            </div>
            <ChartLine
              data={chartData}
              xKey="date"
              lines={[
                { key: "visits", label: "Total Visits", color: "#0D2B45" },
                { key: "newPatients", label: "New Patients", color: "#1A6B6B" },
              ]}
              height={240}
            />
          </div>
        </div>

        {/* Right — 40% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Automation Status */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">
              Active Automations
            </h2>
            <div className="space-y-3">
              {automations.map(({ name, status, icon: Icon }) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#F5F7FA" }}
                    >
                      <Icon size={14} className="text-[#1A6B6B]" />
                    </div>
                    <span className="text-sm text-[#1A1A2E]">{name}</span>
                  </div>
                  <StatusBadge variant={status} />
                </div>
              ))}
            </div>
            <Link
              href="/settings"
              className="mt-4 block text-center text-xs text-[#1A6B6B] hover:underline"
            >
              Manage automations →
            </Link>
          </div>

          {/* AI Insight of the Day */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1A1A2E]">
                AI Insight of the Day
              </h2>
              <Link
                href="/ai-insights"
                className="text-xs text-[#1A6B6B] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="border-l-4 pl-4" style={{ borderColor: "#1A6B6B" }}>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge variant={topInsight.priority.toLowerCase() as "urgent"} />
                <span className="text-xs text-[#6B7280]">{topInsight.category}</span>
              </div>
              <p className="text-sm font-semibold text-[#1A1A2E] mb-1 leading-snug">
                {topInsight.title}
              </p>
              <p className="text-xs text-[#6B7280] italic leading-relaxed">
                {topInsight.body}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
