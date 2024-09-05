import { Request, Response, NextFunction } from "express";
import Message from "@/models/Message";
import { INITIAL_MESSAGE_VALIDATOR } from "@/validators/message";
import { generateErrorMesaage } from "@/utils/common";
import User from "@/models/User";
import Chat from "@/models/Chat";

export const validateInitialMessageRequestBody = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await INITIAL_MESSAGE_VALIDATOR.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateMessageEntities = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sender, receiver, chat, parent } = req.body;

    const senderDoc = await User.findById(sender);
    if (!senderDoc) {
      throw new Error(`No user with if ${sender} found.`);
    }

    const receiverDoc = await User.findById(receiver);
    if (!receiverDoc) {
      throw new Error(`Receiver with id ${receiver} not found.`);
    }

    if (chat) {
      const chatDoc = await Chat.findById(chat);
      if (!chatDoc) {
        throw new Error(`No chat with id ${chat} found.`);
      }
    }

    if (parent) {
      const parentMessage = await Message.findById(parent);
      if (!parentMessage) {
        throw new Error(`No message with id ${parent} found.`);
      }
    }

    next();
  } catch (e) {
    res.status(404).send(generateErrorMesaage(e));
  }
};
