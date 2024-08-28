export const PASSWORD_REGEX =
  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
export const NAME_REGEX = /^(?=.{1,50}$)[a-z]+(?:['_.\s][a-z]+)*$/i;

import * as yup from "yup";

export const SIGN_UP_VALIDATION_SCHEMA = yup.object({
  email: yup.string().required("Email required").email("Invalid email"),
  password: yup
    .string()
    .required("Password required")
    .matches(PASSWORD_REGEX, "Invalid password format"),
  firstName: yup
    .string()
    .required("First name required")
    .matches(NAME_REGEX, "Invalid first name format"),
  lastName: yup
    .string()
    .required("Last name required")
    .matches(NAME_REGEX, "Invalid last name format"),
});
