import { Clock3, MapPin, Phone, Truck } from "lucide-react";

import StatusBadge from "./StatusBadge";

interface Props {
  id: string;
  customer: string;
  address: string;
  eta: string;
  status: string;
  priority: string;
  contact: string;
  location: string;
  lastUpdated: string;
}

const DeliveryCard = ({
  id,
  customer,
  address,
  eta,
  status,
  priority,
  contact,
  location,
  lastUpdated,
}: Props) => {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-5 hover:border-[#F97316]/60 transition-all duration-200 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#A1A1AA]">
            {id}
          </p>

          <h3 className="text-lg font-semibold text-white mt-2">{customer}</h3>
          <p className="text-sm text-[#A1A1AA] mt-2">{address}</p>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#2A2B30] bg-[#111214] p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#A1A1AA]">
            Priority
          </p>
          <p className="text-white font-semibold mt-2">{priority}</p>
        </div>

        <div className="rounded-xl border border-[#2A2B30] bg-[#111214] p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#A1A1AA]">
            ETA
          </p>
          <p className="text-white font-semibold mt-2">{eta}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm text-[#A1A1AA]">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#F97316]" />
          <span className="text-[#F4F4F5]">{location}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock3 size={16} className="text-[#F97316]" />
          <span className="text-[#F4F4F5]">Last updated: {lastUpdated}</span>
        </div>

        <div className="flex items-center gap-2">
          <Phone size={16} className="text-[#F97316]" />
          <span className="text-[#F4F4F5]">{contact}</span>
        </div>

        <div className="flex items-center gap-2">
          <Truck size={16} className="text-[#F97316]" />
          <span className="text-[#F4F4F5]">Live route sync enabled</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryCard;
