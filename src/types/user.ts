import { UserSchema } from "@/models/User";
import { InferSchemaType } from "mongoose";

export enum AUTH_PROVIDER {
  Password = "password",
  Google = "google",
}

export enum USER_ROLE {
  Landlord = "landlord",
  Tenant = "tenant",
}

export type UserDocument = InferSchemaType<typeof UserSchema>;
export type User = UserDocument & {
  id: string;
};
