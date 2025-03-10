import { verifyJWToken } from "@/middlewares/common";
import Notification from "@/models/Notification";
import { generateErrorMesaage } from "@/utils/common";
import { retrieveNotificationsBatch } from "@/utils/notification";
import { Router } from "express";

const NotificationRouter = Router();

NotificationRouter.get("/new", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const { lastCreatedAt } = req.query;

    const notificationsFetchResult = await retrieveNotificationsBatch({
      receiver: userId,
      lastCreatedAt: lastCreatedAt as string | undefined,
      isRead: false,
    });

    res.status(200).send(notificationsFetchResult);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.get("/read", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const { lastCreatedAt } = req.query;

    const notificationsFetchResult = await retrieveNotificationsBatch({
      receiver: userId,
      lastCreatedAt: lastCreatedAt as string | undefined,
      isRead: true,
    });

    res.status(200).send(notificationsFetchResult);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.put("/read", verifyJWToken, async (req, res) => {
  try {
    const { notificationsIds } = req.body;

    const bulkOperations = notificationsIds.map((_id: string) => ({
      updateOne: {
        filter: { _id: _id },
        update: { $set: { isRead: true } },
      },
    }));

    await Notification.bulkWrite(bulkOperations);

    res
      .status(200)
      .send(
        `Notifications ${notificationsIds.join(", ")} have been read successfully.`,
      );
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.put("/readAll", verifyJWToken, async (req, res) => {
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

NotificationRouter.delete("/deleteRead", verifyJWToken, async (req, res) => {
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
