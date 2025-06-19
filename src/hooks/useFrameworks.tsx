
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Framework {
  id: string;
  title: string;
  author: string | null;
  summary: string | null;
  use_when: string | null;
  tags: string[] | null;
  example: string | null;
  keywords: string[] | null;
  category: string | null;
  related_frameworks: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useFrameworks = () => {
  const {
    data: frameworks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['frameworks'],
    queryFn: async () => {
      console.log('Fetching frameworks...');
      
      const { data, error } = await supabase
        .from('frameworks')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching frameworks:', error);
        throw error;
      }

      console.log('Fetched frameworks:', data);
      return data as Framework[];
    },
  });

  const searchFrameworks = async (searchTerm: string) => {
    console.log('Searching frameworks for:', searchTerm);
    
    const { data, error } = await supabase
      .from('frameworks')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error searching frameworks:', error);
      throw error;
    }

    return data as Framework[];
  };

  const getFrameworksByCategory = async (category: string) => {
    console.log('Getting frameworks for category:', category);
    
    const { data, error } = await supabase
      .from('frameworks')
      .select('*')
      .eq('category', category)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching frameworks by category:', error);
      throw error;
    }

    return data as Framework[];
  };

  return {
    frameworks: frameworks || [],
    isLoading,
    error,
    refetch,
    searchFrameworks,
    getFrameworksByCategory,
  };
};
