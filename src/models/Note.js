import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },
    visibility: {
      type: String,
      enum: ["private", "workspace"],
      default: "private",
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000
    },
    tags: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      default: "General",
      index: true
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true
    },
    starred: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

noteSchema.index({ title: "text", body: "text", tags: "text", category: "text" });
noteSchema.index({ owner: 1, createdAt: -1 });
noteSchema.index({ owner: 1, category: 1, createdAt: -1 });
noteSchema.index({ owner: 1, starred: 1, createdAt: -1 });
noteSchema.index({ owner: 1, pinned: 1, updatedAt: -1 });
noteSchema.index({ organizationId: 1, createdAt: -1 });
noteSchema.index({ organizationId: 1, category: 1, createdAt: -1 });

export const Note = mongoose.model("Note", noteSchema);
