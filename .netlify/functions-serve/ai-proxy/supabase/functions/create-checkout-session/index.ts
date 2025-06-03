import { serve } from "npm:http/server";
import Stripe from "npm:stripe@13.10.0";
import { createMockCheckoutSession } from "../../src/utils/mockData.ts";

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
    // Parse request body
    const { priceId, customerId, successUrl, cancelUrl, userId } = await req.json();

    if (!priceId) {
      throw new Error("Price ID is required");
    }

    if (!successUrl || !cancelUrl) {
      throw new Error("Success and cancel URLs are required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // If in mock mode, return mock data
    if (MOCK_MODE) {
      console.log("Using mock mode for create-checkout-session");
      
      // Create mock checkout session
      const mockSession = createMockCheckoutSession(priceId, customerId, { userId });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return new Response(JSON.stringify({ 
        sessionId: mockSession.id, 
        url: successUrl + '?session_id=' + mockSession.id 
      }), {
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

    // Create checkout session parameters
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
      },
    };

    // If customer ID is provided, use it
    if (customerId) {
      params.customer = customerId;
    } else {
      params.customer_creation = 'always';
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(params);

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});