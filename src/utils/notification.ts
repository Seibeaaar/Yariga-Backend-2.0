import { NOTIFICATION_TYPE } from "@/types/notification";
import { User, UserDocument } from "@/types/user";
import { getUserFullName } from "./user";
import { AgreementDocument } from "@/types/agreement";
import { getAgreementCounterpart } from "./agreement";
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

export const createAgreementNotification = async (
  type: NOTIFICATION_TYPE,
  user: User,
  agreement: AgreementDocument,
) => {
  const receiver =
    type === NOTIFICATION_TYPE.NewAgreement
      ? agreement.landlord
      : getAgreementCounterpart(agreement, user.id);
  const notification = new Notification({
    sender: user.id,
    receiver,
    content: generateNotificationContent(type, user),
    type,
  });
  await notification.save();

  return notification;
};
