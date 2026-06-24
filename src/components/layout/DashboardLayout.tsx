import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px] min-h-screen bg-[#F5F7FA]">
        {/* Page header */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A2E]">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {/* Page content */}
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
