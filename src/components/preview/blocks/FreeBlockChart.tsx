"use client";

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { FreeChartElement } from "@/types/site";

interface Props {
  element: FreeChartElement;
  isEditing: boolean;
  onChange: (e: FreeChartElement) => void;
}

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];

export default function FreeBlockChart({ element, isEditing, onChange }: Props) {
  const { chartType, data, dataKeys, height, title } = element;

  function updateData(rowIdx: number, key: string, val: string) {
    const next = data.map((row, i) => {
      if (i !== rowIdx) return row;
      const numVal = parseFloat(val);
      return { ...row, [key]: isNaN(numVal) ? val : numVal };
    });
    onChange({ ...element, data: next });
  }

  function addRow() {
    const newRow: Record<string, string | number> & { name: string } = { name: `項目${data.length + 1}` };
    dataKeys.forEach((k) => { newRow[k.key] = 0; });
    onChange({ ...element, data: [...data, newRow as import("@/types/site").ChartRow] });
  }

  function removeRow(idx: number) {
    onChange({ ...element, data: data.filter((_, i) => i !== idx) });
  }

  function renderChart() {
    if (chartType === "bar") {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {dataKeys.length > 1 && <Legend />}
          {dataKeys.map((k) => (
            <Bar key={k.key} dataKey={k.key} fill={k.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      );
    }
    if (chartType === "line") {
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {dataKeys.length > 1 && <Legend />}
          {dataKeys.map((k) => (
            <Line key={k.key} type="monotone" dataKey={k.key} stroke={k.color} strokeWidth={2} dot={{ r: 4 }} />
          ))}
        </LineChart>
      );
    }
    if (chartType === "area") {
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {dataKeys.length > 1 && <Legend />}
          {dataKeys.map((k) => (
            <Area key={k.key} type="monotone" dataKey={k.key} stroke={k.color} fill={`${k.color}30`} strokeWidth={2} />
          ))}
        </AreaChart>
      );
    }
    if (chartType === "pie") {
      return (
        <PieChart>
          <Pie data={data} dataKey={dataKeys[0]?.key ?? "value"} nameKey="name" cx="50%" cy="50%" outerRadius={height / 3} label={({ name, percent }) => `${name ?? ""} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      );
    }
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {/* Chart title */}
      {title && <p className="text-sm font-semibold text-gray-600 text-center">{title}</p>}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() ?? <BarChart data={[]} />}
        </ResponsiveContainer>
      </div>

      {/* Data editor (edit mode only) */}
      {isEditing && (
        <details className="border border-gray-100 rounded-xl overflow-hidden">
          <summary className="px-4 py-2 text-xs font-semibold text-gray-500 cursor-pointer bg-gray-50 select-none hover:bg-gray-100">
            データを編集
          </summary>
          <div className="p-3 space-y-3">
            {/* Chart type + title */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={chartType}
                onChange={(e) => onChange({ ...element, chartType: e.target.value as FreeChartElement["chartType"] })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="bar">棒グラフ</option>
                <option value="line">折れ線</option>
                <option value="area">エリア</option>
                <option value="pie">円グラフ</option>
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => onChange({ ...element, title: e.target.value })}
                placeholder="グラフタイトル"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <select
                value={height}
                onChange={(e) => onChange({ ...element, height: Number(e.target.value) })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {[200, 300, 400, 500].map((h) => (
                  <option key={h} value={h}>{h}px</option>
                ))}
              </select>
            </div>

            {/* Data table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-500">ラベル</th>
                    {dataKeys.map((k) => (
                      <th key={k.key} className="border border-gray-200 px-2 py-1 text-left font-medium" style={{ color: k.color }}>
                        {k.label || k.key}
                      </th>
                    ))}
                    <th className="border border-gray-200 px-2 py-1 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, ri) => (
                    <tr key={ri}>
                      <td className="border border-gray-200 p-0">
                        <input
                          type="text" value={String(row.name)}
                          onChange={(e) => updateData(ri, "name", e.target.value)}
                          className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-indigo-50"
                        />
                      </td>
                      {dataKeys.map((k) => (
                        <td key={k.key} className="border border-gray-200 p-0">
                          <input
                            type="number" value={Number(row[k.key] ?? 0)}
                            onChange={(e) => updateData(ri, k.key, e.target.value)}
                            className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-indigo-50"
                          />
                        </td>
                      ))}
                      <td className="border border-gray-200 text-center">
                        <button onClick={() => removeRow(ri)} className="text-gray-400 hover:text-red-500 px-1">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addRow} className="text-xs text-indigo-600 font-medium hover:text-indigo-800">+ 行を追加</button>
          </div>
        </details>
      )}
    </div>
  );
}
