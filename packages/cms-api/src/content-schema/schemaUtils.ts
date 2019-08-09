import { emptyModelSchema } from './modelUtils'
import { Schema } from '@contember/schema'

export const emptySchema: Schema = {
	model: emptyModelSchema,
	acl: { variables: {}, roles: {} },
	validation: {},
}
