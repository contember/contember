export interface JsonObject<Ext = never> {
	[key: string]: JsonValue<Ext>
}

export interface JsonArray<Ext = never> extends Array<JsonValue<Ext>> {}

export type JsonValue<Ext = never> = string | number | boolean | null | JsonObject<Ext> | JsonArray<Ext> | Ext
