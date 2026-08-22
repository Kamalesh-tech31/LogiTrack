import { CustomerSidebar } from "@/components/customer/sidebar";
import { CustomerHeader } from "@/components/customer/header";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#111214] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.10),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.06),transparent_30%)]" />

      {/* Sidebar */}
      <CustomerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <CustomerHeader />

        <main className="relative p-6">{children}</main>
      </div>
    </div>
  );
}
