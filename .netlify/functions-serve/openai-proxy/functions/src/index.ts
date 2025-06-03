import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Stripe
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
});

// Create a checkout session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl, userId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: "Success and cancel URLs are required" 
      });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Create checkout session parameters
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
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
      params.customer_creation = "always";
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(params);

    return res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Create a customer portal session
app.post("/create-customer-portal-session", async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    if (!returnUrl) {
      return res.status(400).json({ error: "Return URL is required" });
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Process Stripe webhook
app.post("/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;
  
  if (!signature) {
    return res.status(400).json({ error: "No signature provided" });
  }

  try {
    const webhookSecret = functions.config().stripe.webhook_secret;
    const event = stripe.webhooks.constructEvent(
      req.rawBody, 
      signature, 
      webhookSecret
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        
        // Extract customer info
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;
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
        
        // Update user subscription in Firestore
        await db.collection("users").doc(userId).update({
          subscription: planLevel,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        break;
      }
        
      case "customer.subscription.updated": {
        const updatedSubscription = 
          event.data.object as Stripe.Subscription;
        const status = updatedSubscription.status;
        const stripeCustomerId = updatedSubscription.customer as string;
        
        // Find user with this customer ID
        const usersSnapshot = await db
          .collection("users")
          .where("stripeCustomerId", "==", stripeCustomerId)
          .get();
        
        if (usersSnapshot.empty) {
          throw new Error(
            `No user found with Stripe customer ID ${stripeCustomerId}`
          );
        }
        
        // Update subscription status
        await db.collection("users").doc(usersSnapshot.docs[0].id).update({
          subscriptionStatus: status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        break;
      }
        
      case "customer.subscription.deleted": {
        const deletedSubscription = 
          event.data.object as Stripe.Subscription;
        const deletedCustomerId = deletedSubscription.customer as string;
        
        // Find user with this customer ID
        const usersSnapshot = await db
          .collection("users")
          .where("stripeCustomerId", "==", deletedCustomerId)
          .get();
        
        if (usersSnapshot.empty) {
          throw new Error(
            `No user found with Stripe customer ID ${deletedCustomerId}`
          );
        }
        
        // Update user to free plan and mark subscription as canceled
        await db.collection("users").doc(usersSnapshot.docs[0].id).update({
          subscription: "free",
          subscriptionStatus: "canceled",
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Mount the Express app to a Firebase function
export const api = functions.https.onRequest(app);

// Function to update usage statistics
export const trackUsage = functions.https.onCall(
  async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated", 
        "You must be logged in to track usage."
      );
    }

    const { usageType, amount = 1 } = data;
    const userId = context.auth.uid;

    try {
      const usageRef = db.collection("usage").doc(userId);
      const usageDoc = await usageRef.get();
      
      // Initialize if not exists
      if (!usageDoc.exists) {
        await usageRef.set({
          aiCreditsUsed: 0,
          chatMessages: 0,
          imagesGenerated: 0,
          voiceMinutes: 0,
          storageUsed: 0,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Update the appropriate usage metric
      const updates: Record<string, any> = {
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Always increment AI credits
      updates.aiCreditsUsed = admin.firestore.FieldValue.increment(amount);
      
      // Increment specific usage metric based on type
      switch (usageType) {
        case "chat":
          updates.chatMessages = admin.firestore.FieldValue.increment(amount);
          break;
        case "image":
          updates.imagesGenerated = admin.firestore.FieldValue.increment(amount);
          break;
        case "voice":
          updates.voiceMinutes = admin.firestore.FieldValue.increment(amount);
          break;
        case "storage":
          updates.storageUsed = admin.firestore.FieldValue.increment(amount);
          break;
        default:
          break;
      }
      
      await usageRef.update(updates);
      
      return { success: true };
    } catch (error) {
      console.error("Error tracking usage:", error);
      throw new functions.https.HttpsError(
        "internal", 
        "An error occurred while tracking usage."
      );
    }
  }
);

// Function to check if a user has enough credits for an operation
export const checkCredits = functions.https.onCall(
  async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated", 
        "You must be logged in to check credits."
      );
    }

    const { operation, quantity = 1 } = data;
    const userId = context.auth.uid;

    try {
      // Credit costs per operation
      const creditCosts = {
        chat: 1,  // 1 credit per message
        image: 10, // 10 credits per image
        voice: 5,  // 5 credits per voice minute
      };
      
      // Get user's plan limits
      const userDoc = await db.collection("users").doc(userId).get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found", 
          "User not found"
        );
      }
      
      const userData = userDoc.data();
      const userPlan = userData?.subscription || "free";
      
      // Plan limits
      const planLimits = {
        free: 5000,
        pro: 50000,
        business: 150000,
        enterprise: 500000
      };
      
      // Get current usage
      const usageDoc = await db.collection("usage").doc(userId).get();
      const usage = usageDoc.exists ? usageDoc.data() : { aiCreditsUsed: 0 };
      
      // Calculate required credits
      const requiredCredits = 
        creditCosts[operation as keyof typeof creditCosts] * quantity;
      
      // Check if user has enough credits left
      const planLimit = 
        planLimits[userPlan as keyof typeof planLimits] || 5000;
      const remainingCredits = planLimit - (usage?.aiCreditsUsed || 0);
      
      return { 
        hasCredits: remainingCredits >= requiredCredits,
        remainingCredits,
        requiredCredits
      };
    } catch (error) {
      console.error("Error checking credits:", error);
      throw new functions.https.HttpsError(
        "internal", 
        "An error occurred while checking credits."
      );
    }
  }
);