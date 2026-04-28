import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";

import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const getClientOrigin = () => env.CLIENT_ORIGIN.split(",")[0];

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "Stripe is not configured");
  }

  return new Stripe(env.STRIPE_SECRET_KEY);
};

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

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        plan: "premium",
        aiUsageLimit: 100000
      });
    }
  }

  return res.status(StatusCodes.OK).json({ received: true });
};
