import { Acl, ProjectRole, Schema } from '@contember/schema'
import { AllowAllPermissionFactory } from './acl'

export const normalizeSchema = <S extends Schema>(schema: S): S => {
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
					},
					system: {
						export: true,
						import: true,
					},
					...((schema.acl.roles?.[ProjectRole.ADMIN] as Acl.RolePermissions | undefined) || {}),
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
					},
					system: {
						history: true,
						export: true,
						import: true,
					},
					...((schema.acl.roles?.[ProjectRole.CONTENT_ADMIN] as Acl.RolePermissions | undefined) || {}),
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
