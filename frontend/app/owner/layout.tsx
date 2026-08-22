import Sidebar from "@/components/owner/Sidebar";
import Topbar from "@/components/owner/Topbar";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#111214] text-[#F4F4F5] font-sans selection:bg-[#F97316]/30">
      {/* Subtle Ambient Orange Glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[350px] bg-[#F97316]/8 rounded-full blur-[140px] z-0" />
      <div className="pointer-events-none absolute bottom-0 left-64 w-[500px] h-[300px] bg-[#FDBA74]/5 rounded-full blur-[120px] z-0" />

      {/* Fixed Stationary Sidebar */}
      <Sidebar />

      {/* Main Content Area (Independent Scroll Container) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative z-10">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
