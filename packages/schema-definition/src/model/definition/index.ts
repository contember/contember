import { EntityConstructor, Interface } from './types.js'
import { Model } from '@contember/schema'
import { EnumDefinition } from './EnumDefinition.js'
import { SchemaBuilder } from './internal/index.js'
import { DefaultNamingConventions } from './NamingConventions.js'
import 'reflect-metadata'
import { FieldDefinition } from './fieldDefinitions/index.js'
import { isEntityConstructor } from '../../utils/index.js'

export * from './fieldDefinitions/index.js'
export * from './EventLogDefinition.js'
export * from './EnumDefinition.js'
export * from './UniqueDefinition.js'
export * from './ViewDefinition.js'
export { extendEntity, EntityExtension } from './extensions.js'

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
