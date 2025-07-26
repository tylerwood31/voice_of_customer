"use client";
import { useState } from "react";
import ProtectedLayout from '@/components/ProtectedLayout';

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnswer("");
    setIsLoading(true);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.body) {
      setIsLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      buffer += decoder.decode(value, { stream: true });
      setAnswer((prev) => prev + buffer);
      buffer = "";
    }
    setIsLoading(false);
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Voice of Customer Chat</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about Salesforce issues, bugs, or feedback..."
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Analyzing..." : "Ask"}
            </button>
          </div>
        </form>

        {answer && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Analysis:</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">
                {answer}
              </pre>
            </div>
          </div>
        )}

        {isLoading && !answer && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching feedback and generating insights...</p>
          </div>
        )}
      </div>
      </div>
    </ProtectedLayout>
  );
}