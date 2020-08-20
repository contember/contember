import { GraphQlBuilder } from '@contember/client'
import { BindingError } from '../BindingError'
import { SubTreeMarkerParameters } from '../markers'
import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
	EntityListEventListeners,
	FieldName,
	HasManyRelation,
	HasOneRelation,
	SetOnCreate,
	SingleEntityEventListeners,
	UniqueWhere,
} from '../treeParameters'

export class TreeParameterMerger {
	public static mergeHasOneRelationsWithSamePlaceholders(
		original: HasOneRelation,
		fresh: HasOneRelation,
	): HasOneRelation {
		return {
			// Encoded within the placeholder
			field: original.field,
			filter: original.filter,
			reducedBy: original.reducedBy,

			// Not encoded within the placeholder
			setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
			isNonbearing: original.isNonbearing && fresh.isNonbearing,
			forceCreation: original.forceCreation || fresh.forceCreation,
			eventListeners: this.mergeSingleEntityEventListeners(original.eventListeners, fresh.eventListeners),
		}
	}

	public static mergeHasManyRelationsWithSamePlaceholders(
		original: HasManyRelation,
		fresh: HasManyRelation,
	): HasManyRelation {
		if (original.initialEntityCount !== fresh.initialEntityCount) {
			throw new BindingError(
				`Detected hasMany relations on the same field '${original.field}' with different preferred initial ` +
					`entity counts: '${original.initialEntityCount}' and '${fresh.initialEntityCount}' respectively.`,
			)
		}
		return {
			// Encoded within the placeholder
			field: original.field,
			filter: original.filter,
			orderBy: original.orderBy,
			offset: original.offset,
			limit: original.limit,

			// Not encoded within the placeholder
			setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
			forceCreation: original.forceCreation || fresh.forceCreation,
			isNonbearing: original.isNonbearing && fresh.isNonbearing,
			initialEntityCount: original.initialEntityCount, // Handled above
			eventListeners: this.mergeEntityListEventListeners(original.eventListeners, fresh.eventListeners),
		}
	}

