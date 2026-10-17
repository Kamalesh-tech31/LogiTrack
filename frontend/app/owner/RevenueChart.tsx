"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
  { month: "Apr", revenue: 4780 },
  { month: "May", revenue: 5890 },
  { month: "Jun", revenue: 6390 },
  { month: "Jul", revenue: 7490 },
];

export default function RevenueChart() {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Revenue Overview</h2>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#2A2B30" strokeDasharray="3 3" />

            <XAxis dataKey="month" stroke="#A1A1AA" />

            <YAxis stroke="#A1A1AA" />

            <Tooltip
              contentStyle={{
                backgroundColor: "#111214",
                border: "1px solid #F97316",
                borderRadius: "16px",
                color: "white",
              }}
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#F97316"
              strokeWidth={4}
              dot={{
                r: 5,
                fill: "#EA580C",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
