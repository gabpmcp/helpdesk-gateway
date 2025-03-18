
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// This is just a redirect component for the index route
const Index = () => {
  useEffect(() => {
    document.title = "Helpdesk Client Portal";
  }, []);

  // Redirect to dashboard
  return <Navigate to="/" replace />;
};

export default Index;
