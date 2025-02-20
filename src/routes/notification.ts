import { verifyJWToken } from "@/middlewares/common";
import Notification from "@/models/Notification";
import { generateErrorMesaage } from "@/utils/common";
import { makeNotificationKeysetRequest } from "@/utils/notification";
import { Router } from "express";

const NotificationRouter = Router();

NotificationRouter.get("/new", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;

    const notificationsFetchResult = await makeNotificationKeysetRequest(
      userId,
      false,
    );

    res.status(200).send(notificationsFetchResult);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.get("/read", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;

    const notificationsFetchResult = await makeNotificationKeysetRequest(
      userId,
      true,
    );

    res.status(200).send(notificationsFetchResult);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.post("/read", verifyJWToken, async (req, res) => {
  try {
    const { notificationIds, lastCreatedAt } = req.body;
    const { userId } = res.locals;

    const bulkOperations = notificationIds.map((_id: string) => ({
      updateOne: {
        filter: { _id: _id },
        update: { $set: { isRead: true } },
      },
    }));

    await Notification.bulkWrite(bulkOperations);

    const notificationsFetchResult = await makeNotificationKeysetRequest(
      userId,
      false,
      lastCreatedAt,
    );

    res.status(200).send(notificationsFetchResult);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.post("/readAll", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;

    await Notification.updateMany(
      { receiver: userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).send(`All new notifications have been read.`);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.post("/clear", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;

    await Notification.deleteMany({
      receiver: userId,
      isRead: true,
    });

    res.status(200).send(`Read notifications have been removed.`);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

export default NotificationRouter;
