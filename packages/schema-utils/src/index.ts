import { Schema } from '@contember/schema'
import { emptyModelSchema } from './model'
import * as Typesafe from '@contember/typesafe'
import { aclSchema, modelSchema, validationSchema, settingsSchema } from './type-schema'

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
	settings: {},
}

export const schemaType: Typesafe.Type<Schema> = Typesafe.object({
	model: modelSchema,
	acl: aclSchema,
	validation: validationSchema,
	settings: settingsSchema,
})
