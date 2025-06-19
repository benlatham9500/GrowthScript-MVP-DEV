
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Framework {
  title: string;
  author?: string;
  summary?: string;
  use_when?: string;
  tags?: string[];
  example?: string;
  keywords?: string[];
  category?: string;
  related_frameworks?: string[];
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

    console.log('Starting frameworks seeding process...')

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { frameworks, clear_existing = false } = await req.json()

    if (!frameworks || !Array.isArray(frameworks)) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON structure. Expected an array of frameworks.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate framework structure
    for (let i = 0; i < frameworks.length; i++) {
      const framework = frameworks[i]
      if (!framework.title || typeof framework.title !== 'string') {
        return new Response(
          JSON.stringify({ 
            error: `Framework at index ${i} is missing required 'title' field or title is not a string` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Clear existing data if requested
    if (clear_existing) {
      console.log('Clearing existing frameworks...')
      const { error: deleteError } = await supabase
        .from('frameworks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

      if (deleteError) {
        console.error('Error clearing existing frameworks:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to clear existing frameworks' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Transform and insert frameworks
    console.log(`Processing ${frameworks.length} frameworks...`)
    const transformedFrameworks = frameworks.map((framework: Framework) => ({
      title: framework.title,
      author: framework.author || null,
      summary: framework.summary || null,
      use_when: framework.use_when || null,
      tags: framework.tags ? JSON.stringify(framework.tags) : '[]',
      example: framework.example || null,
      keywords: framework.keywords ? JSON.stringify(framework.keywords) : '[]',
      category: framework.category || null,
      related_frameworks: framework.related_frameworks ? JSON.stringify(framework.related_frameworks) : '[]'
    }))

    // Insert in batches to avoid timeout issues
    const batchSize = 50
    let insertedCount = 0
    let errors = []

    for (let i = 0; i < transformedFrameworks.length; i += batchSize) {
      const batch = transformedFrameworks.slice(i, i + batchSize)
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`)
      
      const { data, error } = await supabase
        .from('frameworks')
        .insert(batch)
        .select('id')

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error.message
        })
      } else {
        insertedCount += data?.length || 0
        console.log(`Successfully inserted ${data?.length || 0} frameworks in batch ${Math.floor(i / batchSize) + 1}`)
      }
    }

    console.log(`Seeding completed. Inserted: ${insertedCount}, Errors: ${errors.length}`)

    const response = {
      success: true,
      message: `Successfully seeded ${insertedCount} frameworks`,
      inserted_count: insertedCount,
      total_provided: frameworks.length,
      errors: errors.length > 0 ? errors : undefined
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in seed-frameworks function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
