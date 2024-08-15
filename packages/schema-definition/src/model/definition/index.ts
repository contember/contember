import { Model } from '@contember/schema'
import { EnumDefinition } from './EnumDefinition'
import { SchemaBuilder } from './internal'
import 'reflect-metadata'
import { FieldDefinition } from './fieldDefinitions'
import { isEntityConstructor } from '../../utils'
import { DefaultNamingConventions } from '@contember/schema-utils'
import { StrictOptions, StrictDefinitionValidator } from '../../strict'

export * from './fieldDefinitions'
export * from './EventLogDefinition'
export * from './IndexDefinition'
export * from './OrderByDefinition'
export * from './EnumDefinition'
export * from './UniqueDefinition'
export * from './ViewDefinition'
export { extendEntity, type EntityExtension } from './extensions'

export abstract class Entity {
	[key: string]: FieldDefinition<any> | undefined
}

export type ModelDefinition<M> = {
	[K in keyof M]: unknown
}

export function createModel<M extends ModelDefinition<M>>(definitions: M, options: {
	strictDefinitionValidator?: StrictDefinitionValidator
} = {}): Model.Schema {
	const schemaBuilder = new SchemaBuilder(
		new DefaultNamingConventions(),
		options.strictDefinitionValidator,
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
