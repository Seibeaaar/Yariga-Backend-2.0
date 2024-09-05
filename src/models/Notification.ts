import { NOTIFICATION_TYPE } from "@/types/notification";
import { Schema, model } from "mongoose";

export const NotificationSchema = new Schema({
  createdAt: {
    type: String,
    default: new Date().toISOString(),
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: Object.values(NOTIFICATION_TYPE),
    },
  },
});

export default model("Notification", NotificationSchema);
