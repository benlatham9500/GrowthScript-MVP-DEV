
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSubscription } from '@/hooks/useUserSubscription';

interface SubscriptionRouteProps {
  children: React.ReactNode;
}

const SubscriptionRoute: React.FC<SubscriptionRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useUserSubscription();

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has no plan or client_limit is -1 (newly registered)
  if (!subscription || subscription.plan === 'none' || subscription.client_limit === -1) {
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
};

export default SubscriptionRoute;
