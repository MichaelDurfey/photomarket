/**
 * Adobe Lightroom Status Component
 * 
 * This component shows the connection status of the store owner's Adobe Lightroom account.
 * This is a single-account integration - all users see photos from the owner's account.
 */

import { useState, useEffect } from "react";

interface AdobeStatus {
  connected: boolean;
  hasClientId: boolean;
}

export default function AdobeConnect() {
  const [status, setStatus] = useState<AdobeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/adobe/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error checking Adobe status:", error);
      setStatus({ connected: false, hasClientId: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  // Only show status if not connected or if there's a configuration issue
  if (!status?.hasClientId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Adobe Lightroom integration is not configured. 
          Photos are being loaded from local storage.
        </p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Store Setup:</strong> Adobe Lightroom account not connected. 
          Visit <a href="http://localhost:3000/auth/adobe" target="_blank" rel="noopener noreferrer" className="underline font-medium">/auth/adobe</a> to connect your account.
        </p>
      </div>
    );
  }

  // Connected - show minimal status
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
      <div className="flex items-center text-sm text-green-800">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        <span>Photos loaded from Adobe Lightroom</span>
      </div>
    </div>
  );
}

