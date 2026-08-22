"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOwnerDeliveryAgent } from "@/lib/api";

export default function AddAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !contact.trim()) {
      setError("Please provide both agent name and contact information.");
      return;
    }

    try {
      await createOwnerDeliveryAgent({
        name: name.trim(),
        contact: contact.trim(),
        vehicle: vehicle.trim(),
        isAvailable: status === "Active",
      });

      router.push("/owner/delivery");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong while adding the agent.");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Add Agent</h1>

      <div className="space-y-4 max-w-md">
        {error && <p className="text-red-400">{error}</p>}

        <input
          type="text"
          placeholder="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />

        <input
          type="text"
          placeholder="Contact email or phone"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />

        <input
          type="text"
          placeholder="Vehicle details (optional)"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />

        <label className="sr-only" htmlFor="agent-status">
          Agent status
        </label>
        <select
          id="agent-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        >
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
        </select>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] rounded-2xl text-white font-medium transition cursor-pointer shadow-[0_0_12px_rgba(249,115,22,0.3)]"
          >
            Save
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-[#1A1B1E] hover:bg-[#2A2B30] border border-[#2A2B30] rounded-2xl text-[#A1A1AA] hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
