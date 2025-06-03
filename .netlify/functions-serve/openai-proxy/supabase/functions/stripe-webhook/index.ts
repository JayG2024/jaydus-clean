import { serve } from "npm:http/server";
import Stripe from "npm:stripe@13.10.0";
import { createClient } from "npm:@supabase/supabase-js";
import { mockWebhookEvents } from "../../src/utils/mockData.ts";

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
    if (MOCK_MODE) {
      console.log("Using mock mode for stripe-webhook");
      
      // Parse request to get webhook type
      let body;
      try {
        body = await req.json();
      } catch (e) {
        // If parsing fails, use checkout.session.completed as default
        body = { type: "checkout.session.completed" };
      }

      const eventType = body.type || "checkout.session.completed";
      
      // Get corresponding mock event
      const mockEvent = mockWebhookEvents[eventType as keyof typeof mockWebhookEvents] || 
                       mockWebhookEvents["checkout.session.completed"];
      
      console.log(`Mock webhook processed: ${eventType}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return new Response(JSON.stringify({ received: true, mock: true, event: eventType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable not set");
    }

    // Get the signature from the request headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create a Stripe instance with the secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get the raw body as text
    const body = await req.text();

    // Get the webhook signing secret
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable not set");
    }

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object;
        
        // Extract customer info
        const customerId = checkoutSession.customer;
        const subscriptionId = checkoutSession.subscription;
        const metadata = checkoutSession.metadata || {};
        const userId = metadata.userId;
        
        if (!userId) {
          throw new Error("No user ID provided in session metadata");
        }
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planId = subscription.items.data[0].price.id;
        
        // Determine plan level based on price ID
        let planLevel = "free";
        if (planId === "price_real_monthly_basic") {
          planLevel = "pro";
        } else if (planId === "price_real_monthly_premium") {
          planLevel = "business";
        } else if (planId === "price_real_monthly_enterprise") {
          planLevel = "enterprise";
        }
        
        // Update user subscription in database
        const { error } = await supabase
          .from("users")
          .update({
            subscription: planLevel,
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        
        if (error) {
          console.error("Error updating user subscription:", error);
          throw error;
        }
        
        break;
      }
      
      case "customer.subscription.updated": {
        const updatedSubscription = event.data.object;
        const status = updatedSubscription.status;
        const stripeCustomerId = updatedSubscription.customer;
        
        // Find user with this customer ID
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", stripeCustomerId);
        
        if (userError) {
          console.error("Error finding user:", userError);
          throw userError;
        }
        
        if (!users || users.length === 0) {
          throw new Error(`No user found with Stripe customer ID ${stripeCustomerId}`);
        }
        
        // Update subscription status for all matching users
        for (const user of users) {
          const { error: updateError } = await supabase
            .from("users")
            .update({
              subscription_status: status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
          
          if (updateError) {
            console.error(`Error updating subscription status for user ${user.id}:`, updateError);
            throw updateError;
          }
        }
        
        break;
      }
      
      case "customer.subscription.deleted": {
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer;
        
        // Find user with this customer ID
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", deletedCustomerId);
        
        if (userError) {
          console.error("Error finding user:", userError);
          throw userError;
        }
        
        if (!users || users.length === 0) {
          throw new Error(`No user found with Stripe customer ID ${deletedCustomerId}`);
        }
        
        // Update user to free plan and mark subscription as canceled
        for (const user of users) {
          const { error: updateError } = await supabase
            .from("users")
            .update({
              subscription: "free",
              subscription_status: "canceled",
              updated_at: new Date().toISOString(),
              // Don't remove the customer ID so they can resubscribe later
            })
            .eq("id", user.id);
          
          if (updateError) {
            console.error(`Error canceling subscription for user ${user.id}:`, updateError);
            throw updateError;
          }
        }
        
        break;
      }
      
      case "invoice.payment_failed": {
        const failedInvoice = event.data.object;
        const customerId = failedInvoice.customer;
        
        // Find user with this customer ID
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id, email")
          .eq("stripe_customer_id", customerId);
        
        if (userError) {
          console.error("Error finding user:", userError);
          throw userError;
        }
        
        if (!users || users.length === 0) {
          throw new Error(`No user found with Stripe customer ID ${customerId}`);
        }
        
        // Update subscription status to past_due
        for (const user of users) {
          const { error: updateError } = await supabase
            .from("users")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
          
          if (updateError) {
            console.error(`Error updating subscription status for user ${user.id}:`, updateError);
            throw updateError;
          }
          
          // Here you would normally send an email to the user
          console.log(`Payment failed for user ${user.email}. Invoice ID: ${failedInvoice.id}`);
        }
        
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});