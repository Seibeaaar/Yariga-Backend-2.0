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
  validateMessageParties,
  validateMessagingChat,
  validateMessageRequestBody,
  checkMessageIdParam,
  checkIsMessageSender,
} from "@/middlewares/message";
import Chat from "@/models/Chat";
import { checkIsChatParty } from "@/middlewares/chat";

const MessageRouter = Router();

MessageRouter.post(
  "/initial",
  verifyJWToken,
  fetchUserFromTokenData,
  checkIfTenant,
  validateInitialMessageRequestBody,
  validateMessageParties,
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

MessageRouter.post(
  "/send",
  verifyJWToken,
  fetchUserFromTokenData,
  validateMessageRequestBody,
  validateMessageParties,
  validateMessagingChat,
  checkIsChatParty,
  async (req, res) => {
    try {
      const message = new Message(req.body);
      await message.save();

      await Chat.findByIdAndUpdate(req.body.chat, {
        $push: {
          messages: message.id,
        },
      });

      res.status(201).send(message);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

MessageRouter.post(
  "/:id/reply",
  verifyJWToken,
  fetchUserFromTokenData,
  validateMessageRequestBody,
  validateMessageRequestBody,
  validateMessagingChat,
  checkIsChatParty,
  checkMessageIdParam,
  async (req, res) => {
    try {
      const { message: parent } = res.locals;

      const reply = new Message({
        ...req.body,
        parent: parent.id,
      });
      await reply.save();

      await Chat.findByIdAndUpdate(req.body.chat, {
        $push: {
          messages: reply.id,
        },
      });

      const replyDoc = await Message.findById(reply.id).populate("parent");
      res.status(201).send(replyDoc);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

MessageRouter.delete(
  "/:id",
  verifyJWToken,
  fetchUserFromTokenData,
  checkMessageIdParam,
  checkIsMessageSender,
  async (req, res) => {
    try {
      const { message } = res.locals;
      await Message.findByIdAndDelete(message.id);
      await Chat.findByIdAndUpdate(message.chat, {
        $pull: {
          messages: message.od,
        },
      });
      await Message.updateMany(
        {
          parent: message.id,
        },
        {
          $set: {
            parent: null,
          },
        },
      );

      res.status(200).send(`Messagec ${message.id} was deleted successfully`);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

MessageRouter.put(
  "/:id/update",
  verifyJWToken,
  fetchUserFromTokenData,
  checkMessageIdParam,
  checkIsMessageSender,
  validateMessageRequestBody,
  validateMessageParties,
  validateMessagingChat,
  async (req, res) => {
    try {
      const { id } = req.params;
      const message = await Message.findByIdAndUpdate(
        id,
        {
          ...req.body,
          updatedAt: new Date().toISOString(),
        },
        { new: true },
      ).populate("parent");

      res.status(200).send(message);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

MessageRouter.put(
  "/:id/read",
  verifyJWToken,
  checkMessageIdParam,
  checkIsChatParty,
  async (req, res) => {
    try {
      const { id } = req.params;
      await Message.findByIdAndUpdate(
        id,
        {
          isRead: true,
        },
        { new: true },
      );

      res.status(200).send(`Message ${id} is marked as read`);
    } catch (e) {
      res.status(500).send(generateErrorMesaage(e));
    }
  },
);

export default MessageRouter;
