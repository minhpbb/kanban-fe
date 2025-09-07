'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home for now
    // In real app, check authentication status first
    router.push('/home');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">⚡</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        <p className="text-gray-600">Redirecting to home</p>
      </div>
    </div>
  );
}