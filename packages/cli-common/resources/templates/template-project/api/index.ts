import { createSchema } from '@contember/schema-definition'
import * as model from './model'

export default createSchema(model, schema => {
	return {
		...schema,
		acl: {
			...schema.acl,
			customPrimary: true,
		},
	}
})
