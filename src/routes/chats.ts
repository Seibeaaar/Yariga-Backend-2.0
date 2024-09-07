import { verifyJWToken } from "@/middlewares/common";
import { generateErrorMesaage } from "@/utils/common";
import Chat from "@/models/Chat";
import { Router } from "express";
import { checkChatIdParam, checkIsChatParty } from "@/middlewares/chat";
import Message from "@/models/Message";

const ChatRouter = Router();

ChatRouter.get("/", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const chats = await Chat.find({
      parties: { $in: [userId] },
    }).populate("parties messages");
    res.status(200).send(chats);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

ChatRouter.delete(
  "/:id",
  verifyJWToken,
  checkChatIdParam,
  checkIsChatParty,
  async (req, res) => {
    try {
      const { chat } = res.locals;
      await Chat.findByIdAndDelete(chat.id);
      await Message.deleteMany({
        chat: chat.id,
      });

      res.status(200).send(`Chat ${chat.id} was deleted successfully`);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

ChatRouter.put(
  "/:id/read",
  verifyJWToken,
  checkChatIdParam,
  checkIsChatParty,
  async (req, res) => {
    try {
      const { userId, chat } = res.locals;
      await Message.updateMany(
        {
          chat: chat.id,
          isRead: false,
          receiver: userId,
        },
        {
          $set: { isRead: true },
        },
      );

      res.status(200).send("Chat messages are marked as read");
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default ChatRouter;
