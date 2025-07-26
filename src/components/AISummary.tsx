import React, { useState } from 'react';

interface Issue {
  id: string;
  created: string;
  description: string;
  environment: string;
  system: string;
  team: string;
}

interface AISummaryProps {
  filteredData: Issue[];
}

const AISummary: React.FC<AISummaryProps> = ({ filteredData }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSummary = async () => {
    if (filteredData.length === 0) {
      setError('No data to summarize');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: filteredData.slice(0, 50) // Limit to 50 issues for API constraints
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const formatSummary = (text: string) => {
    // Split the summary into sections by double asterisk headers
    const sections = text.split(/\*\*(?=\w)/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      // Check if this section starts with a header
      const headerMatch = section.match(/^([^*]+)\*\*/);
      if (headerMatch) {
        const header = headerMatch[1].trim();
        const content = section.substring(headerMatch[0].length).trim();
        
        return (
          <div key={index} className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">{header}</h4>
            {formatContent(content)}
          </div>
        );
      }
      
      // If no header, just render content
      return <div key={index}>{formatContent(section)}</div>;
    }).filter(Boolean);
  };
  
  const formatContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const elements: React.ReactElement[] = [];
    let currentList: string[] = [];
    let listType: 'ordered' | 'unordered' | null = null;
    
    lines.forEach((line, i) => {
      const trimmedLine = line.trim();
      
      // Numbered list item
      if (/^\d+\./.test(trimmedLine)) {
        if (listType !== 'ordered') {
          if (currentList.length > 0) {
            elements.push(renderList(currentList, listType));
            currentList = [];
          }
          listType = 'ordered';
        }
        currentList.push(trimmedLine.replace(/^\d+\.\s*/, ''));
      }
      // Bullet point
      else if (trimmedLine.startsWith('•')) {
        if (listType !== 'unordered') {
          if (currentList.length > 0) {
            elements.push(renderList(currentList, listType));
            currentList = [];
          }
          listType = 'unordered';
        }
        currentList.push(trimmedLine.replace(/^•\s*/, ''));
      }
      // Regular text
      else {
        if (currentList.length > 0) {
          elements.push(renderList(currentList, listType));
          currentList = [];
          listType = null;
        }
        elements.push(
          <p key={`p-${i}`} className="text-gray-700 mb-2">
            {trimmedLine}
          </p>
        );
      }
    });
    
    // Handle any remaining list items
    if (currentList.length > 0) {
      elements.push(renderList(currentList, listType));
    }
    
    return <>{elements}</>;
  };
  
  const renderList = (items: string[], type: string | null) => {
    const ListTag = type === 'ordered' ? 'ol' : 'ul';
    const className = type === 'ordered' 
      ? "list-decimal list-inside space-y-2 text-gray-700 ml-4"
      : "list-disc list-inside space-y-2 text-gray-700 ml-4";
    
    return (
      <ListTag key={`list-${Date.now()}`} className={className}>
        {items.map((item, i) => (
          <li key={i} className="leading-relaxed">{item}</li>
        ))}
      </ListTag>
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">AI-Powered Insights</h3>
            <p className="text-sm text-gray-600">
              Analyze {filteredData.length} feedback items for patterns and recommendations
            </p>
          </div>
        </div>
        
        <button
          onClick={generateSummary}
          disabled={loading || filteredData.length === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            loading || filteredData.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            'Generate Summary'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {summary && (
        <div className={`bg-white rounded-lg p-6 shadow-sm transition-all ${
          isExpanded ? 'max-h-none' : 'max-h-48 overflow-hidden'
        }`}>
          <div className="prose prose-sm max-w-none">
            {formatSummary(summary)}
          </div>
          
          {summary.length > 500 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AISummary;