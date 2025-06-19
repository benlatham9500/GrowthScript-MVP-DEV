
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

    console.log('Starting orphaned embeddings cleanup process...')

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all embeddings with their framework_ids
    console.log('Fetching all embeddings...')
    const { data: allEmbeddings, error: embeddingsError } = await supabase
      .from('framework_embeddings')
      .select('id, framework_id')

    if (embeddingsError) {
      console.error('Error fetching embeddings:', embeddingsError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch embeddings', 
          details: embeddingsError.message 
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

    // Get all existing framework IDs
    console.log('Fetching all framework IDs...')
    const { data: allFrameworks, error: frameworksError } = await supabase
      .from('frameworks')
      .select('id')

    if (frameworksError) {
      console.error('Error fetching frameworks:', frameworksError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch frameworks', 
          details: frameworksError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const existingFrameworkIds = new Set(allFrameworks?.map(f => f.id) || [])
    console.log(`Found ${existingFrameworkIds.size} existing frameworks`)

    // Find orphaned embeddings (embeddings with framework_ids that don't exist)
    const orphanedEmbeddings = allEmbeddings.filter(embedding => {
      if (!embedding.framework_id) {
        console.warn('Found embedding with null framework_id:', embedding.id)
        return true // Consider null framework_id as orphaned
      }
      return !existingFrameworkIds.has(embedding.framework_id)
    })

    if (orphanedEmbeddings.length === 0) {
      console.log('No orphaned embeddings found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orphaned embeddings found',
          removed_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${orphanedEmbeddings.length} orphaned embeddings`)

    // Delete orphaned embeddings
    const orphanedIds = orphanedEmbeddings.map(e => e.id)
    
    console.log(`Deleting ${orphanedIds.length} orphaned embeddings...`)
    const { error: deleteError } = await supabase
      .from('framework_embeddings')
      .delete()
      .in('id', orphanedIds)

    if (deleteError) {
      console.error('Error deleting orphaned embeddings:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete orphaned embeddings', 
          details: deleteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully deleted ${orphanedIds.length} orphaned embeddings`)

    const response = {
      success: true,
      message: `Successfully removed ${orphanedIds.length} orphaned embeddings`,
      removed_count: orphanedIds.length,
      orphaned_framework_ids: orphanedEmbeddings.map(e => e.framework_id).filter(Boolean)
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in remove-orphaned-embeddings function:', error)
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
