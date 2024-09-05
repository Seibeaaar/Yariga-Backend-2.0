import { isValidObjectId } from "mongoose";
import * as yup from "yup";

export const MESSAGE_REQUIRED_FIELDS = {
  content: yup.string().required("Message content required"),
  sender: yup
    .string()
    .required("Sender ID required")
    .test((v: string) => isValidObjectId(v)),
  receiver: yup
    .string()
    .required("Receiver ID required")
    .test((v: string) => isValidObjectId(v)),
};

export const INITIAL_MESSAGE_VALIDATOR = yup.object(MESSAGE_REQUIRED_FIELDS);
