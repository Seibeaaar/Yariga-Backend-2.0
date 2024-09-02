import * as yup from "yup";

export const buildMinMaxValidation = (
  lowest: number,
  highest: number,
  fieldName: string,
) => {
  const capitalizedFieldName = fieldName[0].toUpperCase() + fieldName.slice(1);
  return yup.object({
    max: yup
      .number()
      .max(highest, `${capitalizedFieldName} should not exceed ${highest}`),
    min: yup.number().when("max", ([maxValue], schema) => {
      const currentMax = maxValue ? maxValue : highest;
      return schema
        .min(
          lowest,
          `${capitalizedFieldName} number should not be lower than ${lowest}`,
        )
        .max(
          currentMax,
          `Minimum number of ${fieldName} should not exceed ${currentMax}`,
        );
    }),
  });
};
