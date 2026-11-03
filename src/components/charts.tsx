"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

interface ChartData {
  name: string;
  value: number;
}

interface TrendData {
  name: string;
  projects: number;
  revenue: number;
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `LKR ${value >= 1000 ? (value/1000) + 'k' : value}`}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ 
              backgroundColor: "rgba(15, 23, 42, 0.9)", 
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(251, 191, 36, 0.2)", 
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
            }}
            itemStyle={{ color: "#fbbf24", fontWeight: 600 }}
            formatter={((value: any) => [`LKR ${Number(value).toLocaleString()}`, "Revenue"]) as any}
          />
          <Bar dataKey="value" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: ChartData[] }) {
  const COLORS = ["#fbbf24", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={8}
            dataKey="value"
            animationDuration={1500}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(15, 23, 42, 0.9)", 
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
            }}
            itemStyle={{ color: "#ffffff" }}
            formatter={((value: any) => [value, "Projects"]) as any}
          />
          <Legend 
            verticalAlign="bottom" 
            iconType="circle" 
            wrapperStyle={{ paddingTop: "30px", fontSize: "12px" }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ data }: { data: TrendData[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            yAxisId="left"
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(15, 23, 42, 0.9)", 
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(251, 191, 36, 0.2)", 
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
            }}
            formatter={((value: any, name: any) => {
              if (name === "Revenue (LKR)") return [`LKR ${Number(value).toLocaleString()}`, name];
              return [value, name];
            }) as any}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="revenue" 
            stroke="#fbbf24" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#fbbf24", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name="Revenue (LKR)"
            animationDuration={2000}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="projects" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name="Projects"
            animationDuration={2000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
