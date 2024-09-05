import { verifyJWToken } from "@/middlewares/common";
import Notification from "@/models/Notification";
import { NotificationDocument } from "@/types/notification";
import { generateErrorMesaage, makePaginatedRequest } from "@/utils/common";
import { Router } from "express";

const NotificationRouter = Router();

NotificationRouter.get("/", verifyJWToken, async (req, res) => {
  try {
    const paginatedResponse = await makePaginatedRequest<NotificationDocument>(
      Notification,
      {},
      req.query.page as string | undefined,
    );

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

export default NotificationRouter;
