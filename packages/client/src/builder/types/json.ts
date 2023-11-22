export type JSONPrimitive<E = never> = string | number | boolean | null | E
export type JSONValue<E = never> = JSONPrimitive<E> | JSONObject<E> | JSONArray<E>
export type JSONObject<E = never> = { readonly [K in string]?: JSONValue<E> }
export type JSONArray<E = never> = readonly JSONValue<E>[]
