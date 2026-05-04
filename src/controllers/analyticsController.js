import { StatusCodes } from "http-status-codes";

import { AnalyticsEvent } from "../models/AnalyticsEvent.js";
import { Note } from "../models/Note.js";
import { User } from "../models/User.js";
import { WorkspaceInvite } from "../models/WorkspaceInvite.js";

const sensitiveKeyPattern = /(password|token|secret|card|payment|jwt|authorization|cookie)/i;
const trackedSummaryEvents = {
  landing_page_view: "landingPageViews",
  click_register: "registerClicks",
  click_login: "loginClicks",
  click_upgrade: "upgradeClicks"
};

const sanitizeMetadata = (value, depth = 0) => {
  if (depth > 2 || value === null || value === undefined) {
    return undefined;
  }

  if (["string", "number", "boolean"].includes(typeof value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeMetadata(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !sensitiveKeyPattern.test(key))
        .slice(0, 25)
        .map(([key, item]) => [key, sanitizeMetadata(item, depth + 1)])
        .filter(([, item]) => item !== undefined)
    );
  }

  return undefined;
};

export const createAnalyticsEvent = async (req, res) => {
  const event = await AnalyticsEvent.create({
    userId: req.user?._id || null,
    anonymousId: req.user ? "" : req.body.anonymousId || "",
    eventName: req.body.eventName,
    eventType: req.body.eventType,
    path: req.body.path || "",
    metadata: sanitizeMetadata(req.body.metadata) || {}
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      id: event._id.toString()
    }
  });
};

export const getAnalyticsSummary = async (_req, res) => {
  const [
    totalEvents,
    summaryCounts,
    commonPaths,
    totalUsers,
    totalNotes,
    invitesSent,
    invitesAccepted,
    aiUsage
  ] = await Promise.all([
    AnalyticsEvent.countDocuments(),
    AnalyticsEvent.aggregate([
      {
        $match: {
          eventName: { $in: Object.keys(trackedSummaryEvents) }
        }
      },
      {
        $group: {
          _id: "$eventName",
          count: { $sum: 1 }
        }
      }
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          path: { $ne: "" }
        }
      },
      {
        $group: {
          _id: "$path",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    User.countDocuments(),
    Note.countDocuments(),
    WorkspaceInvite.countDocuments(),
    WorkspaceInvite.countDocuments({ status: "accepted" }),
    User.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: "$aiUsageCount" }
        }
      }
    ])
  ]);

  const counts = {
    landingPageViews: 0,
    registerClicks: 0,
    loginClicks: 0,
    upgradeClicks: 0
  };

  for (const item of summaryCounts) {
    counts[trackedSummaryEvents[item._id]] = item.count;
  }

  return res.json({
    success: true,
    data: {
      totalEvents,
      totalUsers,
      totalNotes,
      invitesSent,
      invitesAccepted,
      aiUsageCount: aiUsage[0]?.count || 0,
      ...counts,
      mostCommonPaths: commonPaths.map((item) => ({
        path: item._id,
        count: item.count
      }))
    }
  });
};
