import * as schema from './utils/schema'

export const baseLoginConfigSchema = schema.object({
	apiBaseUrl: schema.string,
	loginToken: schema.string,
	projects: schema.array(
		schema.string,
	),
})

export type BaseLoginConfig = ReturnType<typeof baseLoginConfigSchema>

export const customLoginConfigSchema = schema.partial({
	heading: schema.string,
	collapsedEmailLogin: schema.boolean,
	identityProviders: schema.array(
		schema.intersection(
			schema.object({
				provider: schema.string,
			}),
			schema.partial({
				name: schema.string,
			}),
		),
	),
})

export type CustomLoginConfig = ReturnType<typeof customLoginConfigSchema>

export const loginConfigSchema = schema.intersection(baseLoginConfigSchema, customLoginConfigSchema)
export type LoginConfig = ReturnType<typeof loginConfigSchema>


export const customConfig = schema.partial({
	login: customLoginConfigSchema,
	projects: schema.record(schema.string, schema.partial({
		allowedRoles: schema.array(schema.string),
	})),
})
export type CustomConfig = ReturnType<typeof customConfig>
