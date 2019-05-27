import { emptyModelSchema } from './modelUtils'
import { Schema } from 'cms-common'

export const emptySchema: Schema = {
	model: emptyModelSchema,
	acl: { variables: {}, roles: {} },
	validation: {},
}
