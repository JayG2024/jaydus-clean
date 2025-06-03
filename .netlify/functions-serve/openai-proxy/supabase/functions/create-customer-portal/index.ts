import { serve } from "npm:http/server";
import Stripe from "npm:stripe@13.10.0";
import { createMockCustomerPortalSession } from "../../src/utils/mockData.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Check if using mock mode
const MOCK_MODE = !Deno.env.has("STRIPE_SECRET_KEY") || Deno.env.get("MOCK_MODE") === "true";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get request body
    const { customerId, returnUrl } = await req.json();

    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const defaultReturnUrl = "https://platform.jaydus.com/settings";
    const effectiveReturnUrl = returnUrl || defaultReturnUrl;
    
    // If in mock mode, return mock data
    if (MOCK_MODE) {
      console.log("Using mock mode for create-customer-portal");
      
      // Create mock portal session
      const mockSession = createMockCustomerPortalSession(customerId, effectiveReturnUrl);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return new Response(JSON.stringify({ url: mockSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable not set");
    }

    // Create a Stripe instance with the secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: effectiveReturnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});