"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import Link from "next/link";

import emptyAssignment from "@/assets/empty-assignment.png";

export default function EmptyAssignments() {
  return (
    <div className="flex w-full flex-col items-center justify-center font-bricolage">
      <div
        className="
          flex
          w-full
          max-w-[486px]
          flex-col
          items-center
          justify-center
          gap-[32px]

          md:min-h-[678px]
          min-h-[657px]
        "
      >
        {/* TOP CONTENT */}
        <div
          className="
            flex
            w-full
            flex-col
            items-center

            md:gap-[12px]
            gap-[12px]
          "
        >
          {/* ILLUSTRATION */}
          <div
            className="
              relative

              md:h-[300px] md:w-[300px]
              h-[220px] w-[220px]
            "
          >
            <Image
              src={emptyAssignment}
              alt="No assignments"
              fill
              priority
              className="object-contain"
            />
          </div>

          {/* TEXT CONTENT */}
          <div
            className="
              flex
              w-full
              flex-col
              items-center
              justify-center

              md:gap-[2px]
              gap-[12px]
            "
          >
            <h2
              className="
                font-bricolage
                text-center
                font-bold
                tracking-[-0.04em]
                text-[#303030]

                md:text-[20px]
                text-[20px]

                leading-[140%]
              "
            >
              No assignments yet
            </h2>

            <p
              className="
                w-full
                text-center
                font-bricolage
                font-normal
                tracking-[-0.04em]
                text-[rgba(94,94,94,0.8)]

                md:max-w-[486px]
                max-w-[373px]

                md:text-[16px]
                text-[16px]

                leading-[140%]
              "
            >
              Create your first assignment to start collecting and grading
              student submissions. You can set up rubrics, define marking
              criteria, and let AI assist with grading.
            </p>
          </div>
        </div>

        {/* BUTTON */}
        <Link
          href="/create-assignment"
          className="
            flex
            h-[46px]
            w-[277px]
            items-center
            justify-center
            gap-[4px]
            rounded-[48px]
            bg-[#181818]
            px-[24px]
            py-[12px]
            transition-all
            hover:scale-[1.02]
            active:scale-[0.98]
          "
        >
          <Plus size={20} strokeWidth={2.5} className="text-white" />

          <span
            className="
              font-bricolage
              text-[16px]
              font-medium
              leading-[140%]
              tracking-[-0.04em]
              text-white
            "
          >
            Create Your First Assignment
          </span>
        </Link>
      </div>
    </div>
  );
}