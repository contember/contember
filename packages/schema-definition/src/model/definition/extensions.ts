import { Model } from '@contember/schema'
import { EntityConstructor, FieldsDefinition } from './types'
import { EntityRegistry } from './internal'
import { createMetadataStore, DecoratorFunction } from '../../utils'
import { CommonContext } from './context'

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
	return function (cls: EntityConstructor) {
		entityExtensionsStore.update(cls, current => [...current, extension])
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
