import React from 'react';
import { useLocation } from 'react-router-dom';

// Pages that should be full-width on desktop (hero/immersive)
const FULL_WIDTH_PAGES = ['/', '/login', '/qr-menu'];

export const PageWrapper = ({ children }) => {
  const { pathname } = useLocation();
  const isFullWidth = FULL_WIDTH_PAGES.includes(pathname);

  if (isFullWidth) return <>{children}</>;

  return (
    <div className="min-h-full w-full md:py-6">
      <div className="w-full md:max-w-5xl md:mx-auto md:px-6 lg:px-8">
        {/* Desktop card shell */}
        <div className="md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:overflow-hidden min-h-[calc(100vh-10rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
