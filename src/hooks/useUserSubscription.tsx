
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserSubscription {
  _id: string;
  email: string;
  plan: string;
  client_limit: number;
}

export const useUserSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching subscription for user:', user.email);
      
      // First check the subscription status via the edge function
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-subscription');
      
      if (checkError) {
        console.error('Error checking subscription:', checkError);
      } else {
        console.log('Subscription check result:', checkData);
      }
      
      // Then fetch from the database
      const { data, error } = await supabase
        .from('users')
        .select('_id, email, plan, client_limit')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        setError(error.message);
      } else {
        console.log('Subscription data:', data);
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    fetchSubscription();
  };

  return { subscription, loading, error, refetch };
};
