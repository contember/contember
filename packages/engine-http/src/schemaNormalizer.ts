import { Schema } from '@contember/schema'
import { ProjectRole } from '@contember/schema'
import { AllowAllPermissionFactory } from '@contember/schema-definition'

export const normalizeSchema = (schema: Schema) => {
	if (!schema.acl.roles[ProjectRole.ADMIN]) {
		schema = {
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
					},
				},
			},
		}
	}
	return schema
}
