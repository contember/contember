import { Model } from '@contember/schema'
import { EnumDefinition } from './EnumDefinition.js'
import { SchemaBuilder } from './internal/index.js'
import 'reflect-metadata'
import { FieldDefinition } from './fieldDefinitions/index.js'
import { isEntityConstructor } from '../../utils/index.js'
import { DefaultNamingConventions } from '@contember/schema-utils'
import { StrictDefinitionValidator, StrictOptions } from '../../strict.js'

export * from './fieldDefinitions/index.js'
export * from './EventLogDefinition.js'
export * from './IndexDefinition.js'
export * from './OrderByDefinition.js'
export * from './EnumDefinition.js'
export * from './UniqueDefinition.js'
export * from './ViewDefinition.js'
export { type EntityExtension, extendEntity } from './extensions.js'

export abstract class Entity {
	[key: string]: FieldDefinition<any> | undefined
}

export type ModelDefinition<M> = {
	[K in keyof M]: unknown
}

export function createModel<M extends ModelDefinition<M>>(definitions: M, options: {
	strictDefinitionValidator?: StrictDefinitionValidator
	defaultCollation?: string
} = {}): Model.Schema {
	const schemaBuilder = new SchemaBuilder(
		new DefaultNamingConventions(),
		options.strictDefinitionValidator,
		{ defaultCollation: options.defaultCollation },
	)
	for (const [name, definition] of Object.entries(definitions)) {
		if (definition instanceof EnumDefinition) {
			schemaBuilder.addEnum(name, definition)
		} else if (isEntityConstructor(definition)) {
			schemaBuilder.addEntity(name, definition)
		}
	}
	const schema = schemaBuilder.createSchema()
	return schema
}

export const OnDelete = Model.OnDelete
export const OrderDirection = Model.OrderDirection
export { EnumDefinition }
