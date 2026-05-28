"use client";

import Image from "next/image";
import { Bell, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAssignmentsStore } from "@/store/assignmentsStore";

import vedaLogo from "@/assets/veda-mobile-logo.png";
import schoolAvatar from "@/assets/mobile-avatar.png";

export default function MobileHeader() {
  const router = useRouter();
  const { assignments } = useAssignmentsStore();

  const handleHomeClick = () => {
    const latest = assignments[0];
    router.push(latest ? `/question-paper?id=${latest.id}` : "/");
  };

  return (
    <div className="flex h-[81px] w-full items-center justify-center bg-white/[0.01] px-[20px] py-[18px]">
      <header className="flex h-[56px] w-full max-w-[373px] items-center justify-between rounded-[16px] bg-white pl-[12px] pr-[16px]">
        {/* Logo */}
        <button
          onClick={handleHomeClick}
          className="flex h-[28px] w-[99px] items-center gap-[8px]"
        >
          <Image
            src={vedaLogo}
            alt="VedaAI"
            width={99}
            height={28}
            priority
            className="object-contain"
          />
        </button>

        {/* Right Section */}
        <div className="flex h-[36px] w-[116px] items-center justify-end gap-[12px]">
          {/* Notification */}
          <button className="relative flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#F6F6F6]">
            <Bell size={24} strokeWidth={2} className="text-[#303030]" />

            <span className="absolute left-[27px] top-[1px] h-[8px] w-[8px] rounded-full bg-[#FF5623]" />
          </button>

          {/* Avatar */}
          <Image
            src={schoolAvatar}
            alt="User"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />

          {/* Menu */}
          <button className="flex h-[24px] w-[24px] items-center justify-center">
            <Menu size={24} strokeWidth={2} className="text-[#1D1B20]" />
          </button>
        </div>
      </header>
    </div>
  );
}