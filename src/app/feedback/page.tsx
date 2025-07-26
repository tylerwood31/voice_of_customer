"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css';
import ProtectedLayout from '@/components/ProtectedLayout';

interface FeedbackRecord {
  id: string;
  description: string;
  priority: string;
  team: string;
  environment: string;
  system_impacted: string;
  created: string;
}

export default function Feedback() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states - initialize from sessionStorage
  const [selectedEnvironment, setSelectedEnvironment] = useState("All Environments");
  const [selectedSystem, setSelectedSystem] = useState("All Systems");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [startDate, setStartDate] = useState<Date>(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;

  // Initialize all filters from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitialized) {
      // Load saved filters
      const savedEnv = sessionStorage.getItem('feedback-env-filter');
      const savedSys = sessionStorage.getItem('feedback-sys-filter');
      const savedTeam = sessionStorage.getItem('feedback-team-filter');
      const savedStart = sessionStorage.getItem('feedback-start-date');
      const savedEnd = sessionStorage.getItem('feedback-end-date');
      
      if (savedEnv) setSelectedEnvironment(savedEnv);
      if (savedSys) setSelectedSystem(savedSys);
      if (savedTeam) setSelectedTeam(savedTeam);
      
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
      sessionStorage.setItem('feedback-env-filter', selectedEnvironment);
    }
  }, [selectedEnvironment, hasInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('feedback-sys-filter', selectedSystem);
    }
  }, [selectedSystem, hasInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('feedback-team-filter', selectedTeam);
    }
  }, [selectedTeam, hasInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('feedback-start-date', startDate.toISOString());
    }
  }, [startDate, hasInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && hasInitialized) {
      sessionStorage.setItem('feedback-end-date', endDate.toISOString());
    }
  }, [endDate, hasInitialized]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEnvironment, selectedSystem, selectedTeam, startDate, endDate]);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        console.log("🔥 FEEDBACK: Fetching feedback from API...");
        const timestamp = new Date().getTime();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback/?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        console.log("🔥 FEEDBACK: Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log("🔥 FEEDBACK: Received data:", data.length, "records");
        console.log("🔥 FEEDBACK: Sample record from API:", data[0]);
        // Log environment and system values for first few records
        console.log("🔥 FEEDBACK: First 3 records environment/system data:");
        data.slice(0, 3).forEach((record: FeedbackRecord, idx: number) => {
          console.log(`🔥 FEEDBACK: Record ${idx + 1}:`, {
            id: record.id,
            environment: record.environment,
            system_impacted: record.system_impacted
          });
        });
        setFeedback(data);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading feedback...</div>;

  // Extract unique values for filters - parse array strings and clean up
  const parseSystemValue = (sys: string): string[] => {
    console.log(`🔥 PARSING: "${sys}"`);
    if (!sys || sys === "Unknown") return [];
    
    // Handle array-like strings: "['Salesforce']" -> ["Salesforce"]
    if (sys.startsWith("['") && sys.endsWith("']")) {
      try {
        // Remove outer brackets and split by comma, then clean each item
        const inner = sys.slice(2, -2); // Remove [' and ']
        const parsed = inner.split("', '").map(item => item.trim()).filter(item => item && item !== "");
        console.log(`🔥 PARSED ARRAY: "${sys}" -> [${parsed.join(', ')}]`);
        return parsed;
      } catch {
        return [];
      }
    }
    
    // Handle regular strings
    const result = sys.trim() ? [sys.trim()] : [];
    console.log(`🔥 PARSED STRING: "${sys}" -> [${result.join(', ')}]`);
    return result;
  };

  const allSystemValues = feedback
    .map((f) => f.system_impacted)
    .flatMap(parseSystemValue)
    .filter(sys => sys && sys !== "Unknown" && sys !== '""' && !sys.includes('""'));
  
  const environments = ["All Environments", ...new Set(feedback.map((f) => f.environment || "Unknown").filter(env => env && env.trim() !== "" && env !== "Unknown"))];
  const systems = ["All Systems", ...new Set(allSystemValues)];
  const teams = ["All Teams", ...new Set(feedback.map((f) => f.team || "Unassigned").filter(team => team && team.trim() !== "" && team !== "Unassigned"))];
  
  console.log("🔥 FINAL PARSED SYSTEMS (first 15):", systems.slice(0, 15));
  console.log("🔥 TOTAL SYSTEMS COUNT:", systems.length);

  // First filter by date range
  const dateFilteredFeedback = feedback.filter((item) => {
    const itemDate = new Date(item.created);
    return itemDate >= startDate && itemDate <= endDate;
  });

  // Then apply other filters
  const filteredFeedback = dateFilteredFeedback.filter((item) => {
    const teamMatch = selectedTeam === "All Teams" || (item.team || "Unassigned") === selectedTeam;
    const envMatch = selectedEnvironment === "All Environments" || (item.environment || "Unknown") === selectedEnvironment;
    
    // For system filter, check if selected system is in the parsed array
    const sysMatch = selectedSystem === "All Systems" || 
      parseSystemValue(item.system_impacted || "Unknown").includes(selectedSystem);
    
    return teamMatch && envMatch && sysMatch;
  });

  // Sort chronologically (newest first)
  const sortedFeedback = filteredFeedback.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  // Pagination logic
  const totalPages = Math.ceil(sortedFeedback.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedFeedback = sortedFeedback.slice(startIndex, endIndex);

  console.log("🔥 FEEDBACK: Filter state:", { selectedEnvironment, selectedSystem });
  console.log("🔥 FEEDBACK: Total feedback:", feedback.length);
  console.log("🔥 FEEDBACK: Filtered feedback:", filteredFeedback.length);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <ProtectedLayout>
      <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Feedback Records</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Team Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Team</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {teams.map((team, idx) => (
              <option key={idx} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {/* Environment Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Environment</label>
          <select
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {environments.map((env, idx) => (
              <option key={idx} value={env}>
                {env}
              </option>
            ))}
          </select>
        </div>

        {/* System Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">System Impacted</label>
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {systems.map((sys, idx) => (
              <option key={idx} value={sys}>
                {sys}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Date Range</label>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 border rounded px-2 py-1 hover:bg-gray-50 text-sm min-w-[200px]"
            >
              <span className="text-gray-700">
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {showDatePicker && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDatePicker(false)}
              />
              <div className="absolute top-full right-0 mt-1 z-50 bg-white border rounded-lg shadow-xl">
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

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Created</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Environment</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">System Impacted</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Team</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedFeedback.map((item, idx) => (
              <tr 
                key={idx} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/feedback/${item.id}`)}
              >
                <td className="px-4 py-2 text-sm text-gray-800">{formatDate(item.created)}</td>
                <td className="px-4 py-2 text-sm text-gray-800">{item.environment || "Unknown"}</td>
                <td className="px-4 py-2 text-sm text-gray-800">
                  {parseSystemValue(item.system_impacted || "Unknown").join(", ") || "Unknown"}
                </td>
                <td className="px-4 py-2 text-sm text-gray-800">{item.team || "Unassigned"}</td>
                <td className="px-4 py-2 text-sm text-gray-800">
                  <div className="flex items-center justify-between">
                    <span 
                      className="truncate max-w-xs"
                      title={item.description}
                    >
                      {item.description}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedFeedback.length === 0 && sortedFeedback.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center text-sm text-gray-500">
                  No feedback found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedFeedback.length)} of {sortedFeedback.length} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      pageNum === currentPage
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </ProtectedLayout>
  );
}