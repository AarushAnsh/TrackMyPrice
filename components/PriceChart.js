"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getPriceHistory } from "@/app/actions";
import { Loader2 } from "lucide-react";

export default function PriceChart({ productId, currency = "USD" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const history = await getPriceHistory(productId);

      const chartData = history.map((item) => {
        const timestamp = item.checked_at || item.created_at;
        const parsedDate = new Date(timestamp);
        return {
          date: parsedDate.toLocaleString(undefined, {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: parseFloat(item.price),
        };
      });

      setData(chartData);
      setLoading(false);
    }

    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading chart…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-6 text-center text-sm text-muted-foreground">
        No price history yet. Check back after the next price update.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h4 className="mb-3 text-sm font-semibold text-foreground">
        Price History
      </h4>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              stroke="currentColor"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              stroke="currentColor"
              width={60}
            />
            <Tooltip
              formatter={(value) => [
                new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency,
                }).format(value),
                "Price",
              ]}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ fill: "var(--primary)", r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
