import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting duplicate embeddings removal process...')

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all embeddings with their framework_ids and created_at, ordered by framework_id and creation date
    console.log('Fetching all embeddings...')
    const { data: allEmbeddings, error: fetchError } = await supabase
      .from('framework_embeddings')
      .select('id, framework_id, created_at')
      .order('framework_id')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching embeddings:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch embeddings', 
          details: fetchError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!allEmbeddings || allEmbeddings.length === 0) {
      console.log('No embeddings found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No embeddings found',
          removed_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${allEmbeddings.length} total embeddings`)

    // Group embeddings by framework_id and keep only the oldest one for each framework
    const frameworkGroups = new Map()
    const embeddingsToDelete = []

    for (const embedding of allEmbeddings) {
      if (!embedding.framework_id) {
        console.warn('Found embedding with null framework_id, marking for deletion:', embedding.id)
        embeddingsToDelete.push(embedding.id)
        continue
      }
      
      if (!frameworkGroups.has(embedding.framework_id)) {
        // This is the first (oldest) embedding for this framework, keep it
        frameworkGroups.set(embedding.framework_id, embedding)
      } else {
        // This is a duplicate, mark it for deletion
        embeddingsToDelete.push(embedding.id)
      }
    }

    if (embeddingsToDelete.length === 0) {
      console.log('No duplicate embeddings found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No duplicate embeddings found - 1:1 relationship already maintained',
          removed_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${embeddingsToDelete.length} duplicate embeddings to remove`)

    // Delete all duplicate embeddings in batches
    const batchSize = 100
    let totalRemoved = 0

    for (let i = 0; i < embeddingsToDelete.length; i += batchSize) {
      const batch = embeddingsToDelete.slice(i, i + batchSize)
      
      console.log(`Deleting batch ${Math.floor(i/batchSize) + 1}: ${batch.length} embeddings`)
      
      const { error: deleteError } = await supabase
        .from('framework_embeddings')
        .delete()
        .in('id', batch)

      if (deleteError) {
        console.error(`Error deleting batch:`, deleteError)
        // Continue with other batches even if one fails
      } else {
        totalRemoved += batch.length
        console.log(`Successfully deleted batch of ${batch.length} embeddings`)
      }
    }

    console.log(`Duplicate removal completed. Total removed: ${totalRemoved}`)

    const response = {
      success: true,
      message: `Successfully enforced 1:1 relationship by removing ${totalRemoved} duplicate embeddings`,
      removed_count: totalRemoved,
      unique_frameworks: frameworkGroups.size
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in remove-duplicate-embeddings function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
