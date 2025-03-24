import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/auth/AuthGuard";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Tickets from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import CreateTicket from "./pages/CreateTicket";
import KnowledgeBase from "./pages/KnowledgeBase";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

console.log('App component imported modules successfully');

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

console.log('QueryClient created');

export default function App() {
  console.log('App component function called');
  
  try {
    console.log('Rendering App component with full routes');
    return (
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {/* Toast notifications */}
            <Toaster />
            <Sonner />
            
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes - wrapped with AuthGuard and MainLayout */}
                <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
                  <Route index element={<Dashboard />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/tickets/new" element={<CreateTicket />} />
                  <Route path="/tickets/:id" element={<TicketDetail />} />
                  <Route path="/knowledge-base" element={<KnowledgeBase />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                
                {/* Redirect root to dashboard if logged in */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('Error rendering App component:', error);
    return <div>An error occurred while rendering the application</div>;
  }
}
