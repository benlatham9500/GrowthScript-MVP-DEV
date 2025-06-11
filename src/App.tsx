
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import ClientChat from "./pages/ClientChat";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionRoute from "./components/SubscriptionRoute";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { subscription, loading: subLoading } = useUserSubscription();

  if (loading || (user && subLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={
          user ? (
            // If user is authenticated, check their subscription and redirect accordingly
            subscription && subscription.plan !== 'none' && subscription.client_limit > 0 ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/billing" replace />
            )
          ) : (
            <Auth />
          )
        } 
      />
      <Route 
        path="/billing" 
        element={
          <ProtectedRoute>
            {/* If user has active subscription, redirect to dashboard */}
            {subscription && subscription.plan !== 'none' && subscription.client_limit > 0 ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Billing />
            )}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <SubscriptionRoute>
            <Dashboard />
          </SubscriptionRoute>
        } 
      />
      <Route 
        path="/chat/:clientId" 
        element={
          <SubscriptionRoute>
            <ClientChat />
          </SubscriptionRoute>
        } 
      />
      <Route path="/" element={<Index />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
