import * as schema from './utils/schema'

export type CustomLoginConfig = ReturnType<typeof customLoginConfig>
export const customLoginConfig = schema.partial({
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

export type CustomConfig = ReturnType<typeof customConfig>
export const customConfig = schema.partial({
	login: customLoginConfig,
	projects: schema.record(schema.string, schema.partial({
		allowedRoles: schema.array(schema.string),
	})),
})

export type PanelConfig = ReturnType<typeof panelConfig>
export const panelConfig = schema.partial({
	inviteMethod: schema.union(schema.literal('CREATE_PASSWORD'), schema.literal('RESET_PASSWORD')),
})
