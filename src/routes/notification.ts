import { verifyJWToken } from "@/middlewares/common";
import Notification from "@/models/Notification";
import { generateErrorMesaage } from "@/utils/common";
import { makeNotificationKeysetRequest } from "@/utils/notification";
import { Router } from "express";

const NotificationRouter = Router();

NotificationRouter.get("/new", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const { lastCreatedAt } = req.query;

    const notifications = await makeNotificationKeysetRequest(
      userId,
      false,
      lastCreatedAt as string | undefined,
    );

    res.status(200).send(notifications);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.get("/read", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const { lastCreatedAt } = req.query;

    const notifications = await makeNotificationKeysetRequest(
      userId,
      true,
      lastCreatedAt as string | undefined,
    );

    res.status(200).send(notifications);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.post("/read", verifyJWToken, async (req, res) => {
  try {
    const notificationsIds = req.body.notifications;

    const bulkOperations = notificationsIds.map((_id: string) => ({
      updateOne: {
        filter: { _id: _id },
        update: { $set: { isRead: true } },
      },
    }));

    await Notification.bulkWrite(bulkOperations);

    res
      .status(200)
      .send(`Notifications ${notificationsIds.join(", ")} have been read`);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.post("/delete", verifyJWToken, async (req, res) => {
  try {
    const notificationsIds = req.body.notifications;

    const bulkOperations = notificationsIds.map((_id: string) => ({
      deleteOne: {
        filter: { _id: _id },
      },
    }));

    await Notification.bulkWrite(bulkOperations);

    res
      .status(200)
      .send(`Notifications ${notificationsIds.join(", ")} have been removed.`);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

export default NotificationRouter;
