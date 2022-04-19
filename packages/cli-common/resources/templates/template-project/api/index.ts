import { createSchema } from '@contember/schema-definition'
import * as model from './model'
import { AllowAllPermissionFactory } from '@contember/schema-utils'

export default createSchema(model, schema => {
	return {
		...schema,
		acl: {
			...schema.acl,
			roles: {
				...schema.acl.roles,
				admin: {
					variables: {},
					s3: {
						'**': {
							upload: true,
							read: true,
						},
					},
					entities: new AllowAllPermissionFactory().create(schema.model, true),
				},
			},
		},
	}
})