	public static mergeSubTreeParametersWithSamePlaceholders(
		original: SubTreeMarkerParameters,
		fresh: SubTreeMarkerParameters,
	): SubTreeMarkerParameters {
		if (original instanceof BoxedQualifiedSingleEntity && fresh instanceof BoxedQualifiedSingleEntity) {
			return new BoxedQualifiedSingleEntity({
				// Encoded within the placeholder
				where: original.value.where,
				entityName: original.value.entityName,
				filter: original.value.filter,

				// Not encoded within the placeholder
				setOnCreate: this.mergeSetOnCreate(original.value.setOnCreate, fresh.value.setOnCreate),
				forceCreation: original.value.forceCreation || fresh.value.forceCreation,
				isNonbearing: original.value.isNonbearing && fresh.value.isNonbearing,
				hasOneRelationPath: original.value.hasOneRelationPath, // TODO this is completely wrong.
				eventListeners: this.mergeSingleEntityEventListeners(original.value.eventListeners, fresh.value.eventListeners),
			})
		}
		if (original instanceof BoxedQualifiedEntityList && fresh instanceof BoxedQualifiedEntityList) {
			const originalListeners = original.value.eventListeners
			const freshListeners = fresh.value.eventListeners
			if (original.value.initialEntityCount !== fresh.value.initialEntityCount) {
				throw new BindingError(
					`Detected sub trees of the same entity '${original.value.entityName}' with different preferred initial ` +
						`entity counts: '${original.value.initialEntityCount}' and '${fresh.value.initialEntityCount}' respectively.`,
				)
			}
			return new BoxedQualifiedEntityList({
				// Encoded within the placeholder
				entityName: original.value.entityName,
				filter: original.value.filter,
				orderBy: original.value.orderBy,
				offset: original.value.offset,
				limit: original.value.limit,

				// Not encoded within the placeholder
				setOnCreate: this.mergeSetOnCreate(original.value.setOnCreate, fresh.value.setOnCreate),
				forceCreation: original.value.forceCreation || fresh.value.forceCreation,
				isNonbearing: original.value.isNonbearing && fresh.value.isNonbearing,
				hasOneRelationPath: original.value.hasOneRelationPath, // TODO this is completely wrong.
				eventListeners: this.mergeEntityListEventListeners(original.value.eventListeners, fresh.value.eventListeners),
				initialEntityCount: original.value.initialEntityCount, // Handled above
			})
		}
		if (
			original instanceof BoxedUnconstrainedQualifiedSingleEntity &&
			fresh instanceof BoxedUnconstrainedQualifiedSingleEntity
		) {
			return new BoxedUnconstrainedQualifiedSingleEntity({
				// Encoded within the placeholder
				entityName: original.value.entityName,

				// Not encoded within the placeholder
				setOnCreate: this.mergeSetOnCreate(original.value.setOnCreate, fresh.value.setOnCreate),
				forceCreation: original.value.forceCreation || fresh.value.forceCreation,
				isNonbearing: original.value.isNonbearing && fresh.value.isNonbearing,
				hasOneRelationPath: original.value.hasOneRelationPath, // TODO this is completely wrong.
				eventListeners: this.mergeSingleEntityEventListeners(original.value.eventListeners, fresh.value.eventListeners),
			})
		}
		if (
			original instanceof BoxedUnconstrainedQualifiedEntityList &&
			fresh instanceof BoxedUnconstrainedQualifiedEntityList
		) {
			const originalListeners = original.value.eventListeners
			const freshListeners = fresh.value.eventListeners
			if (original.value.initialEntityCount !== fresh.value.initialEntityCount) {
				throw new BindingError(
					`Detected sub trees of the same entity '${original.value.entityName}' with different preferred initial ` +
						`entity counts: '${original.value.initialEntityCount}' and '${fresh.value.initialEntityCount}' respectively.`,
				)
			}
			return new BoxedUnconstrainedQualifiedEntityList({
				// Encoded within the placeholder
				entityName: original.value.entityName,

				// Not encoded within the placeholder
				setOnCreate: this.mergeSetOnCreate(original.value.setOnCreate, fresh.value.setOnCreate),
				forceCreation: original.value.forceCreation || fresh.value.forceCreation,
				isNonbearing: original.value.isNonbearing && fresh.value.isNonbearing,
				hasOneRelationPath: original.value.hasOneRelationPath, // TODO this is completely wrong.
				eventListeners: this.mergeEntityListEventListeners(original.value.eventListeners, fresh.value.eventListeners),
				initialEntityCount: original.value.initialEntityCount, // Handled above
			})
		}
		throw new BindingError()
	}

	public static mergeSetOnCreate(original: SetOnCreate, fresh: SetOnCreate): SetOnCreate {
		if (original === undefined && fresh === undefined) {
			return undefined
		}
		if (original === undefined) {
			return fresh
		}
		if (fresh === undefined) {
			return original
		}
		const originalCopy: UniqueWhere = { ...original }

		for (const field in fresh) {
			if (field in originalCopy) {
				const fromOriginal = originalCopy[field]
				const fromFresh = fresh[field]

				if (fromOriginal instanceof GraphQlBuilder.Literal) {
					if (fromFresh instanceof GraphQlBuilder.Literal) {
						if (fromOriginal.value === fromFresh.value) {
							// Good, do nothing.
							continue
						} else {
							throw new BindingError() // TODO msg
						}
					} else {
						throw new BindingError() // TODO msg
					}
				}
				if (typeof fromOriginal === 'object') {
					if (fromFresh instanceof GraphQlBuilder.Literal) {
						throw new BindingError() // TODO msg
					} else if (typeof fromFresh === 'object') {
						const merged = this.mergeSetOnCreate(fromOriginal, fromFresh)
						if (merged !== undefined) {
							originalCopy[field] = merged
						}
						continue
					} else {
						throw new BindingError() // TODO msg
					}
				}
				if (typeof fromFresh === 'string' || typeof fromFresh === 'number') {
					if (fromOriginal === fromFresh) {
						// Good, do nothing.
						continue
					} else {
						throw new BindingError() // TODO msg
					}
				}
				throw new BindingError() // TODO msg
			} else {
				originalCopy[field] = fresh[field]
			}
		}

		return originalCopy
	}

