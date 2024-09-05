import { verifyJWToken } from "@/middlewares/common";
import { generateErrorMesaage } from "@/utils/common";
import Chat from "@/models/Chat";
import { Router } from "express";

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

export default ChatRouter;
