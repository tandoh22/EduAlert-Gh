import React from 'react';
import HeadmasterSidebar from './HeadmasterSidebar';
import Header from './Header';

export default function HeadmasterLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <HeadmasterSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
