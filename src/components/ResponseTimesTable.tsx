"use client";
import React, { useEffect, useState } from "react";

function fmtHoursToDaysHours(hours: number, workdayLen = 8) {
  if (!hours || hours < 0) return "-";
  if (hours < workdayLen) return `${hours.toFixed(1)} hours`;
  const days = hours / workdayLen;
  return `${days.toFixed(1)} days`;
}

interface ResponseTimesTableProps {
  selectedEnvironment?: string;
}

export default function ResponseTimesTable({ selectedEnvironment = 'All Environments' }: ResponseTimesTableProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [weighted, setWeighted] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`🔍 Fetching response times data for environment: "${selectedEnvironment}"`);
        
        // Build URL with environment filter
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/reports/response-times`);
        if (selectedEnvironment && selectedEnvironment !== 'All Environments') {
          url.searchParams.append('environment', selectedEnvironment);
          console.log(`🌍 Adding environment filter: ${selectedEnvironment}`);
        } else {
          console.log(`🌎 No environment filter (showing all environments)`);
        }
        
        console.log(`📡 API URL: ${url.toString()}`);
        const response = await fetch(url.toString());
        console.log("📊 Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log("📋 Received data:", data);
        console.log(`📈 Rows count: ${data.rows?.length || 0}`);
        console.log(`🎯 Weighted data:`, data.weighted);
        
        setRows(data.rows || []);
        setWeighted(data.weighted || null);
        setError(null);
      } catch (error) {
        console.error("Error fetching response times:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEnvironment]);

  if (loading) return <div className="p-4 text-gray-500">Loading response times...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!rows.length || !weighted) return <div className="p-4 text-gray-500">No data available</div>;

  const headers = [
    "",
    ...rows.map(r => r.weekLabel),
    "Weighted Average",
  ];

  const makeRow = (label: string, accessor: (r: any) => number) => ([
    label,
    ...rows.map(r => fmtHoursToDaysHours(accessor(r))),
    fmtHoursToDaysHours(accessor(weighted)),
  ]);

  const data = [
    [
      "Lead Bugs Reported",
      ...rows.map(r => `${r.count} per week`),
      weighted.count,
    ],
    makeRow("Time to In Progress", (r) => r.timeToInProgressHoursAvg),
    makeRow("Time from In Progress to Done", (r) => r.timeInProgressToDoneHoursAvg),
    makeRow("Time from Reported to Referred", (r) => r.timeReportedToReferredHoursAvg),
    makeRow("Time from Referred to Done", (r) => r.timeReferredToDoneHoursAvg),
    makeRow("Time From Report to Resolution", (r) => r.timeReportToResolutionHoursAvg),
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <div className="relative">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th 
                    key={i} 
                    className={`border px-3 py-2 text-left bg-gray-50 ${
                      i === 0 ? 'sticky left-0 z-10 bg-gray-50' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, j) => (
                    <td 
                      key={j} 
                      className={`border px-3 py-2 ${
                        j === 0 ? 'sticky left-0 z-10 font-medium bg-inherit' : ''
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-600 italic">
        *Business days / hours (8-hour workday). Data starts from June 30, 2025 when response time tracking began.
      </p>
    </div>
  );
}