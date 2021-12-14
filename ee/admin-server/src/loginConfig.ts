import * as schema from './utils/schema'

export const baseLoginConfigSchema = schema.object({
	apiBaseUrl: schema.string,
	loginToken: schema.string,
	sessionToken: schema.string,
	projects: schema.union(
		schema.null_,
		schema.array(
			schema.object({
				slug: schema.string,
				name: schema.string,
			}),
		),
	),
})

export type BaseLoginConfig = ReturnType<typeof baseLoginConfigSchema>

export const customLoginConfigSchema = schema.partial({
})
export type CustomLoginConfig = ReturnType<typeof customLoginConfigSchema>

export const loginConfigSchema = schema.intersection(baseLoginConfigSchema, customLoginConfigSchema)
export type LoginConfig = ReturnType<typeof loginConfigSchema>
