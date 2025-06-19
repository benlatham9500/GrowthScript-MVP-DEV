
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

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
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create a regular Supabase client to get the user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid token or user not found')
    }

    console.log('Deleting user account:', user.id)

    // Delete user data from public tables first
    const { error: userDataError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('_id', user.id)

    if (userDataError) {
      console.error('Error deleting user data:', userDataError)
      throw new Error('Failed to delete user data')
    }

    // Delete all clients and their associated data for this user
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Error fetching user clients:', clientsError)
    } else if (clients && clients.length > 0) {
      // Delete project profiles and chat history for each client
      for (const client of clients) {
        // Delete project profile (renamed from client_embeddings)
        await supabaseAdmin
          .from('project_profile')
          .delete()
          .eq('client_id', client.id)

        // Delete chat history
        await supabaseAdmin
          .from('chat_history')
          .delete()
          .eq('client_id', client.id)
      }

      // Delete all clients
      await supabaseAdmin
        .from('clients')
        .delete()
        .eq('user_id', user.id)
    }

    // Finally, delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      throw new Error('Failed to delete user account')
    }

    console.log('User account deleted successfully')

    return new Response(
      JSON.stringify({ message: 'User account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
