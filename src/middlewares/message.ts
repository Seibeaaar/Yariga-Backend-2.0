import { Request, Response, NextFunction } from "express";
import Message from "@/models/Message";
import {
  INITIAL_MESSAGE_VALIDATOR,
  MESSAGE_VALIDATOR,
} from "@/validators/message";
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

export const validateMessageRequestBody = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await MESSAGE_VALIDATOR.validate(req.body);
    next();
  } catch (e) {
    res.status(400).send(generateErrorMesaage(e));
  }
};

export const validateMessageParties = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.statusCode = 404;
    const { sender: senderId, receiver: receiverId } = req.body;

    const sender = await User.findById(senderId);
    if (!sender) {
      throw new Error(`No user with if ${senderId} found.`);
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new Error(`Receiver with id ${receiverId} not found.`);
    }

    if (receiver.role === sender.role) {
      res.statusCode = 403;
      throw new Error("Users with the same role cannot chat");
    }

    next();
  } catch (e) {
    res.send(generateErrorMesaage(e));
  }
};

export const validateMessagingChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { chat: chatId } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error(`No chat with id ${chatId} found.`);
    }
    res.locals.chat = chat;

    next();
  } catch (e) {
    res.status(404).send(generateErrorMesaage(e));
  }
};

export const checkMessageIdParam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      throw new Error(`No message with id ${req.params.id} found`);
    }
    res.locals.message = message;
    next();
  } catch (e) {
    res.status(404).send(generateErrorMesaage(e));
  }
};

export const checkIsMessageSender = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { message, userId } = res.locals;
    if (!message.sender.equals(userId)) {
      throw new Error("Only sender is allowed to perform such operation");
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};
