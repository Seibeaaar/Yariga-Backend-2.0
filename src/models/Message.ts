import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  chat: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
  },
  createdAt: {
    type: String,
    default: new Date().toISOString(),
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  updatedAt: {
    type: String,
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
});

export default model("Message", MessageSchema);
