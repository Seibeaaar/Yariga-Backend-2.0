import { Request, Response, NextFunction } from "express";
import Chat from "@/models/Chat";
import { generateErrorMesaage } from "@/utils/common";
import { isValidObjectId } from "mongoose";

export const checkChatIdParam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      res.statusCode = 400;
      throw new Error("Please provide a valid chat id");
    }

    const chat = await Chat.findById(id);
    if (!chat) {
      throw new Error(`Chat with id ${id} not found`);
    }
    res.locals.chat = chat;
    next();
  } catch (e) {
    res.send(generateErrorMesaage(e));
  }
};

export const checkIsChatParty = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { chat, userId } = res.locals;
    if (!chat.parties.includes(userId)) {
      throw new Error("You are not a chat party");
    }

    next();
  } catch (e) {
    res.status(403).send(generateErrorMesaage(e));
  }
};
