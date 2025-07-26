import React from 'react';
import { useRouter } from 'next/navigation';

interface Issue {
  id: string;
  created: string;
  description: string;
  environment: string;
  system: string;
  team: string;
  priority?: string;
}

interface FilteredIssuesProps {
  filteredData: Issue[];
  isWithinLastDays?: (dateStr: string, days: number) => boolean;
  fromDashboard?: boolean;
}

const FilteredIssues: React.FC<FilteredIssuesProps> = ({ 
  filteredData, 
  isWithinLastDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  },
  fromDashboard = false
}) => {
  const router = useRouter();
  if (filteredData.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No issues found matching the selected filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredData.map(issue => {
        const isRecent = isWithinLastDays(issue.created, 7);
        const createdDate = new Date(issue.created);
        const today = new Date();
        const daysAgo = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div 
            key={issue.id} 
            className={`p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
              isRecent ? 'border-l-4 border-l-orange-500' : ''
            }`}
            onClick={() => {
              const returnPath = fromDashboard ? 'dashboard' : 'feedback';
              router.push(`/feedback/${issue.id}?from=${returnPath}`);
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="text-gray-700 line-clamp-2">
                  {issue.description}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {isRecent && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Recent
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-1 4h1m-1 4h1" />
                </svg>
                {issue.environment}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                {issue.system}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {issue.team}
              </span>
              <span className="ml-auto">
                {createdDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FilteredIssues;