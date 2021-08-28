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
					...((schema.acl.roles?.[ProjectRole.ADMIN] as Acl.RolePermissions | undefined) || {}),
				},
				[ProjectRole.MAINTAINER]: {
					stages: '*',
					entities: {},
					variables: {},
				},
			},
		},
	}
}
