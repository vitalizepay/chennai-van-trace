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

    const { userData } = await req.json()

    // Generate a secure temporary password if not provided
    const tempPassword = userData.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123!'

    // Create user in Supabase Auth with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName
      }
    })

    if (authError) throw authError

    if (!authData.user) throw new Error('Failed to create user')

    // Update the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: userData.fullName,
        mobile: userData.phone,
        phone: userData.phone,
        status: 'approved'
      })
      .eq('user_id', authData.user.id)

    if (profileError) throw profileError

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: userData.role,
        assigned_by: userData.createdBy
      })

    if (roleError) throw roleError

    // Add role-specific details
    if (userData.role === 'driver') {
      const { error: driverError } = await supabaseAdmin
        .from('driver_details')
        .insert({
          user_id: authData.user.id,
          license_number: userData.licenseNumber,
          experience_years: userData.experienceYears ? parseInt(userData.experienceYears) : null,
          van_assigned: userData.vanAssigned || null,
          route_assigned: userData.routeAssigned || null
        })

      if (driverError) throw driverError
    } else if (userData.role === 'parent') {
      const { error: parentError } = await supabaseAdmin
        .from('parent_details')
        .insert({
          user_id: authData.user.id,
          children_count: parseInt(userData.childrenCount),
          address: userData.address || null,
          emergency_contact: userData.emergencyContact || null
        })

      if (parentError) throw parentError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        tempPassword: tempPassword
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})