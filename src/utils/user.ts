import { UserDocument } from "@/types/user";

export const getUserFullName = (user: UserDocument) =>
  `${user.firstName} ${user.lastName}`;
