"use client";

import { useEffect, useState } from "react";

export function CustomerHeader() {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <div className="w-full bg-[#111111] border-b border-neutral-900 px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Welcome back, {userName}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex min-w-0 items-center gap-3 bg-[#0B0B0B] border border-neutral-800 px-4 py-2 rounded-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7F1D1D] text-sm font-bold text-white">
            {userName[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 overflow-hidden">
            <h3 className="truncate text-sm font-medium text-white">
              {userName}
            </h3>
            <p className="truncate text-xs text-neutral-500">Customer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
