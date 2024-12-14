import { MAX_LATEST_NOTIFICATIONS } from "@/constants/notification";
import { verifyJWToken } from "@/middlewares/common";
import Notification from "@/models/Notification";
import { NotificationDocument } from "@/types/notification";
import { generateErrorMesaage, makePaginatedRequest } from "@/utils/common";
import { Router } from "express";

const NotificationRouter = Router();

NotificationRouter.get("/", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const paginatedResponse = await makePaginatedRequest<NotificationDocument>({
      model: Notification,
      query: {
        receiver: userId,
      },
      page: req.query.page as string | undefined,
    });

    res.status(200).send(paginatedResponse);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.put("/read", verifyJWToken, async (req, res) => {
  try {
    const notificationsIds = req.body.notifications;
    await Notification.updateMany(
      {
        _id: {
          $in: notificationsIds,
        },
      },
      {
        $set: { isRead: true },
      },
    );
    res
      .status(200)
      .send(`Notifications ${notificationsIds.join(", ")} have been read`);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

NotificationRouter.get("/latest", verifyJWToken, async (req, res) => {
  try {
    const { userId } = res.locals;
    const latestNotifications = await Notification.find({
      receiver: userId,
    })
      .sort({ createdAt: -1 })
      .limit(MAX_LATEST_NOTIFICATIONS);

    res.status(200).send(latestNotifications);
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
});

export default NotificationRouter;
