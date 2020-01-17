export type JSONPrimitive = string | number | boolean | null | undefined
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = JSONValue[]
