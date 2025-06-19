
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Memory {
  id: string;
  client_id: string;
  user_id: string;
  key: string;
  value: any;
  updated_at: string;
}

export const useMemory = (clientId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: memories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['memory', clientId, user?.id],
    queryFn: async () => {
      if (!user || !clientId) return [];
      
      const { data, error } = await supabase
        .from('memory')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching memory:', error);
        throw error;
      }

      return data as Memory[];
    },
    enabled: !!user && !!clientId,
  });

  const setMemoryMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!user || !clientId) {
        throw new Error('User not authenticated or client not selected');
      }

      const { data, error } = await supabase
        .from('memory')
        .upsert({
          client_id: clientId,
          user_id: user.id,
          key,
          value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id,user_id,key'
        })
        .select()
        .single();

      if (error) {
        console.error('Error setting memory:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', clientId] });
    },
    onError: (error) => {
      console.error('Set memory error:', error);
      toast({
        title: "Error",
        description: "Failed to save memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getMemoryMutation = useMutation({
    mutationFn: async (key: string) => {
      if (!user || !clientId) {
        throw new Error('User not authenticated or client not selected');
      }

      const { data, error } = await supabase
        .from('memory')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting memory:', error);
        throw error;
      }

      return data as Memory | null;
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (key: string) => {
      if (!user || !clientId) {
        throw new Error('User not authenticated or client not selected');
      }

      const { error } = await supabase
        .from('memory')
        .delete()
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .eq('key', key);

      if (error) {
        console.error('Error deleting memory:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', clientId] });
      toast({
        title: "Success",
        description: "Memory deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete memory error:', error);
      toast({
        title: "Error",
        description: "Failed to delete memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearAllMemoryMutation = useMutation({
    mutationFn: async () => {
      if (!user || !clientId) {
        throw new Error('User not authenticated or client not selected');
      }

      const { error } = await supabase
        .from('memory')
        .delete()
        .eq('client_id', clientId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing memory:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory', clientId] });
      toast({
        title: "Success",
        description: "All memory cleared successfully",
      });
    },
    onError: (error) => {
      console.error('Clear memory error:', error);
      toast({
        title: "Error",
        description: "Failed to clear memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    memories: memories || [],
    isLoading,
    error,
    setMemory: setMemoryMutation.mutate,
    getMemory: getMemoryMutation.mutate,
    deleteMemory: deleteMemoryMutation.mutate,
    clearAllMemory: clearAllMemoryMutation.mutate,
    isSettingMemory: setMemoryMutation.isPending,
    isGettingMemory: getMemoryMutation.isPending,
    isDeletingMemory: deleteMemoryMutation.isPending,
    isClearingMemory: clearAllMemoryMutation.isPending,
  };
};
