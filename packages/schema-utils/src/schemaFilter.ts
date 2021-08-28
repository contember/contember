import { Schema } from '@contember/schema'

export const filterSchemaByStage = <S extends Schema>(schema: S, stageSlug: string): S => {
	const roles = Object.entries(schema.acl.roles)
		.filter(
			([, value]) => value.stages === '*' || !!value.stages.find(pattern => !!new RegExp(pattern).exec(stageSlug)),
		)
		.map(([name, definition], index, roles) => [
			name,
			{
				...definition,
				...(definition.inherits
					? {
						inherits: definition.inherits.filter(it => roles.map(([role]) => role).includes(it)),
					  }
					: {}),
			},
		])
	return {
		...schema,
		acl: {
			...schema.acl,
			roles: Object.fromEntries(roles),
		},
	}
}
