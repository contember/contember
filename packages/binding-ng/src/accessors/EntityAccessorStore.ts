import {
	Alias,
	BindingError,
	EntityAccessor,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	Environment,
	PlaceholderGenerator,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '@contember/binding-common'
import { Entity } from '../entities/Entity'
import { EntityListSubTreeAccessor } from './EntityListSubTreeAccessor'
import { SubTreeEntityAccessor } from './entityAccessors/SubTreeEntityAccessor'

export class EntityAccessorStore {

	#entities: Map<string, { getAccessor: EntityAccessor.GetEntityAccessor }> = new Map()

	/**
	 * Indexed by placeholder
	 */
	#entityListSubTrees: Map<string, EntityListSubTreeAccessor> = new Map()

	/**
	 * Indexed by placeholder
	 */
	#entitySubTrees: Map<string, SubTreeEntityAccessor> = new Map()

	getEntityByKey(key: string): EntityAccessor {
		const entity = this.#entities.get(key)
		if (entity === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent entity '${key}'.`)
		}
		return entity.getAccessor()
	}

	hasEntityByKey(key: string): boolean {
		return this.#entities.has(key)
	}

	getOrCreateEntityByKey(key: string, create: () => EntityAccessor): EntityAccessor {
		if (this.hasEntityByKey(key)) {
			return this.getEntityByKey(key)
		}

		const accessor = create()
		this.#entities.set(key, accessor)
		return accessor
	}


	initializeEntitySubTree({ entity, marker }: {
		entity: Entity
		marker: EntitySubTreeMarker
	}): void {
		const entitySubTree = this.#entitySubTrees.get(marker.placeholderName)
		if (entitySubTree) {
			entitySubTree.update(marker, entity)
		} else {
			const key = `entity-${marker.placeholderName}`
			const entitySubTreeAccessor = new SubTreeEntityAccessor(
				key,
				entity.schema,
				entity,
				marker.environment,
				marker,
				this,
			)
			this.#entitySubTrees.set(marker.placeholderName, entitySubTreeAccessor)
			this.#entities.set(entitySubTreeAccessor.key, entitySubTreeAccessor)
		}
	}

	initializeEntityListSubTree({ entities, marker }: {
		entities: Entity[]
		marker: EntityListSubTreeMarker
	}): void {
		const entityListSubTree = this.#entityListSubTrees.get(marker.placeholderName)
		if (entityListSubTree) {
			entityListSubTree.setEntities(entities)
			entityListSubTree.setMarker(marker)
		} else {
			const entityListSubTree = new EntityListSubTreeAccessor(marker, this)
			entityListSubTree.setEntities(entities)
			this.#entityListSubTrees.set(marker.placeholderName, entityListSubTree)
		}
	}

	getEntityListSubTree(
		aliasOrParameters: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
		environment: Environment,
	): EntityListSubTreeAccessor {
		const placeholderName = this.resolveEntityListSubTreePlaceholder(aliasOrParameters, environment)
		const subTreeState = this.#entityListSubTrees.get(placeholderName)
		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent sub-tree '${placeholderName}'.`)
		}

		return subTreeState
	}

	getEntitySubTree(
		aliasOrParameters: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
		environment: Environment,
	): SubTreeEntityAccessor {
		const placeholderName = this.resolveEntitySubTreePlaceholder(aliasOrParameters, environment)
		const subTreeState = this.#entitySubTrees.get(placeholderName)
		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent sub-tree '${placeholderName}'.`)
		}

		return subTreeState
	}


	private resolveEntityListSubTreePlaceholder(
		aliasOrParameters: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
		environment: Environment,
	) {

		if (typeof aliasOrParameters === 'string') {
			// todo implement
			throw new Error('Not implemented')
		}
		return PlaceholderGenerator.getEntityListSubTreePlaceholder(
			aliasOrParameters.isCreating
				? QueryLanguage.desugarUnconstrainedQualifiedEntityList(aliasOrParameters, environment)
				: QueryLanguage.desugarQualifiedEntityList(aliasOrParameters, environment),
			environment,
		)
	}

	private resolveEntitySubTreePlaceholder(
		aliasOrParameters: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
		environment: Environment,
	) {
		if (typeof aliasOrParameters === 'string') {
			// todo implement
			throw new Error('Not implemented')
		}
		return PlaceholderGenerator.getEntitySubTreePlaceholder(
			aliasOrParameters.isCreating
				? QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(aliasOrParameters, environment)
				: QueryLanguage.desugarQualifiedSingleEntity(aliasOrParameters, environment),
			environment,
		)
	}
}
