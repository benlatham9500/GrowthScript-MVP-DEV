
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    
    // Try to get user with better error handling
    let user;
    try {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) {
        logStep("User authentication failed", { error: userError.message });
        throw new Error(`Authentication error: ${userError.message}`);
      }
      user = userData.user;
      if (!user?.email) throw new Error("User not authenticated or email not available");
      logStep("User authenticated", { userId: user.id, email: user.email });
    } catch (authError) {
      logStep("Authentication failed, trying to get user from database", { error: authError });
      // If JWT auth fails, try to get user info from the token claims
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) {
          // Get user from database using email
          const { data: dbUser, error: dbError } = await supabaseClient
            .from('users')
            .select('_id, email')
            .eq('email', payload.email)
            .single();
          
          if (dbError || !dbUser) {
            throw new Error("Could not find user in database");
          }
          
          user = { id: dbUser._id, email: dbUser.email };
          logStep("User found in database", { userId: user.id, email: user.email });
        } else {
          throw new Error("No email found in token");
        }
      } catch (fallbackError) {
        logStep("Fallback authentication also failed", { error: fallbackError });
        throw new Error("Authentication failed completely");
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/billing`,
      });
      logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      logStep("Stripe portal creation failed", { error: stripeError.message });
      
      // If portal creation fails, redirect to billing page with a helpful message
      if (stripeError.message.includes("configuration")) {
        return new Response(JSON.stringify({ 
          error: "Portal not configured",
          redirect_url: `${origin}/billing`,
          message: "Customer portal is not configured in Stripe. Redirecting to billing page."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      throw stripeError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
