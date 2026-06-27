import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="flex h-full min-h-screen" style={{ backgroundColor: "#0A0A0D" }}>
      <Sidebar />
      <main className="flex-1 ml-[240px] min-h-screen" style={{ backgroundColor: "#0A0A0D" }}>
        <header
          className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between"
          style={{
            backgroundColor: "#0D0D12",
            borderBottom: "1px solid rgba(201,168,76,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "#F0ECE4" }}>{title}</h1>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: "#7A7A8A" }}>{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
