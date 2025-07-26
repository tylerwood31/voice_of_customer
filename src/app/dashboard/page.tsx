"use client";
import React, { useEffect, useState } from "react";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css';
import DashboardCards from '@/components/DashboardCards';
import FilteredIssues from '@/components/FilteredIssues';
import AISummary from '@/components/AISummary';
import ProtectedLayout from '@/components/ProtectedLayout';

interface PulseData {
  summary: {
    total_feedback: number;
    high_priority_count: number;
    assignment_rate: number;
    top_environment: [string, number];
    top_system: [string, number];
    top_team: [string, number];
  };
  breakdowns: {
    environments: Breakdown[];
    systems_impacted: Breakdown[];
    teams: Breakdown[];
    priorities: Breakdown[];
  };
  recent_high_priority: RecentIssue[];
  all_feedback: RecentIssue[];
}

interface Breakdown {
  name: string;
  count: number;
}

interface RecentIssue {
  id: string;
  description: string;
  priority: string;
  environment: string;
  system: string;
  team: string;
  created: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('All Teams');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('All Environments');
  const [startDate, setStartDate] = useState<Date>(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize all filters from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitialized) {
      // Load saved filters
      const savedTeam = sessionStorage.getItem('dashboard-team-filter');
      const savedEnv = sessionStorage.getItem('dashboard-env-filter');
      const savedStart = sessionStorage.getItem('dashboard-start-date');
      const savedEnd = sessionStorage.getItem('dashboard-end-date');
      
      if (savedTeam) setSelectedTeam(savedTeam);
      if (savedEnv) setSelectedEnvironment(savedEnv);
      
      // Always default to 7 days ago (override any saved value)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      setStartDate(sevenDaysAgo);
      
      // Always default to today (override any saved value)  
      setEndDate(new Date());
      
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Save filter values to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('dashboard-team-filter', selectedTeam);
    }
  }, [selectedTeam, hasInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('dashboard-env-filter', selectedEnvironment);
    }
  }, [selectedEnvironment, hasInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('dashboard-start-date', startDate.toISOString());
    }
  }, [startDate, hasInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('dashboard-end-date', endDate.toISOString());
    }
  }, [endDate, hasInitialized]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer-pulse/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (loading) return <div className="p-8 text-gray-500">Loading customer pulse data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-gray-500">No data available</div>;

  const { summary, breakdowns, recent_high_priority, all_feedback } = data;

  // Get unique values for filters - sorted for consistency
  const teams = [...new Set(all_feedback.map(f => f.team || "Unassigned"))].sort();
  const environments = [...new Set(all_feedback.map(f => f.environment || "Unknown"))].sort();
  
  // Apply filters for the issues list
  const filteredData = all_feedback
    .filter(item => {
      const teamMatch = selectedTeam === "All Teams" || (item.team || "Unassigned") === selectedTeam;
      const envMatch = selectedEnvironment === "All Environments" || (item.environment || "Unknown") === selectedEnvironment;
      const itemDate = new Date(item.created);
      const dateMatch = itemDate >= startDate && itemDate <= endDate;
      return teamMatch && envMatch && dateMatch;
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()); // Sort descending by date

  // Debug logging
  console.log("Selected filters:", { selectedTeam, selectedEnvironment, startDate, endDate });
  console.log("Total data:", all_feedback.length, "Filtered data:", filteredData.length);

  // Helper for checking if within last days
  const isWithinLastDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  };


  return (
    <ProtectedLayout>
      <div className="p-8 space-y-8">
      {/* Title and Filters */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Customer Pulse</h1>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="All Teams">All Teams</option>
              {teams.map(team => <option key={team} value={team}>{team}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Environment:</label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="All Environments">All Environments</option>
              {environments.map(env => <option key={env} value={env}>{env}</option>)}
            </select>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 border p-2 rounded hover:bg-gray-50 text-sm"
            >
              <span className="font-medium text-gray-600">Date:</span>
              <span className="text-gray-900">
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDatePicker && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDatePicker(false)}
                />
                <div className="absolute top-full right-0 mt-2 z-50 bg-white border rounded-lg shadow-xl">
                  <div className="p-3">
                    <DateRange
                      ranges={[{ 
                        startDate, 
                        endDate, 
                        key: 'selection' 
                      }]}
                      onChange={(ranges: any) => {
                        setStartDate(ranges.selection.startDate);
                        setEndDate(ranges.selection.endDate);
                      }}
                      rangeColors={['#3b82f6']}
                      showDateDisplay={false}
                      moveRangeOnFirstSelection={false}
                      months={1}
                      direction="horizontal"
                      preventSnapRefocus={true}
                      calendarFocus="forwards"
                    />
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Cards Component */}
      <DashboardCards 
        allData={all_feedback}
        selectedTeam={selectedTeam}
        selectedEnvironment={selectedEnvironment}
        startDate={startDate}
        endDate={endDate}
      />

      {/* AI Summary Section */}
      <AISummary filteredData={filteredData} />

      {/* Filtered Issues Section */}
      <div>
        <h2 className="text-xl font-medium mb-4">
          Filtered Issues
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({filteredData.length} results)
          </span>
        </h2>
        <FilteredIssues 
          filteredData={filteredData}
          isWithinLastDays={isWithinLastDays}
          fromDashboard={true}
        />
      </div>
      </div>
    </ProtectedLayout>
  );
}