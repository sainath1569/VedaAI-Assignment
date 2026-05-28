"use client";

import {
  MoreVertical,
  Search,
  Filter,
  Check,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAssignmentsStore } from "@/store/assignmentsStore";
import EmptyAssignments from "@/components/EmptyAssignments";

type FilterOption = "Most Recent" | "Oldest First" | "Due Soon" | "Overdue";

const FILTER_OPTIONS: FilterOption[] = [
  "Most Recent",
  "Oldest First",
  "Due Soon",
  "Overdue",
];

function parseDate(dateStr?: string): Date {
  if (!dateStr) return new Date(0);

  const parts = dateStr.split("-");
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
    }
    if (parts[0].length === 4) {
      return new Date(`${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`);
    }
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

export default function AssignmentsList() {
  const router = useRouter();
  const { assignments, deleteAssignment } = useAssignmentsStore();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const handleHomeClick = () => {
    const latest = assignments[0];
    router.push(latest ? `/question-paper?id=${latest.id}` : "/");
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenu(null);
      }

      if (filterRef.current && !filterRef.current.contains(target)) {
        setShowFilterMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center font-bricolage text-[16px] font-medium text-[#5E5E5E]">
        Loading assignments...
      </div>
    );
  }

  if (assignments.length === 0) {
    return <EmptyAssignments />;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const searched = assignments.filter((assignment) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      assignment.title.toLowerCase().includes(query) ||
      (assignment.subjectName && assignment.subjectName.toLowerCase().includes(query)) ||
      (assignment.className && assignment.className.toLowerCase().includes(query)) ||
      assignment.questionTypes.some((type) => type.title.toLowerCase().includes(query))
    );
  });

  const filteredAssignments = searched
    .filter((assignment) => {
      const dueDate = parseDate(assignment.due);
      if (activeFilter === "Overdue") {
        return dueDate < today;
      }
      if (activeFilter === "Due Soon") {
        return dueDate >= today;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === "Most Recent") {
        return parseDate(b.assigned).getTime() - parseDate(a.assigned).getTime();
      }

      if (activeFilter === "Oldest First") {
        return parseDate(a.assigned).getTime() - parseDate(b.assigned).getTime();
      }

      if (activeFilter === "Due Soon") {
        return parseDate(a.due).getTime() - parseDate(b.due).getTime();
      }

      return 0;
    });

  return (
    <div className="relative mx-auto h-[calc(100vh-90px)] w-full max-w-[1100px] overflow-y-auto overflow-x-hidden pb-[170px] font-bricolage [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="hidden lg:block">
        <div className="mb-[12px] flex h-[50px] w-full items-center gap-[12px] px-[8px]">
<div className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#CFEED8]">
  <div className="h-[12px] w-[12px] rounded-full bg-[#4BC26D]" />
</div>
          <div className="flex h-[50px] flex-col justify-center gap-[2px]">
            <h1 className="font-bricolage text-[20px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
              Assignments
            </h1>
            <p className="font-bricolage text-[14px] font-normal leading-[140%] tracking-[-0.04em] text-[rgba(94,94,94,0.55)]">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>

        <div className="mb-[16px] flex h-[64px] w-full items-center justify-between rounded-[20px] bg-white px-[16px]">
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu((value) => !value)}
              className="flex h-[20px] items-center gap-[4px]"
            >
              <Filter size={20} className="text-[#A9A9A9]" />
              <span className="font-bricolage text-[14px] font-bold leading-[140%] tracking-[-0.04em] text-[#A9A9A9]">
                {activeFilter ?? "Filter By"}
              </span>
            </button>

            {showFilterMenu && (
              <FilterMenu
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                setShowFilterMenu={setShowFilterMenu}
              />
            )}
          </div>

          <div className="flex h-[44px] w-[380px] items-center gap-[10px] rounded-full border border-black/20 px-[16px] py-[11px]">
            <Search size={20} className="shrink-0 text-[#A9A9A9]" />
            <input
              type="text"
              placeholder="Search Assignment"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent font-bricolage text-[14px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030] caret-black outline-none placeholder:text-[#A9A9A9]"
            />
          </div>
        </div>
      </div>

      <div className="mb-[24px] flex flex-col items-center gap-[24px] lg:hidden">
        <div className="relative flex h-[48px] w-full max-w-[373px] items-center justify-center">
          <button
            type="button"
            onClick={handleHomeClick}
            className="absolute left-0 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white/25 backdrop-blur-[12px]"
          >
            <ArrowLeft size={24} strokeWidth={2.5} className="text-[#303030]" />
          </button>

          <h1 className="text-center font-bricolage text-[16px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030]">
            Assignments
          </h1>
        </div>

        <div className="flex h-[64px] w-full max-w-[373px] items-center justify-between rounded-[16px] bg-white px-[16px]">
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu((value) => !value)}
              className="flex h-[20px] items-center gap-[4px]"
            >
              <Filter size={20} className="text-[#A9A9A9]" />
              <span className="font-bricolage text-[14px] font-normal leading-[140%] tracking-[-0.04em] text-[#A9A9A9]">
                {activeFilter ?? "Filter"}
              </span>
            </button>

            {showFilterMenu && (
              <FilterMenu
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                setShowFilterMenu={setShowFilterMenu}
                mobile
              />
            )}
          </div>

          <div className="flex h-[44px] w-[228px] items-center gap-[10px] rounded-full border border-black/20 px-[16px] py-[11px]">
            <Search size={20} className="shrink-0 text-[#A9A9A9]" />
            <input
              type="text"
              placeholder="Search Name"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent font-bricolage text-[14px] font-normal leading-[140%] tracking-[-0.04em] text-[#303030] caret-black outline-none placeholder:text-[#A9A9A9]"
            />
          </div>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="flex h-[150px] items-center justify-center rounded-[24px] bg-white/75 font-bricolage text-[16px] font-medium text-[rgba(94,94,94,0.8)]">
          No assignments match your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-2 lg:gap-x-[16px] lg:gap-y-[12px]">
          {filteredAssignments.map((assignment, index) => (
            <div
              key={assignment.id || index}
              className="relative h-[116px] rounded-[24px] bg-white/75 px-[20px] py-[20px] lg:h-[162px] lg:bg-white lg:px-[24px] lg:py-[24px]"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenu(openMenu === assignment.id ? null : assignment.id);
                }}
                className="absolute right-[20px] top-[20px] z-40 flex h-[24px] w-[24px] items-center justify-center text-black lg:right-[24px] lg:top-[24px] lg:text-[#A9A9A9]"
              >
                <MoreVertical size={24} />
              </button>

              {openMenu === assignment.id && (
                <div
                  ref={menuRef}
                  className="absolute right-[20px] top-[52px] z-50 flex h-[84px] w-[140px] flex-col items-center justify-center gap-[4px] rounded-[16px] bg-white p-[8px] shadow-[0_16px_48px_rgba(0,0,0,0.2),0_32px_48px_rgba(0,0,0,0.05)] lg:right-[56px] lg:top-[54px]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      router.push(`/question-paper?id=${assignment.id}`);
                    }}
                    className="flex h-[32px] w-[124px] items-center rounded-[8px] px-[8px] text-left font-bricolage text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#303030] hover:bg-[#F6F6F6]"
                  >
                    View Assignment
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      deleteAssignment(assignment.id);
                    }}
                    className="flex h-[32px] w-[124px] items-center rounded-[8px] bg-[#F6F6F6] px-[8px] text-left font-bricolage text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#C53535]"
                  >
                    Delete
                  </button>
                </div>
              )}

              <div className="flex h-full flex-col justify-between">
                <h2
                  onClick={() => router.push(`/question-paper?id=${assignment.id}`)}
                  className="max-w-[260px] cursor-pointer truncate pr-[34px] font-bricolage text-[18px] font-bold leading-[140%] tracking-[-0.04em] text-[#303030] lg:max-w-[418px] lg:text-[24px] lg:font-extrabold lg:leading-[120%]"
                >
                  {assignment.title}
                </h2>

                <div className="flex flex-col gap-[8px] lg:flex-row lg:items-center lg:justify-between">
                  <p className="font-bricolage text-[16px] font-extrabold leading-[120%] tracking-[-0.04em] text-[#303030]">
                    Assigned on :{" "}
                    <span className="text-[#A9A9A9]">{assignment.assigned}</span>
                  </p>

                  <p className="font-bricolage text-[16px] font-extrabold leading-[120%] tracking-[-0.04em] text-[#303030]">
                    Due : <span className="text-[#A9A9A9]">{assignment.due}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

   <div className="pointer-events-none fixed bottom-0 left-[327px] right-[24px] z-30 hidden h-[92px] bg-gradient-to-t from-[#efefef] via-[#efefef]/85 to-transparent lg:block" />

