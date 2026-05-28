"use client";

import Image, { StaticImageData } from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutGrid, Settings } from "lucide-react";

import vedaLogo from "@/assets/veda-logo.png";
import schoolAvatar from "@/assets/school-avatar.png";

import groupsIcon from "@/assets/groups.png";
import assignmentsIcon from "@/assets/assignment-icon.png";
import toolkitIcon from "@/assets/ai-toolkit-icon.png";
import libraryIcon from "@/assets/my-library.png";
import sparkles from "@/assets/ai-toolkit.png";

import { useAssignmentsStore } from "@/store/assignmentsStore";

type MenuItem =
  | { title: string; type: "lucide"; icon: typeof LayoutGrid; route: string }
  | { title: string; type: "image"; icon: StaticImageData; route: string };

const menuItems: MenuItem[] = [
  { title: "Home", type: "lucide", icon: LayoutGrid, route: "/" },
  { title: "My Groups", type: "image", icon: groupsIcon, route: "#" },
  { title: "Assignments", type: "image", icon: assignmentsIcon, route: "/" },
  { title: "AI Teacher’s Toolkit", type: "image", icon: toolkitIcon, route: "#" },
  { title: "My Library", type: "image", icon: libraryIcon, route: "#" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { assignments } = useAssignmentsStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <aside className="flex h-[calc(100vh-24px)] max-h-[820px] w-[304px] shrink-0 flex-col justify-between rounded-[16px] bg-white p-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_32px_48px_rgba(0,0,0,0.2)]">
      <div className="flex w-[251px] flex-col items-center gap-[48px]">
        <div className="flex w-full items-center gap-[8px]">
          <Image src={vedaLogo} alt="VedaAI" width={136} height={40} priority />
        </div>

        <button
          onClick={() => router.push("/create-assignment")}
          className="flex h-[42px] w-[251px] items-center justify-center rounded-[100px] border-[4px] border-[#ef7658] bg-[#272727] shadow-[0_16px_48px_rgba(255,255,255,0.12),0_32px_48px_rgba(255,255,255,0.2),inset_0_-1px_3.5px_rgba(177,177,177,0.6),inset_0_0_34.5px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center justify-center gap-[10px]">
            <Image src={sparkles} alt="Sparkles" width={18} height={18} />

            <span className="font-sans text-[16px] font-medium leading-[28px] tracking-[-0.04em] text-white">
              Create Assignment
            </span>
          </div>
        </button>

        <nav className="flex w-[251px] flex-col items-start gap-[8px]">
          {menuItems.map((item) => {
            const isActive =
              item.title === "Assignments"
                ? pathname === "/" || pathname === "/create-assignment"
                : item.title === "Home"
                  ? pathname.startsWith("/question-paper")
                  : pathname === item.route && item.route !== "#";

            function handleClick() {
              if (item.title === "Home") {
                const latest = assignments[0];
                router.push(latest ? `/question-paper?id=${latest.id}` : "/");
                return;
              }

              if (item.route !== "#") {
                router.push(item.route);
              }
            }

            return (
              <button
                key={item.title}
                onClick={handleClick}
                className={`flex h-[40px] w-[254px] items-center justify-between rounded-[8px] px-[12px] py-[9px] transition ${
                  isActive
                    ? "bg-[#F0F0F0] text-[#303030]"
                    : "text-[rgba(94,94,94,0.8)] hover:bg-[#f5f5f5]"
                }`}
              >
                <div className="flex items-center gap-[8px]">
                  {item.type === "lucide" ? (
                    <item.icon size={20} />
                  ) : (
                    <Image
                      src={item.icon}
                      alt={item.title}
                      width={20}
                      height={20}
                      className={isActive ? "" : "opacity-70"}
                    />
                  )}

                  <span
                    className={`text-[16px] font-bricolage leading-[140%] tracking-[-0.04em] ${isActive
                      ? "font-medium text-[#303030]"
                      : "font-normal text-[rgba(94,94,94,0.8)]"
                      }`}
                  >
                    {item.title}
                  </span>
                </div>

                {item.title === "Assignments" && isMounted && (
                  <span className="flex h-[20px] min-w-[34px] items-center justify-center rounded-[48px] bg-[#FF5623] px-[10px] text-[14px] font-semibold leading-[140%] tracking-[-0.04em] text-white shadow-[inset_0_0_32.3px_rgba(255,161,10,0.25)]">
                    {assignments.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex w-[256px] flex-col items-start gap-[8px]">
        <button className="flex h-[38px] w-[256px] items-center gap-[8px] px-[12px] py-[8px] text-[rgba(94,94,94,0.8)]">
          <Settings size={20} />

          <span className="text-[16px] font-normal leading-[140%] tracking-[-0.04em]">
            Settings
          </span>
        </button>

        <div className="flex h-[80px] w-[256px] items-center gap-[8px] rounded-[16px] bg-[#F0F0F0] p-[12px]">
          <Image
            src={schoolAvatar}
            alt="School Avatar"
            width={59}
            height={56}
            className="rounded-full"
          />

          <div className="flex flex-col">
            <h3 className="w-[165px] truncate text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
              Delhi Public School
            </h3>

            <p className="w-[165px] truncate text-[14px] font-normal leading-[140%] tracking-[-0.04em] text-[#5E5E5E]">
              Bokaro Steel City
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}