"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAssignmentsStore } from "@/store/assignmentsStore";

import homeIcon from "@/assets/home.png";
import assignmentsIcon from "@/assets/assignments.png";
import libraryIcon from "@/assets/library.png";
import toolkitIcon from "@/assets/ai-toolkit.png";

const items = [
  { label: "Home", icon: homeIcon, route: "/" },
  { label: "Assignments", icon: assignmentsIcon, route: "/" },
  { label: "Library", icon: libraryIcon, route: "#" },
  { label: "AI Toolkit", icon: toolkitIcon, route: "#" },
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { assignments } = useAssignmentsStore();

  const activeIndex = pathname.startsWith("/question-paper")
    ? 0
    : pathname === "/" || pathname === "/create-assignment"
      ? 1
      : -1;

  return (
    <div className="fixed bottom-0 left-0 z-40 h-[157px] w-full backdrop-blur-[2px]">
      <div className="absolute bottom-0 left-0 h-[57px] w-full bg-[#F0F0F0]/[0.05]" />

      <div className="absolute bottom-[11px] left-1/2 flex h-[146px] w-[373px] -translate-x-1/2 flex-col items-center gap-[13px] bg-[#F0F0F0]/[0.05]">
        <div className="flex h-[48px] w-[373px] items-center justify-end gap-[10px]">
          
        </div>

        <nav className="flex h-[72px] w-[373px] items-center justify-between rounded-[24px] bg-[#181818] px-[24px] py-[8px] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_32px_48px_rgba(0,0,0,0.2)]">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === "Home") {
                    const latest = assignments[0];
                    router.push(latest ? `/question-paper?id=${latest.id}` : "/");
                  } else if (item.route !== "#") {
                    router.push(item.route);
                  }
                }}
                className="flex h-[52px] w-[52px] flex-col items-center justify-center gap-[4px] rounded-[26px]"
              >
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={20}
                  height={20}
                  className={isActive ? "opacity-100" : "opacity-25"}
                />

                <span
                  className={`font-bricolage text-center text-[12px] font-semibold leading-[140%] tracking-[-0.04em] ${
                    isActive ? "text-white" : "text-white/25"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="h-0 w-[128px] rounded-full border-[5px] border-[#303030]/50" />
      </div>
    </div>
  );
}