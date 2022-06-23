import { Model } from '@contember/schema'
import { DecoratorFunction, EntityConstructor, FieldsDefinition } from './types.js'
import { EntityRegistry } from './internal/index.js'

interface EntityExtensionArgs {
	entity: Model.Entity
	definition: FieldsDefinition
	registry: EntityRegistry
}

export type EntityExtension = (args: EntityExtensionArgs) => Model.Entity
export const extendEntity = <T>(extension: EntityExtension): DecoratorFunction<T> => {
	return function (cls: EntityConstructor) {
		const extensions = Reflect.getMetadata('extensions', cls) || []
		Reflect.defineMetadata('extensions', [...extensions, extension], cls)
	}
}

export const applyEntityExtensions = (
	cls: EntityConstructor,
	args: EntityExtensionArgs,
): Model.Entity =>
	((Reflect.getMetadata('extensions', cls) || []) as EntityExtension[]).reduce(
		(entity, ext) => ext({ ...args, entity }),
		args.entity,
	)
