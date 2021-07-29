import { Model } from '@contember/schema'
import { EntityConstructor, FieldsDefinition } from './types'

export type EntityExtension = (entity: Model.Entity, definition: FieldsDefinition) => Model.Entity
export const extendEntity = (extension: EntityExtension) => {
	return function (cls: EntityConstructor) {
		const extensions = Reflect.getMetadata('extensions', cls) || []
		Reflect.defineMetadata('extensions', [...extensions, extension], cls)
	}
}

export const applyEntityExtensions = (
	cls: EntityConstructor,
	entity: Model.Entity,
	definition: FieldsDefinition,
): Model.Entity =>
	((Reflect.getMetadata('extensions', cls) || []) as EntityExtension[]).reduce(
		(entity, ext) => ext(entity, definition),
		entity,
	)
