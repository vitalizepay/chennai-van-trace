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
    console.log('Creating user with data:', { ...userData, password: userData.password ? '[REDACTED]' : undefined })

    // Generate a secure temporary password if not provided
    const tempPassword = userData.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123!'
    console.log('Generated temp password for user:', userData.email)

    let authData;
    let isExistingUser = false;

    // First check if user already exists
    console.log('Checking if user already exists:', userData.email)
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw listError
    }

    const existingUser = existingUsers.users.find(u => u.email === userData.email)
    
    if (existingUser) {
      console.log('User already exists, updating existing user:', existingUser.id)
      isExistingUser = true;
      
      // Update existing user's password and metadata
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: tempPassword,
          user_metadata: {
            full_name: userData.fullName
          }
        }
      )

      if (updateError) {
        console.error('Error updating existing user:', updateError)
        throw updateError
      }

      authData = { user: updateData.user }
      console.log('Existing user updated successfully:', existingUser.id)
    } else {
      // Create new user in Supabase Auth with admin client
      console.log('Creating new auth user for:', userData.email)
      const { data: createData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName
        }
      })

      if (authError) {
        console.error('Auth creation error:', authError)
        throw authError
      }

      if (!createData.user) {
        console.error('No user data returned from auth creation')
        throw new Error('Failed to create user')
      }

      authData = createData
      console.log('New auth user created successfully:', createData.user.id)
    }

    // Handle profile creation/update with proper conflict resolution
    console.log('Handling profile for user:', authData.user.id)
    
    // First check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', authData.user.id)
      .single()

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileCheckError)
      throw profileCheckError
    }

    // Check if mobile number is already used by another user
    let canUpdateMobile = true;
    if (userData.phone) {
      const { data: mobileCheck, error: mobileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .or(`mobile.eq.${userData.phone},phone.eq.${userData.phone}`)
        .neq('user_id', authData.user.id)
        .limit(1)

      if (mobileCheckError) {
        console.error('Error checking mobile number:', mobileCheckError)
        // Continue without mobile update if check fails
        canUpdateMobile = false;
      } else if (mobileCheck && mobileCheck.length > 0) {
        console.log('Mobile number already exists for another user, skipping mobile update')
        canUpdateMobile = false;
      }
    }

    if (existingProfile) {
      // Profile exists - update it
      console.log('Updating existing profile')
      const updateData: any = {
        email: userData.email,
        full_name: userData.fullName,
        status: 'approved'
      }
      
      // Only update mobile if it's safe to do so
      if (canUpdateMobile && userData.phone) {
        updateData.mobile = userData.phone;
        updateData.phone = userData.phone;
      }
      
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('user_id', authData.user.id)

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError)
        throw profileUpdateError
      }
      console.log('Profile updated successfully')
    } else {
      // Profile doesn't exist - create it
      console.log('Creating new profile')
      const insertData: any = {
        user_id: authData.user.id,
        email: userData.email,
        full_name: userData.fullName,
        status: 'approved'
      }
      
      // Only add mobile if it's safe to do so
      if (canUpdateMobile && userData.phone) {
        insertData.mobile = userData.phone;
        insertData.phone = userData.phone;
      }
      
      const { error: profileInsertError } = await supabaseAdmin
        .from('profiles')
        .insert(insertData)

      if (profileInsertError) {
        console.error('Profile insert error:', profileInsertError)
        throw profileInsertError
      }
      console.log('Profile created successfully')
    }

    // Handle school assignment - all users should be assigned to the creating admin's school
    let schoolId = userData.schoolId || null
    if (schoolId) {
      console.log(`Assigning ${userData.role} to school:`, schoolId)
    }

    // Assign role with school assignment (upsert to handle existing users)
    const roleInsertData: any = {
      user_id: authData.user.id,
      role: userData.role,
      assigned_by: userData.createdBy
    }

    // Assign school ID for all roles if provided
    if (schoolId) {
      roleInsertData.school_id = schoolId
    }

    console.log('Upserting role with data:', roleInsertData)
    
    // Delete existing roles for this user first to avoid conflicts
    if (isExistingUser) {
      console.log('Deleting existing roles for user:', authData.user.id)
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', authData.user.id)
    }

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert(roleInsertData)

    if (roleError) {
      console.error('Role insertion error:', roleError)
      throw roleError
    }

    // Add role-specific details (upsert to handle existing users)
    console.log('Adding/updating role-specific details for:', userData.role)
    if (userData.role === 'driver') {
      // Delete existing driver details if user exists
      if (isExistingUser) {
        await supabaseAdmin
          .from('driver_details')
          .delete()
          .eq('user_id', authData.user.id)
      }

      const { error: driverError } = await supabaseAdmin
        .from('driver_details')
        .insert({
          user_id: authData.user.id,
          license_number: userData.licenseNumber,
          experience_years: userData.experienceYears ? parseInt(userData.experienceYears) : null,
          van_assigned: userData.vanAssigned || null,
          route_assigned: userData.routeAssigned || null
        })

      if (driverError) {
        console.error('Driver details error:', driverError)
        throw driverError
      }
    } else if (userData.role === 'parent') {
      // Delete existing parent details if user exists
      if (isExistingUser) {
        await supabaseAdmin
          .from('parent_details')
          .delete()
          .eq('user_id', authData.user.id)
      }

      const { error: parentError } = await supabaseAdmin
        .from('parent_details')
        .insert({
          user_id: authData.user.id,
          children_count: parseInt(userData.childrenCount),
          address: userData.address || null,
          emergency_contact: userData.emergencyContact || null
        })

      if (parentError) {
        console.error('Parent details error:', parentError)
        throw parentError
      }
    }

    const actionMessage = isExistingUser ? 'updated' : 'created'
    console.log(`User ${actionMessage} successfully:`, authData.user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        tempPassword: tempPassword,
        isExistingUser: isExistingUser,
        message: `User ${actionMessage} successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error occurred',
        details: error?.toString() || 'No details available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})