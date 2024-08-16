import { Schema } from '@contember/schema'
import { emptyModelSchema } from './model'
import * as Typesafe from '@contember/typesafe'
import { aclSchema, modelSchema, validationSchema, settingsSchema } from './type-schema'
import { actionsSchema } from './type-schema/actions'

export * from './definition-generator'
export * from './lax'
export * from './model'
export * from './acl'
export * from './dataUtils'
export * from './validation'
export * from './schemaNormalizer'
export * from './schemaFilter'
export * from './schemaChecksum'
export { deepCompare, compareArraysIgnoreOrder } from './utils'

export const emptySchema: Schema = {
	model: emptyModelSchema,
	acl: { roles: {} },
	validation: {},
	actions: { triggers: {}, targets: {} },
	settings: {},
}

export const schemaType: Typesafe.Type<Schema> = Typesafe.object({
	model: modelSchema,
	acl: aclSchema,
	validation: validationSchema,
	actions: Typesafe.coalesce(actionsSchema, { triggers: {}, targets: {} }),
	settings: Typesafe.coalesce(settingsSchema, {}),
})
