import { createSchema, settingsPresets } from '@contember/schema-definition'
import * as model from './model'
import { AllowAllPermissionFactory } from '@contember/schema-utils'

export default createSchema(model, schema => ({
	...schema,
	acl: {
		...schema.acl,
		roles: {
			...schema.acl.roles,
			admin: {
				entities: new AllowAllPermissionFactory().create(schema.model, true),
				variables: {},
			},
		},
	},
	settings: settingsPresets['v1.3'],
}))
