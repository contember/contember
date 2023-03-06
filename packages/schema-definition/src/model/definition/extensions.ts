import { Model } from '@contember/schema'
import { EntityConstructor, FieldsDefinition } from './types'
import { EntityRegistry, EnumRegistry } from './internal'
import { NamingConventions } from '@contember/schema-utils'
import { createMetadataStore, DecoratorFunction } from '../../utils'

interface EntityExtensionArgs {
	entity: Model.Entity
	definition: FieldsDefinition
	conventions: NamingConventions
	enumRegistry: EnumRegistry
	entityRegistry: EntityRegistry

	/** @deprecated use entityRegistry */
	registry: EntityRegistry
}

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
