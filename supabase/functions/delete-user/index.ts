import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    console.log(`Deleting user: ${userId}`)

    // Delete user from Supabase Auth using admin client
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting user:', error)
      throw error
    }

    console.log('User deleted successfully:', userId)

    // Log the activity
    await supabaseAdmin.from('user_activity_logs').insert({
      user_id: userId,
      action: 'user_deleted_by_admin',
      details: { 
        deleted_at: new Date().toISOString(),
        deleted_by: 'admin'
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})