
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
      console.log('Starting client deletion process for client:', clientId);
      
      // Delete project profile (renamed from client embeddings)
      const { error: profileError } = await supabase
        .from('project_profile')
        .delete()
        .eq('client_id', clientId);

      if (profileError) {
        console.error('Error deleting project profile:', profileError);
        throw new Error('Failed to delete client project profile');
      }

      console.log('Successfully deleted project profile');

      // Delete chat history
      const { error: chatError } = await supabase
        .from('chat_history')
        .delete()
        .eq('client_id', clientId);

      if (chatError) {
        console.error('Error deleting chat history:', chatError);
        throw new Error('Failed to delete client chat history');
      }

      console.log('Successfully deleted chat history');

      // Finally delete the client record
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (clientError) {
        console.error('Error deleting client:', clientError);
        throw new Error('Failed to delete client record');
      }

      console.log('Successfully deleted client record');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client and all associated data deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete client error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client. Please try again.",
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
