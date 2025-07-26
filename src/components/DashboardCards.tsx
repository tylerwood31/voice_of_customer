import React from 'react';

interface DashboardCardsProps {
  allData: any[];
  selectedTeam: string;
  selectedEnvironment: string;
  startDate: Date;
  endDate: Date;
}

// Helper to count by key
const countBy = (data: any[], key: string) => {
  return data.reduce((acc: any, item) => {
    const value = item[key] || "Unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
};

// Helper to check recent days
const isWithinLastDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
};

const DashboardCards: React.FC<DashboardCardsProps> = ({ 
  allData, 
  selectedTeam, 
  selectedEnvironment, 
  startDate, 
  endDate 
}) => {
  // === Apply all filters ===
  const filteredData = allData
    .filter(item => {
      const teamMatch = selectedTeam === "All Teams" || (item.team || "Unassigned") === selectedTeam;
      const envMatch = selectedEnvironment === "All Environments" || (item.environment || "Unknown") === selectedEnvironment;
      const itemDate = new Date(item.created);
      const dateMatch = itemDate >= startDate && itemDate <= endDate;
      return teamMatch && envMatch && dateMatch;
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()); // Sort descending by date

  // === Metrics ===
  const totalFeedback = filteredData.length;          // total WITH filters applied
  const thisWeek = filteredData.filter(item => isWithinLastDays(item.created, 7)).length;
  const last7Days = filteredData.filter(item => isWithinLastDays(item.created, 7)).length;
  const last30Days = filteredData.filter(item => isWithinLastDays(item.created, 30)).length;

  const assignedCount = filteredData.filter(item => item.team && item.team !== "Unassigned").length;
  const assignmentRate = totalFeedback > 0 
    ? Math.round((assignedCount / totalFeedback) * 100)
    : 0;

  // === Breakdowns ===
  const environmentCounts = countBy(filteredData, "environment");
  const systemCounts = countBy(filteredData, "system");
  const teamCounts = countBy(filteredData, "team");

  const topEnvironment = Object.entries(environmentCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0] || ["N/A", 0];
  const topSystem = Object.entries(systemCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0] || ["N/A", 0];
  const topTeam = Object.entries(teamCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0] || ["N/A", 0];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Total Feedback" value={totalFeedback} />
        <SummaryCard title="This Week" value={thisWeek} />
        <SummaryCard title="Assignment Rate" value={`${assignmentRate}%`} />
      </div>

      {/* Time Period Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Last 7 Days" value={last7Days} />
        <SummaryCard title="Last 30 Days" value={last30Days} />
        <SummaryCard title="Assigned" value={assignedCount} />
      </div>

      {/* Top Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Top Environment" 
          value={`${topEnvironment[0]} (${topEnvironment[1]})`} 
        />
        <SummaryCard 
          title="Top System" 
          value={`${topSystem[0]} (${topSystem[1]})`} 
        />
        <SummaryCard 
          title="Top Team" 
          value={`${topTeam[0]} (${topTeam[1]})`} 
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BreakdownList 
          title="Environments" 
          items={Object.entries(environmentCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))} 
        />
        <BreakdownList 
          title="Systems Impacted" 
          items={Object.entries(systemCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))} 
        />
        <BreakdownList 
          title="Teams" 
          items={Object.entries(teamCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))} 
        />
      </div>
    </div>
  );
};

// Summary Card Component
function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

// Breakdown List Component
function BreakdownList({ title, items }: { title: string; items: { name: string; count: any }[] }) {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-sm text-gray-500 mb-2">{title}</h3>
      <ul className="space-y-1 text-gray-700">
        {items.map((item) => (
          <li key={item.name} className="flex justify-between">
            <span>{item.name}</span>
            <span>{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardCards;