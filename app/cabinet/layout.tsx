import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import CabinetNav from "./CabinetNav";

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <CabinetNav />
      <main className="flex-1 relative section-dots overflow-hidden">
        <div className="orb orb-teal w-[320px] h-[320px] -top-20 -right-20 opacity-30 pointer-events-none animate-float-slow" />
        <div className="orb orb-amber w-[180px] h-[180px] bottom-1/4 -left-16 opacity-25 pointer-events-none animate-float" />
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
