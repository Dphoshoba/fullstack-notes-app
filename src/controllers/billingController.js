import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";

import { env } from "../config/env.js";
import { AI_USAGE_LIMITS, User } from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { ApiError } from "../utils/ApiError.js";

const getClientOrigin = () => env.CLIENT_ORIGIN.split(",")[0];

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "Stripe is not configured");
  }

  return new Stripe(env.STRIPE_SECRET_KEY);
};

const getCheckoutCustomerId = (session) =>
  typeof session.customer === "string" ? session.customer : session.customer?.id;

export const createCheckoutSession = async (req, res) => {
  if (!env.STRIPE_PRICE_ID) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "Stripe price is not configured");
  }

  const stripe = getStripe();
  const clientOrigin = getClientOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: 1
      }
    ],
    customer_email: req.user.email,
    client_reference_id: req.user.id,
    metadata: {
      userId: req.user.id,
      plan: "premium"
    },
    success_url: `${clientOrigin}/?billing=success`,
    cancel_url: `${clientOrigin}/?billing=cancelled`
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      checkoutUrl: session.url
    }
  });
};

export const getBillingStatus = async (req, res) => {
  const plan = req.user.plan || "free";

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      plan,
      billingStatus: plan === "premium" ? "active" : "free"
    }
  });
};

export const createPortalSession = async (req, res) => {
  if ((req.user.plan || "free") !== "premium") {
    throw new ApiError(StatusCodes.FORBIDDEN, "Billing portal is available for premium users only");
  }

  const stripe = getStripe();
  const clientOrigin = getClientOrigin();
  let customerId = req.user.stripeCustomerId;

  if (!customerId) {
    const customers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });
    customerId = customers.data[0]?.id;

    if (customerId) {
      await User.findByIdAndUpdate(req.user.id, { stripeCustomerId: customerId });
    }
  }

  if (!customerId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Stripe customer could not be found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: clientOrigin
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      portalUrl: session.url
    }
  });
};

export const handleStripeWebhook = async (req, res) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "Stripe webhook is not configured");
  }

  const stripe = getStripe();
  const signature = req.get("stripe-signature");
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Stripe webhook signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId || session.client_reference_id;
    const stripeCustomerId = getCheckoutCustomerId(session);

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        plan: "premium",
        aiUsageLimit: AI_USAGE_LIMITS.premium,
        ...(stripeCustomerId ? { stripeCustomerId } : {})
      });
      await createNotification({
        userId,
        type: "subscription_upgrade",
        message: "Your subscription was upgraded to Premium."
      });
    }
  }

  return res.status(StatusCodes.OK).json({ received: true });
};
