import React from 'react';

const TestComponent: React.FC = () => {
  console.log('TestComponent rendering');
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Test Component Loaded Successfully</h1>
        <p className="text-gray-700">
          If you can see this message, basic rendering is working correctly.
        </p>
      </div>
    </div>
  );
};

export default TestComponent;
