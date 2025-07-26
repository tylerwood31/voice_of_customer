"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface FeedbackDetail {
  id: string;
  initial_description: string;
  priority: string;
  team_routed: string;
  environment: string;
  area_impacted: string;
  created: string;
  notes: string;
  status: string;
  resolution_notes: string;
  type_of_report: string;
  triage_rep: string;
  related_imt: string;
  week: string;
  source: string;
}

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get('from') || 'feedback';
  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedbackDetail() {
      if (!params.id) return;

      try {
        console.log("Fetching feedback detail for ID:", params.id);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback/${params.id}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received feedback detail:", data);
        setFeedback(data);
      } catch (error) {
        console.error("Error fetching feedback detail:", error);
        setError(error instanceof Error ? error.message : "Failed to load feedback");
      } finally {
        setLoading(false);
      }
    }

    fetchFeedbackDetail();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'resolved':
        return 'text-green-600 bg-green-50';
      case 'in progress':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading feedback details...</div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error || "Feedback not found"}</div>
        <Link href={`/${fromPage}`} className="text-blue-500 hover:underline">
          ← Back to {fromPage === 'dashboard' ? 'Dashboard' : 'Feedback List'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${fromPage}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to {fromPage === 'dashboard' ? 'Dashboard' : 'Feedback'}</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Feedback Detail</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* ID and Status Bar */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">ID:</span>
                <span className="font-mono text-sm">{feedback.id}</span>
              </div>
              <div className="flex items-center gap-4">
                {feedback.priority && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(feedback.priority)}`}>
                    {feedback.priority} Priority
                  </span>
                )}
                {feedback.status && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feedback.status)}`}>
                    {feedback.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {feedback.initial_description || "No description provided"}
                </p>
              </div>
            </div>


            {/* Resolution Notes */}
            {feedback.resolution_notes && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Resolution Notes</h2>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.resolution_notes}</p>
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">Team:</span>
                    <span className="text-sm text-gray-900">{feedback.team_routed || "Unassigned"}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">Environment:</span>
                    <span className="text-sm text-gray-900">{feedback.environment || "Unknown"}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">System Impacted:</span>
                    <span className="text-sm text-gray-900">{feedback.area_impacted || "Unknown"}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">Type of Report:</span>
                    <span className="text-sm text-gray-900">{feedback.type_of_report || "N/A"}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">Source:</span>
                    <span className="text-sm text-gray-900">{feedback.source || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">Created:</span>
                    <span className="text-sm text-gray-900">{formatDate(feedback.created)}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">Week:</span>
                    <span className="text-sm text-gray-900">{feedback.week || "N/A"}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="text-sm font-medium text-gray-500 w-32">Triage Rep:</span>
                    <span className="text-sm text-gray-900">{feedback.triage_rep || "N/A"}</span>
                  </div>
                  {feedback.related_imt && (
                    <div className="flex border-b pb-2">
                      <span className="text-sm font-medium text-gray-500 w-32">Related IMT:</span>
                      <span className="text-sm text-gray-900">{feedback.related_imt}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}