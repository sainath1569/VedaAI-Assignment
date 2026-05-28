"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export default function FloatingCreateButton() {
  return (
    <Link
      href="/create-assignment"
      className="fixed bottom-[116px] right-5 z-50 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white shadow-[0px_16px_48px_rgba(0,0,0,0.12),0px_32px_48px_rgba(0,0,0,0.2)] transition-transform active:scale-95 lg:hidden"
    >
      <Plus
        size={20}
        strokeWidth={3}
        className="text-[#FF5623]"
      />
    </Link>
  );
}