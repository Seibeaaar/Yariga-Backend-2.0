import { Schema, model } from "mongoose";

const ChatSchema = new Schema({
  parties: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  createdAt: {
    type: String,
    default: new Date().toISOString(),
  },
});

export default model("Chat", ChatSchema);
