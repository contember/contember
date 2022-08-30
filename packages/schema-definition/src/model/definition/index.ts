import { Interface } from './types'
import { Model } from '@contember/schema'
import { EnumDefinition } from './EnumDefinition'
import { SchemaBuilder } from './internal'
import { DefaultNamingConventions } from './NamingConventions'
import 'reflect-metadata'
import { FieldDefinition } from './fieldDefinitions'
import { isEntityConstructor } from '../../utils'

export * from './fieldDefinitions'
export * from './EventLogDefinition'
export * from './IndexDefinition'
export * from './EnumDefinition'
export * from './UniqueDefinition'
export * from './ViewDefinition'
export { extendEntity, EntityExtension } from './extensions'

export abstract class Entity {
	[key: string]: Interface<FieldDefinition<any>> | undefined
}

export type ModelDefinition<M> = {
	[K in keyof M]: unknown
}

export function createModel<M extends ModelDefinition<M>>(definitions: M): Model.Schema {
	const schemaBuilder = new SchemaBuilder(new DefaultNamingConventions())
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
