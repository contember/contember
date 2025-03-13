import { Acl, ProjectRole, Schema } from '@contember/schema'
import { AllowAllPermissionFactory } from './acl'

export const normalizeSchema = <S extends Schema>(schema: S): S => {
	const adminRoleDefinition: Partial<Acl.RolePermissions> = schema.acl.roles?.[ProjectRole.ADMIN] ?? {}
	const contentAdminRoleDefinition: Partial<Acl.RolePermissions> = schema.acl.roles?.[ProjectRole.CONTENT_ADMIN] ?? {}

	return {
		...schema,
		acl: {
			...schema.acl,
			roles: {
				...schema.acl.roles,
				[ProjectRole.ADMIN]: {
					stages: '*',
					variables: {},
					entities: new AllowAllPermissionFactory().create(schema.model),
					s3: {
						'**': {
							upload: true,
							read: true,
						},
					},
					content: {
						export: true,
						import: true,
						refreshMaterializedView: true,
						...adminRoleDefinition.content,
					},
					system: {
						export: true,
						import: true,
						...adminRoleDefinition.system,
					},
					debug: true,
					...adminRoleDefinition,
				},
				[ProjectRole.CONTENT_ADMIN]: {
					stages: '*',
					variables: {},
					entities: new AllowAllPermissionFactory().create(schema.model),
					s3: {
						'**': {
							upload: true,
							read: true,
						},
					},
					content: {
						export: true,
						import: true,
						refreshMaterializedView: true,
						...contentAdminRoleDefinition.content,
					},
					system: {
						history: true,
						export: true,
						import: true,
						...contentAdminRoleDefinition.system,
					},
					...contentAdminRoleDefinition,
				},
				[ProjectRole.DEPLOYER]: {
					stages: '*',
					entities: {},
					variables: {},
				},
			},
		},
	}
}
