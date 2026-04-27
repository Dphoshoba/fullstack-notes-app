import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    pinned: {
      type: Boolean,
      default: false
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

noteSchema.index({ title: "text", body: "text", tags: "text" });

export const Note = mongoose.model("Note", noteSchema);
