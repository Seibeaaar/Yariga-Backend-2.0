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

export enum USER_ONBOARDING_STEP {
  CompleteProfile = "complete_profile",
  SetPreferences = "set_preferences",
  AddProperty = "add_property",
}

export type UserDocument = InferSchemaType<typeof UserSchema>;
export type User = UserDocument & {
  id: string;
};
