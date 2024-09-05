import { Router } from "express";
import Message from "@/models/Message";
import { generateErrorMesaage } from "@/utils/common";
import {
  checkIfTenant,
  fetchUserFromTokenData,
  verifyJWToken,
} from "@/middlewares/common";
import {
  validateInitialMessageRequestBody,
  validateMessageEntities,
} from "@/middlewares/message";
import Chat from "@/models/Chat";

const MessageRouter = Router();

MessageRouter.post(
  "/initial",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfTenant,
  validateInitialMessageRequestBody,
  validateMessageEntities,
  async (req, res) => {
    try {
      const { sender, receiver } = req.body;
      const newChat = new Chat({
        parties: [sender, receiver],
        messages: [],
      });
      const message = new Message({
        ...req.body,
        chat: newChat.id,
      });

      newChat.messages.push(message.id);
      await message.save();
      await newChat.save();

      const chatDocument = await Chat.findById(newChat.id).populate(
        "parties messages",
      );
      res.status(200).send(chatDocument);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default MessageRouter;
