import { emptyModelSchema } from '@contember/schema-utils'
import { Schema } from '@contember/schema'

export const emptySchema: Schema = {
	model: emptyModelSchema,
	acl: { variables: {}, roles: {} },
	validation: {},
}
