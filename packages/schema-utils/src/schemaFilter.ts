import { Schema } from '@contember/schema'

export const filterSchemaByStage = <S extends Schema>(schema: S, stageSlug: string): S => {
	return {
		...schema,
		acl: {
			...schema.acl,
			roles: Object.fromEntries(
				Object.entries(schema.acl.roles).filter(
					([key, value]) =>
						value.stages === '*' || !!value.stages.find(pattern => !!new RegExp(pattern).exec(stageSlug)),
				),
			),
		},
	}
}
