import { Schema, model } from "mongoose";
import { AUTH_PROVIDER, USER_ROLE } from "@/types/user";

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
    min: 0,
    max: 5,
    default: 0,
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
    type: Object,
    default: undefined,
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
