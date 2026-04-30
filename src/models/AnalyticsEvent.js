import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    anonymousId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
      index: true
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      index: true
    },
    path: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ eventName: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);
