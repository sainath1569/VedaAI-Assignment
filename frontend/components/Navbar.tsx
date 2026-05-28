"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Bell, ChevronDown, LayoutGrid } from "lucide-react";

import schoolAvatar from "@/assets/school-avatar.png";
import sparkles from "@/assets/sparkles.png";
import { useAssignmentsStore } from "@/store/assignmentsStore";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { assignments } = useAssignmentsStore();

  const handleHomeClick = () => {
    const latest = assignments[0];
    router.push(latest ? `/question-paper?id=${latest.id}` : "/");
  };

  return (
    <header className="flex h-[56px] w-full shrink-0 items-center gap-[10px] rounded-[16px] bg-white/75 px-[12px] pl-[24px]">
      {/* Left Section */}
      <div className="flex min-w-0 flex-1 items-center gap-[12px]">
        <button
          onClick={pathname === "/" ? handleHomeClick : () => router.back()}
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-white transition-all hover:bg-gray-50 active:scale-95"
        >
          <ArrowLeft size={24} className="text-[#303030]" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
          {pathname === "/create-assignment" ? (
            <span className="font-bricolage text-[16px] font-semibold leading-[19px] tracking-[-0.04em] text-[#A9A9A9]">
              Assignment
            </span>
          ) : pathname.startsWith("/question-paper") ? (
            <>
              <Image src={sparkles} alt="Create New" width={20} height={20} />
              <span className="font-bricolage text-[16px] font-semibold leading-[19px] tracking-[-0.04em] text-[#A9A9A9]">
                Create New
              </span>
            </>
          ) : (
            <>
              <LayoutGrid size={20} className="text-[#A9A9A9]" />
              <span className="font-bricolage text-[16px] font-semibold leading-[19px] tracking-[-0.04em] text-[#A9A9A9]">
                Assignment
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-[10px]">
        <button className="relative flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#F6F6F6]">
          <Bell size={24} className="text-[#303030]" />
          <span className="absolute right-[1px] top-[1px] h-[8px] w-[8px] rounded-full bg-[#FF5623]" />
        </button>

        <button className="flex h-[44px] w-[157px] items-center gap-[8px] rounded-[12px] px-[12px] py-[6px] drop-shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
          <Image
            src={schoolAvatar}
            alt="User Avatar"
            width={32}
            height={32}
            className="rounded-full"
          />

          <div className="flex items-center gap-[4px]">
            <span className="font-bricolage text-[16px] font-semibold leading-[19px] tracking-[-0.04em] text-[#303030]">
              John Doe
            </span>

            <ChevronDown size={24} className="text-[#303030]" />
          </div>
        </button>
      </div>
    </header>
  );
}