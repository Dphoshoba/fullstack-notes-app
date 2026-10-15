import mongoose from "mongoose";

const noteHistorySchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    changeType: {
      type: String,
      enum: ["update", "restore"],
      default: "update"
    },
    snapshot: {
      title: String,
      body: String,
      tags: [String],
      category: String,
      noteType: String,
      meetingMeta: mongoose.Schema.Types.Mixed,
      visibility: String,
      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null
      },
      pinned: Boolean,
      starred: Boolean,
      updatedAt: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const output = /** @type {Record<string, any>} */ (ret);
        output.id = String(output._id);
        delete output._id;
        delete output.__v;
        return output;
      }
    }
  }
);

noteHistorySchema.index({ noteId: 1, createdAt: -1 });

export const NoteHistory = mongoose.model("NoteHistory", noteHistorySchema);
