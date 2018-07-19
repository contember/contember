import { capitalizeFirstLetter } from "../utils/strings"

export const GqlTypeName = (strings: TemplateStringsArray, ...values: string[]) => {
  return strings.reduce((combined, string, i) => {
    return combined + string + (i < values.length ? capitalizeFirstLetter(values[i]) : "")
  }, "")
}
