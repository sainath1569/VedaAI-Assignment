"use client";

import { usePathname } from "next/navigation";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingCreateButton from "@/components/FloatingCreateButton";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  const hideFloatingButton =
    pathname === "/create-assignment" || pathname === "/question-paper";

  const hideBottomNavigation = pathname === "/question-paper";

  return (
    <div className="min-h-screen bg-[#d3d3d3] lg:bg-[#efefef]">
      {/* Desktop */}
      <div className="hidden h-screen gap-4 overflow-hidden p-4 lg:flex">
        <div className="h-[calc(100vh-32px)] shrink-0">
          <Sidebar />
        </div>

        <main className="flex h-[calc(100vh-32px)] flex-1 flex-col gap-4 overflow-hidden">
          <Navbar />

          <section className="relative flex-1 overflow-y-auto bg-transparent">
            {children}
          </section>
        </main>
      </div>

      {/* Mobile */}
      <div className="flex min-h-screen flex-col bg-[#d3d3d3] lg:hidden">
        <MobileHeader />

        <main className="flex-1 px-4 pt-6">{children}</main>

        {!hideFloatingButton && <FloatingCreateButton />}

        {!hideBottomNavigation && <BottomNavigation />}
      </div>
    </div>
  );
}