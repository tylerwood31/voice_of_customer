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
  total_feedback: number;
  priority_distribution: { [key: string]: number };
  environment_distribution: { [key: string]: number };
  status_distribution: { [key: string]: number };
  monthly_trends: {
    data: [string, number][];
    trend_percentage: number;
    trend_direction: string;
  };
  high_priority_issues: RecentIssue[];
  last_updated: string;
}

interface Breakdown {
  name: string;
  count: number;
}

interface RecentIssue {
  id: string;
  description: string;
  environment: string;
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

  const { total_feedback, priority_distribution, environment_distribution, status_distribution, high_priority_issues } = data;

  // Get unique values for filters from the distributions
  const environments = Object.keys(environment_distribution).sort();
  
  // For now, just use the high priority issues as our filtered data
  const filteredData = high_priority_issues
    .filter(item => {
      const envMatch = selectedEnvironment === "All Environments" || (item.environment || "Unknown") === selectedEnvironment;
      const itemDate = new Date(item.created);
      const dateMatch = itemDate >= startDate && itemDate <= endDate;
      return envMatch && dateMatch;
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  // Debug logging
  console.log("Selected filters:", { selectedEnvironment, startDate, endDate });
  console.log("High priority issues:", high_priority_issues.length, "Filtered data:", filteredData.length);

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Feedback</h3>
          <p className="text-2xl font-bold text-gray-900">{total_feedback.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
          <p className="text-2xl font-bold text-red-600">{priority_distribution.High || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-2xl font-bold text-yellow-600">{status_distribution["In Progress"] || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{status_distribution.Done || 0}</p>
        </div>
      </div>

      {/* Environment Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Environment Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(environment_distribution)
            .sort(([,a], [,b]) => b - a)
            .map(([env, count]) => (
            <div key={env} className="text-center">
              <p className="text-sm text-gray-500">{env}</p>
              <p className="text-lg font-semibold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* High Priority Issues */}
      <div>
        <h2 className="text-xl font-medium mb-4">
          High Priority Issues
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({filteredData.length} results)
          </span>
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredData.slice(0, 10).map((issue) => (
              <div key={issue.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{issue.environment}</p>
                    <p className="text-sm text-gray-900 line-clamp-3">{issue.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(issue.created).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredData.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No high priority issues found for the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ProtectedLayout>
  );
}