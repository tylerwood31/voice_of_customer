// src/app/reports/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import ResponseTimesTable from "@/components/ResponseTimesTable";
import ProtectedLayout from '@/components/ProtectedLayout';

interface FeedbackRecord {
  id: string;
  environment: string;
}

export default function ReportsPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('reports-env-filter') || 'All Environments';
    }
    return 'All Environments';
  });
  const [environments, setEnvironments] = useState<string[]>(['All Environments']);
  const [loading, setLoading] = useState(true);

  // Save filter to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('reports-env-filter', selectedEnvironment);
    }
  }, [selectedEnvironment]);

  // Fetch environments that have response time data
  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        // Get environments from the response times API instead of feedback API
        // This ensures we only show environments that have cached response time data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/response-times`);
        if (response.ok) {
          const data = await response.json();
          // Get unique environments from the cached data
          // If we have cache data, extract environments from there
          const envSet = new Set<string>();
          
          // Try to get environments from a dedicated endpoint first (if available)
          try {
            const envResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/environments`);
            if (envResponse.ok) {
              const envData = await envResponse.json();
              envData.environments?.forEach((env: string) => envSet.add(env));
            }
          } catch {
            // Fallback: we'll use the feedback API but filter for environments with response time data
            const feedbackResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback/`);
            if (feedbackResponse.ok) {
              const feedbackData = await feedbackResponse.json();
              // Only include environments that we know have response time cache data
              const cacheEnvs = ["SME 2.0 - Production", "CW 1.0", "Affinities 1.0", "Allied Individuals"];
              feedbackData.forEach((f: FeedbackRecord) => {
                if (f.environment && cacheEnvs.includes(f.environment)) {
                  envSet.add(f.environment);
                }
              });
            }
          }
          
          const uniqueEnvs = ["All Environments", ...Array.from(envSet).sort()];
          console.log(`🌍 Available environments with response time data:`, uniqueEnvs);
          setEnvironments(uniqueEnvs);
        }
      } catch (error) {
        console.error("Error fetching environments:", error);
        // Fallback to hardcoded list of environments with data
        setEnvironments(["All Environments", "SME 2.0 - Production", "CW 1.0", "Affinities 1.0", "Allied Individuals"]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironments();
  }, []);

  return (
    <ProtectedLayout>
      <div className="p-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Average SME + Tech Response Times</h1>
          
          {/* Environment Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Environment:</label>
              <select
                value={selectedEnvironment}
                onChange={(e) => {
                  console.log(`🔄 Environment changed from "${selectedEnvironment}" to "${e.target.value}"`);
                  setSelectedEnvironment(e.target.value);
                }}
                className="border p-2 rounded min-w-[200px]"
                disabled={loading}
              >
                {environments.map(env => (
                  <option key={env} value={env}>{env}</option>
                ))}
              </select>
            </div>
            {selectedEnvironment !== 'All Environments' && (
              <span className="text-sm text-gray-500 italic">
                Showing data for {selectedEnvironment} environment
              </span>
            )}
          </div>

          <ResponseTimesTable selectedEnvironment={selectedEnvironment} />
        </div>
      </div>
    </ProtectedLayout>
  );
}