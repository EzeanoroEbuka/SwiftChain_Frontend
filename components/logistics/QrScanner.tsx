import React, { useEffect } from 'react';
import { useQrScanner } from '../../hooks/useQrScanner';

export const QrScanner: React.FC = () => {
  const { error, videoRef, isCameraActive, startCamera, stopCamera } = useQrScanner();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">QR Code Scanner</h2>
      
      {error && (
        <div 
          className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 w-full max-w-md rounded-r-md" 
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {!isCameraActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        <video 
          ref={videoRef}
          className={`w-full h-full object-cover ${!isCameraActive ? 'opacity-0' : 'opacity-100'}`}
          data-testid="qr-video-element"
        />
        {isCameraActive && (
          <div className="absolute inset-0 border-2 border-green-500 opacity-50 m-8 rounded"></div>
        )}
      </div>
      
      <div className="mt-6 flex gap-4">
        {!isCameraActive && !error && (
          <button 
            onClick={startCamera}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Camera
          </button>
        )}
        {error && (
          <button 
            onClick={startCamera}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
