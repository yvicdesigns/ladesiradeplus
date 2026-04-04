import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * NOTE: The old standalone Inventory Page has been deprecated.
 * Stock management is now fully integrated into the "Stocks" section.
 * This component acts as a redirect to the new correct route.
 */
export const AdminInventoryPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the correct stock management page immediately
    // Fix: Changed from '/admin/stock' to '/admin/stock-management' to match App.jsx routing
    navigate('/admin/stock-management', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-gray-500 font-medium">Redirection vers la page de gestion des stocks...</p>
    </div>
  );
};

export default AdminInventoryPage;