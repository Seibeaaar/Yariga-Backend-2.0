import { Schema, model } from "mongoose";
import { AUTH_PROVIDER, USER_ROLE } from "@/types/user";
import { MAX_RATING, MIN_RATING } from "@/constants/common";
import { PropertyPreferences } from "./Preferences";

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    trim: true,
    default: null,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  rating: {
    type: Number,
    min: MIN_RATING,
    max: MAX_RATING,
    default: MIN_RATING,
  },
  votes: {
    type: Number,
    default: 0,
  },
  role: {
    type: Number,
    enum: {
      values: Object.values(USER_ROLE),
    },
  },
  provider: {
    type: Number,
    enum: {
      values: Object.values(AUTH_PROVIDER),
    },
  },
  tenants: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: undefined,
  },
  properties: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
    default: undefined,
  },
  preferences: {
    type: PropertyPreferences,
  },
  joinedAt: {
    type: String,
    default: new Date().toISOString(),
  },
  updatedAt: {
    type: String,
    default: null,
  },
});

export default model("User", UserSchema);
