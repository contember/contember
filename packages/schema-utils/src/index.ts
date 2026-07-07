import { Schema } from '@contember/schema'
import { emptyModelSchema } from './model/index.js'
import * as Typesafe from '@contember/typesafe'
import { aclSchema, modelSchema, settingsSchema, validationSchema } from './type-schema/index.js'
import { actionsSchema } from './type-schema/actions.js'
import { retentionSchema } from './type-schema/retention.js'

export * from './definition-generator/index.js'
export * from './json-schema/index.js'
export * from './lax/index.js'
export * from './model/index.js'
export * from './acl/index.js'
export * from './actions/index.js'
export * from './dataUtils.js'
export * from './validation/index.js'
export * from './schemaNormalizer.js'
export * from './schemaFilter.js'
export * from './schemaChecksum.js'
export { compareArraysIgnoreOrder, deepCompare } from './utils/index.js'

export const emptySchema: Schema = {
	model: emptyModelSchema,
	acl: { roles: {} },
	validation: {},
	actions: { triggers: {}, targets: {} },
	retention: { policies: {} },
	settings: {},
}

export const schemaType: Typesafe.Type<Schema> = Typesafe.object({
	model: modelSchema,
	acl: aclSchema,
	validation: validationSchema,
	actions: Typesafe.coalesce(actionsSchema, { triggers: {}, targets: {} }),
	retention: Typesafe.coalesce(retentionSchema, { policies: {} }),
	settings: Typesafe.coalesce(settingsSchema, {}),
})
