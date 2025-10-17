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

    const { userId, customPassword } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Get user profile and role information
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, mobile')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      throw profileError
    }

    // Get user roles
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      throw rolesError
    }

    const userRoles = rolesData?.map(r => r.role) || []
    const primaryRole = userRoles.includes('super_admin') ? 'Super Admin' :
                       userRoles.includes('admin') ? 'Admin' :
                       userRoles.includes('driver') ? 'Driver' :
                       userRoles.includes('parent') ? 'Parent' : 'User'

    // Use custom password if provided, otherwise generate a temporary password
    const password = customPassword || (Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '123!')
    const isCustomPassword = !!customPassword

    console.log(`${isCustomPassword ? 'Setting custom' : 'Resetting'} password for ${primaryRole}: ${userId}`)

    // Reset user password using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password
    })

    if (error) {
      console.error('Error updating password:', error)
      throw error
    }

    console.log(`Password ${isCustomPassword ? 'set' : 'reset'} successful for ${primaryRole}:`, userId)

    // Log the activity
    await supabaseAdmin.from('user_activity_logs').insert({
      user_id: userId,
      action: isCustomPassword ? 'password_set_by_admin' : 'password_reset_by_admin',
      details: { 
        updated_at: new Date().toISOString(),
        updated_by: 'admin',
        type: isCustomPassword ? 'custom_password' : 'temp_password',
        user_role: primaryRole,
        user_name: profileData.full_name,
        user_email: profileData.email
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        tempPassword: isCustomPassword ? null : password,
        message: `Password ${isCustomPassword ? 'set' : 'reset'} successfully`,
        userInfo: {
          name: profileData.full_name,
          email: profileData.email,
          mobile: profileData.mobile,
          role: primaryRole,
          roles: userRoles
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Error in reset-user-password function:', error)
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