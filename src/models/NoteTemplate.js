import mongoose from "mongoose";

const noteTemplateSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80
    },
    noteType: {
      type: String,
      enum: ["standard", "meeting"],
      default: "standard",
      index: true
    },
    category: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "General"
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ""
    },
    body: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: ""
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

export const NoteTemplate = mongoose.model("NoteTemplate", noteTemplateSchema);
