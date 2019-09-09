import { Schema } from '@contember/schema'
import { emptyModelSchema } from './model/modelUtils'

export * from './model/modelUtils'
export * from './model/NamingHelper'
export * from './acl/PredicateDefinitionProcessor'
export * from './dataUtils'
export * from './validation'

export const emptySchema: Schema = {
	model: emptyModelSchema,
	acl: { roles: {} },
	validation: {},
}
