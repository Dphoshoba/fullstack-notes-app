import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const USER_ROLES = ["user", "admin", "superadmin"];
export const USER_PLANS = ["free", "premium"];
export const WORKSPACE_ROLES = ["owner", "manager", "staff"];
export const AI_USAGE_LIMITS = {
  free: 5,
  premium: 100000
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      maxlength: 120
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "user"
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },
    workspaceRole: {
      type: String,
      enum: WORKSPACE_ROLES,
      default: "staff"
    },
    preferredLanguage: {
      type: String,
      default: "en",
      trim: true,
      maxlength: 10
    },
    defaultNoteScope: {
      type: String,
      enum: ["private", "workspace"],
      default: "private"
    },
    plan: {
      type: String,
      enum: USER_PLANS,
      default: "free"
    },
    aiUsageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    aiUsageLimit: {
      type: Number,
      default: AI_USAGE_LIMITS.free,
      min: 0
    },
    stripeCustomerId: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.stripeCustomerId;
        return ret;
      }
    }
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
