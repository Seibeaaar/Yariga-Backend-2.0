import {
  NOTIFICATION_TYPE,
  SendNotificationConfig,
} from "@/types/notification";
import { USER_ROLE, UserDocument } from "@/types/user";
import { getUserFullName } from "./user";
import { MAX_NOTIFICATIONS_BATCH } from "@/constants/notification";
import { isDefined } from "./common";
import Notification from "@/models/Notification";

const generateNotificationContent = (
  type: NOTIFICATION_TYPE,
  sender: UserDocument,
) => {
  const senderFullName = getUserFullName(sender);
  switch (type) {
    case NOTIFICATION_TYPE.NewMessage:
      return `You have received a message from ${senderFullName}.`;
    case NOTIFICATION_TYPE.NewAgreement:
      return `Check out a new proposal from ${senderFullName}.`;
    case NOTIFICATION_TYPE.AgreementAccepted:
      return `Congratulations. ${senderFullName} accepted your proposal.`;
    case NOTIFICATION_TYPE.AgreementCountered:
      return `${senderFullName} suggests a counter proposal. Take a look.`;
    case NOTIFICATION_TYPE.AgreementDeclined:
      return `${senderFullName} declines your proposal. Sorry to hear that.`;
    default:
      return null;
  }
};

export const sendNotification = async (config: SendNotificationConfig) => {
  const { sender, type, landlord, tenant } = config;
  const receiver = sender.role === USER_ROLE.Tenant ? landlord : tenant;
  const notification = new Notification({
    sender: sender.id,
    receiver,
    content: generateNotificationContent(type, sender),
    type,
  });
  await notification.save();
};

export const makeNotificationKeysetRequest = async (
  userId: string,
  isRead: boolean,
  lastCreatedAt?: string,
) => {
  const query = {
    receiver: userId,
    isRead,
    ...(isDefined(lastCreatedAt) && {
      createdAt: {
        $lt: lastCreatedAt,
      },
    }),
  };
  const notifications = await Notification.find(query)
    .sort({
      createdAt: -1,
    })
    .limit(MAX_NOTIFICATIONS_BATCH);

  const total = await Notification.countDocuments(query);

  return {
    notifications,
    isNextRequestAvailable: total > MAX_NOTIFICATIONS_BATCH,
  };
};
