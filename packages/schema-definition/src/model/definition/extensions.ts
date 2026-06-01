import { Model } from '@contember/schema'
import { EntityConstructor, FieldsDefinition } from './types.js'
import { EntityRegistry } from './internal/index.js'
import { createMetadataStore, DecoratorFunction } from '../../utils/index.js'
import { CommonContext } from './context.js'

export type EntityExtensionArgs =
	& {
		entity: Model.Entity
		definition: FieldsDefinition
		/** @deprecated use entityRegistry */
		registry: EntityRegistry
	}
	& CommonContext

const entityExtensionsStore = createMetadataStore<EntityExtension[]>([])

export type EntityExtension = (args: EntityExtensionArgs) => Model.Entity
export const extendEntity = <T>(extension: EntityExtension): DecoratorFunction<T> => {
	return function(cls: EntityConstructor, context?: ClassDecoratorContext) {
		entityExtensionsStore.update(cls, current => [...current, extension], context)
	}
}

export const applyEntityExtensions = (
	cls: EntityConstructor,
	args: EntityExtensionArgs,
): Model.Entity =>
	entityExtensionsStore.get(cls).reduce(
		(entity, ext) => ext({ ...args, entity }),
		args.entity,
	)
