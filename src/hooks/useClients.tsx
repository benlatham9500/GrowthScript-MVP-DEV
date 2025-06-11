
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserSubscription } from '@/hooks/useUserSubscription';

export interface Client {
  id: string;
  user_id: string;
  client_name: string;
  industry: string | null;
  audience: string | null;
  product_types: string | null;
  brand_tone_notes: any;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscription } = useUserSubscription();

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data as Client[];
    },
    enabled: !!user,
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting client:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete client error:', error);
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const refreshClients = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const canAddClient = () => {
    if (!subscription || !clients) return false;
    return clients.length < (subscription.client_limit || 0);
  };

  const isClientNameTaken = (clientName: string) => {
    if (!clients) return false;
    return clients.some(client => 
      client.client_name.toLowerCase().trim() === clientName.toLowerCase().trim()
    );
  };

  return {
    clients: clients || [],
    isLoading,
    error,
    deleteClient: deleteClientMutation.mutate,
    isDeletingClient: deleteClientMutation.isPending,
    refreshClients,
    canAddClient,
    isClientNameTaken,
    subscription,
  };
};
