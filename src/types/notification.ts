import { NotificationSchema } from "@/models/Notification";
import { InferSchemaType } from "mongoose";
import { User } from "./user";

export enum NOTIFICATION_TYPE {
  NewMessage = "new_message",
  NewAgreement = "new_agreement",
  AgreementAccepted = "agreement_accepted",
  AgreementCountered = "agreement_countered",
  AgreementDeclined = "agreement_declined",
}

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;

export type SendNotificationConfig = {
  type: NOTIFICATION_TYPE;
  sender: User;
  landlord: string;
  tenant: string;
};