	private static mergeFieldScopedListeners<T extends Function>(
		original: Map<FieldName, Set<T>> | undefined,
		fresh: Map<FieldName, Set<T>> | undefined,
	) {
		if (original === undefined) {
			return fresh
		}
		if (fresh === undefined) {
			return original
		}
		const combinedMap = new Map(original)
		for (const [fieldName, listeners] of fresh) {
			const existing = combinedMap.get(fieldName)
			if (existing === undefined) {
				combinedMap.set(fieldName, listeners)
			} else {
				combinedMap.set(fieldName, this.mergeSets(existing, listeners))
			}
		}
		return combinedMap
	}

	private static mergeEventListeners<F extends Function>(
		original: Set<F> | undefined,
		fresh: Set<F> | undefined,
	): Set<F> | undefined {
		if (original === undefined) {
			return fresh
		}
		if (fresh === undefined) {
			return original
		}
		return this.mergeSets(original, fresh)
	}

	private static mergeSets<T>(original: Set<T>, fresh: Set<T>): Set<T> {
		const combinedSet = new Set(original)
		for (const item of fresh) {
			combinedSet.add(item)
		}
		return combinedSet
	}

	public static mergeSingleEntityEventListeners(
		original: SingleEntityEventListeners['eventListeners'],
		fresh: SingleEntityEventListeners['eventListeners'],
	): SingleEntityEventListeners['eventListeners'] {
		return {
			beforeUpdate: this.mergeEventListeners(original.beforeUpdate, fresh.beforeUpdate),
			connectionUpdate: this.mergeFieldScopedListeners(original.connectionUpdate, fresh.connectionUpdate),
			initialize: this.mergeEventListeners(original.initialize, fresh.initialize),
			update: this.mergeEventListeners(original.update, fresh.update),
		}
	}

	public static mergeEntityListEventListeners(
		original: EntityListEventListeners['eventListeners'],
		fresh: EntityListEventListeners['eventListeners'],
	): EntityListEventListeners['eventListeners'] {
		return {
			beforeUpdate: this.mergeEventListeners(original.beforeUpdate, fresh.beforeUpdate),
			childInitialize: this.mergeEventListeners(original.childInitialize, fresh.childInitialize),
			initialize: this.mergeEventListeners(original.initialize, fresh.initialize),
			update: this.mergeEventListeners(original.update, fresh.update),
		}
	}

	public static cloneSingleEntityEventListeners(
		listeners: SingleEntityEventListeners['eventListeners'] | undefined,
	): SingleEntityEventListeners['eventListeners'] {
		return {
			connectionUpdate: this.cloneOptionalMapOfSets(listeners?.connectionUpdate),
			update: this.cloneOptionalSet(listeners?.update),
			beforeUpdate: this.cloneOptionalSet(listeners?.beforeUpdate),
			initialize: this.cloneOptionalSet(listeners?.initialize),
		}
	}

	public static cloneEntityListEventListeners(
		listeners: EntityListEventListeners['eventListeners'] | undefined,
	): EntityListEventListeners['eventListeners'] {
		return {
			update: this.cloneOptionalSet(listeners?.update),
			beforeUpdate: this.cloneOptionalSet(listeners?.beforeUpdate),
			childInitialize: this.cloneOptionalSet(listeners?.childInitialize),
			initialize: this.cloneOptionalSet(listeners?.initialize),
		}
	}

	private static cloneOptionalSet<T>(set: Set<T> | undefined): Set<T> | undefined {
		if (set === undefined) {
			return undefined
		}
		return new Set(set)
	}

	private static cloneOptionalMapOfSets<K, T>(map: Map<K, Set<T>> | undefined): Map<K, Set<T>> | undefined {
		if (map === undefined) {
			return undefined
		}
		return new Map(Array.from(map, ([key, set]) => [key, new Set(set)]))
	}
}
