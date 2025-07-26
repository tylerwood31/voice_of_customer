"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./AuthProvider";
import { getCurrentUser, isSuperAdmin } from "@/utils/auth";
import { useEffect, useState } from "react";
import type { User } from "@/utils/auth";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 pb-2">
          <div className="mb-2 h-12 flex items-center">
            <img 
              src="/CoverWallet_Logo.png" 
              alt="CoverWallet" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                console.error('Logo failed to load, showing text fallback');
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="text-blue-600 font-bold text-lg">CoverWallet</div>';
                }
              }}
            />
          </div>
          <h2 className="text-base font-semibold text-gray-700">CW VoC v1</h2>
        </div>
        <nav className="px-3 pb-4 space-y-1">
          <Link 
            href="/dashboard" 
            className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
          >
            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            Dashboard
          </Link>
          
          <Link 
            href="/chat" 
            className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
          >
            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </Link>
          
          <Link 
            href="/feedback" 
            className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
          >
            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Feedback
          </Link>
          
          <Link 
            href="/reports" 
            className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
          >
            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </Link>
          
          {currentUser && isSuperAdmin(currentUser) && (
            <Link 
              href="/admin/users" 
              className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            >
              <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              User Management
            </Link>
          )}
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Signed in as
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser?.role?.replace('_', ' ')}
              </p>
            </div>
            <button 
              onClick={logout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors duration-150 mt-2"
            >
              <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}