<div className="fixed bottom-[18px] left-[calc(327px+((100vw-351px)/2))] z-40 hidden -translate-x-1/2 lg:block">
        <button
          onClick={() => router.push("/create-assignment")}
          className="flex h-[46px] w-[277px] items-center justify-center gap-[4px] rounded-[48px] bg-[#181818] px-[24px] py-[12px] text-white shadow-[0_16px_48px_rgba(0,0,0,0.12),0_32px_48px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={2.5} className="text-white" />

          <span className="text-[16px] font-medium leading-[140%] tracking-[-0.04em]">
            Create Assignment
          </span>
        </button>
      </div>
    </div>
  );
}

function FilterMenu({
  activeFilter,
  setActiveFilter,
  setShowFilterMenu,
  mobile = false,
}: {
  activeFilter: FilterOption | null;
  setActiveFilter: (filter: FilterOption | null) => void;
  setShowFilterMenu: (show: boolean) => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={`absolute left-0 top-[calc(100%+10px)] z-50 rounded-[16px] border border-gray-100 bg-white p-[8px] shadow-[0_16px_48px_rgba(0,0,0,0.2),0_32px_48px_rgba(0,0,0,0.05)] ${
        mobile ? "w-[170px]" : "w-[180px]"
      }`}
    >
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => {
            setActiveFilter(option);
            setShowFilterMenu(false);
          }}
          className={`flex h-[32px] w-full items-center justify-between rounded-[8px] px-[8px] text-left font-bricolage text-[14px] font-medium leading-[140%] tracking-[-0.04em] ${option === activeFilter ? 'bg-[#4BC26D] text-white' : 'bg-transparent text-[#303030] hover:bg-[#F6F6F6]'} `}
        >
          {option}
          {activeFilter === option && <Check size={14} className="text-[#4BC26D]" />}
        </button>
      ))}

      {activeFilter && (
        <button
          type="button"
          onClick={() => {
            setActiveFilter(null);
            setShowFilterMenu(false);
          }}
          className="mt-[4px] flex h-[32px] w-full items-center rounded-[8px] bg-[#F6F6F6] px-[8px] text-left font-bricolage text-[14px] font-medium leading-[140%] tracking-[-0.04em] text-[#C53535]"
        >
          Clear Filter
        </button>
      )}
    </div>
  );
}