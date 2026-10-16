import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";

import { env } from "../config/env.js";
import { AI_USAGE_LIMITS, User } from "../models/User.js";
import { sendBillingIssueEmail, sendPremiumUpgradeEmail } from "../services/emailService.js";
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

const getEventCustomerId = (object) =>
  typeof object.customer === "string" ? object.customer : object.customer?.id;

const getEventSubscriptionId = (object) => {
  if (typeof object.subscription === "string") {
    return object.subscription;
  }

  if (object.subscription?.id) {
    return object.subscription.id;
  }

  return object.object === "subscription" ? object.id : "";
};

const getCheckoutSubscriptionId = (session) =>
  typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

const findUserForBillingObject = async (object) => {
  const userId = object.metadata?.userId || object.client_reference_id;

  if (userId) {
    return User.findById(userId);
  }

  const stripeSubscriptionId = getEventSubscriptionId(object);
  if (stripeSubscriptionId) {
    const user = await User.findOne({ stripeSubscriptionId });
    if (user) {
      return user;
    }
  }

  const stripeCustomerId = getEventCustomerId(object);
  return stripeCustomerId ? User.findOne({ stripeCustomerId }) : null;
};

const setUserPlan = async (userId, plan, extraUpdates = {}) =>
  User.findByIdAndUpdate(
    userId,
    {
      plan,
      aiUsageLimit: AI_USAGE_LIMITS[plan] ?? AI_USAGE_LIMITS.free,
      ...extraUpdates
    },
    { new: true }
  );

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
    const stripeSubscriptionId = getCheckoutSubscriptionId(session);

    if (userId) {
      const user = await setUserPlan(userId, "premium", {
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        ...(stripeSubscriptionId ? { stripeSubscriptionId } : {})
      });
      await createNotification({
        userId,
        type: "subscription_upgrade",
        title: "Premium upgrade successful",
        message: "Your subscription was upgraded to Premium.",
        metadata: {
          stripeCustomerId: stripeCustomerId || ""
        }
      });
      if (user?.email) {
        void sendPremiumUpgradeEmail({
          to: user.email,
          userName: user.name
        });
      }
    }
  }

  if (event.type === "invoice.payment_failed" || event.type === "customer.subscription.deleted") {
    const user = await findUserForBillingObject(event.data.object);

    if (user?.email) {
      await createNotification({
        userId: user.id,
        type: "billing_issue",
        title: "Billing issue",
        message: "There is a billing issue on your account. Please review your subscription.",
        metadata: {
          stripeCustomerId: user.stripeCustomerId || ""
        }
      });
      void sendBillingIssueEmail({
        to: user.email,
        userName: user.name
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const user = await findUserForBillingObject(event.data.object);

    if (user) {
      await setUserPlan(user.id, "free", {
        stripeSubscriptionId: ""
      });
    }
  }

  return res.status(StatusCodes.OK).json({ received: true });
};
