"use client";
import React, { useState, useEffect } from "react";

export default function TestReportsPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('All Environments');
  const [environments] = useState<string[]>(['All Environments', 'SME 2.0 - Production', 'CW 1.0', 'Affinities 1.0']);
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/reports/response-times`);
      if (selectedEnvironment && selectedEnvironment !== 'All Environments') {
        url.searchParams.append('environment', selectedEnvironment);
      }
      
      console.log(`Testing API call for environment: ${selectedEnvironment}`);
      console.log(`API URL: ${url.toString()}`);
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      console.log(`Response:`, data);
      setApiData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEnvironment]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Test Reports API</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Environment:</label>
        <select
          value={selectedEnvironment}
          onChange={(e) => {
            console.log(`Environment changed to: ${e.target.value}`);
            setSelectedEnvironment(e.target.value);
          }}
          className="border p-2 rounded min-w-[200px]"
        >
          {environments.map(env => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
      </div>

      <button 
        onClick={fetchData}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Refresh Data
      </button>

      {loading && <div>Loading...</div>}
      
      {apiData && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">API Response:</h3>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Environment:</strong> {selectedEnvironment}</p>
            <p><strong>Rows count:</strong> {apiData.rows?.length || 0}</p>
            <p><strong>First row count:</strong> {apiData.rows?.[0]?.count || 'N/A'}</p>
            <p><strong>Weighted count:</strong> {apiData.weighted?.count || 'N/A'}</p>
          </div>
          
          <details className="mt-4">
            <summary className="cursor-pointer font-medium">Raw JSON Response</summary>
            <pre className="bg-gray-100 p-4 rounded mt-2 text-xs overflow-auto">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}