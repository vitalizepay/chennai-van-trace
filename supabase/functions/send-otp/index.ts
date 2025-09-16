import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOtpRequest {
  mobile: string;
  purpose?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mobile, purpose = 'login' }: SendOtpRequest = await req.json();

    if (!mobile) {
      throw new Error('Mobile number is required');
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[+]?[1-9]\d{1,14}$/;
    if (!mobileRegex.test(mobile)) {
      throw new Error('Invalid mobile number format');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate OTP using database function
    const { data: otpCode, error: otpError } = await supabase.rpc('generate_otp', {
      _mobile: mobile,
      _purpose: purpose
    });

    if (otpError) {
      console.error('Error generating OTP:', otpError);
      throw new Error('Failed to generate OTP');
    }

    console.log(`Generated OTP for ${mobile}: ${otpCode}`);
    
    // For demo purposes, we'll just log the OTP
    // In production, you would integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS would be sent to ${mobile}: Your OTP is ${otpCode}. Valid for 5 minutes.`);

    // For demo, return success (in production, don't return the OTP!)
    return new Response(JSON.stringify({ 
      success: true,
      message: 'OTP sent successfully',
      // Remove this line in production:
      otp: otpCode // This is only for demo purposes
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send OTP',
        success: false 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);