import { Schema } from '@contember/schema'
import { emptyModelSchema } from './model'
import * as Typesafe from '@contember/typesafe'
import { aclSchema, modelSchema, validationSchema } from './type-schema'
import { actionsSchema } from './type-schema/actions'

export * from './model'
export * from './acl'
export * from './dataUtils'
export * from './validation'
export * from './schemaNormalizer'
export * from './schemaFilter'
export { deepCompare } from './utils'

export const emptySchema: Schema = {
	model: emptyModelSchema,
	acl: { roles: {} },
	validation: {},
	actions: { triggers: {}, targets: {} },
}

export const schemaType: Typesafe.Type<Schema> = Typesafe.object({
	model: modelSchema,
	acl: aclSchema,
	validation: validationSchema,
	actions: actionsSchema,
})
