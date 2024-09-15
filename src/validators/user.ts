import * as yup from "yup";
import dayjs from "dayjs";
import { USER_ROLE } from "@/types/user";

const US_PHONE_NUMBER_REGEX =
  /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}-)[0-9]{3}-[0-9]{4}$/;

export const USER_COMPLETE_SCHEMA = yup.object({
  dateOfBirth: yup
    .string()
    .required("Date of birth required")
    .test("dateOfBirth", "Invalid date of birth", (value) => {
      return dayjs(value).isValid();
    })
    .test("dateOfBirth", "You must be 18 or order", (value) => {
      const customDate = dayjs(value);
      const currentDate = dayjs();
      return currentDate.diff(customDate, "y") >= 18;
    }),
  role: yup
    .mixed<USER_ROLE>()
    .required("Role required")
    .oneOf(Object.values(USER_ROLE)),
  phoneNumber: yup
    .string()
    .required("Phone number required")
    .matches(US_PHONE_NUMBER_REGEX, "Invalid US phone number"),
});
