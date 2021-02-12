import { GraphQlBuilder } from '@contember/client'
import { BindingError } from '../BindingError'
import {
	Alias,
	EntityCreationParameters,
	EntityListEventListeners,
	ExpectedQualifiedEntityMutation,
	ExpectedRelationMutation,
	FieldName,
	HasManyRelation,
	HasOneRelation,
	QualifiedEntityList,
	QualifiedSingleEntity,
	SetOnCreate,
	SingleEntityEventListeners,
	UnconstrainedQualifiedEntityList,
	UnconstrainedQualifiedSingleEntity,
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
			expectedMutation: this.mergeExpectedRelationMutation(original.expectedMutation, fresh.expectedMutation),
			setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
			isNonbearing: original.isNonbearing && fresh.isNonbearing,
			// forceCreation: original.forceCreation || fresh.forceCreation,
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
			expectedMutation: this.mergeExpectedRelationMutation(original.expectedMutation, fresh.expectedMutation),
			setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
			// forceCreation: original.forceCreation || fresh.forceCreation,
			isNonbearing: original.isNonbearing && fresh.isNonbearing,
			initialEntityCount: original.initialEntityCount, // Handled above
			eventListeners: this.mergeEntityListEventListeners(original.eventListeners, fresh.eventListeners),
		}
	}

	public static mergeEntitySubTreeParametersWithSamePlaceholders(
		original: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
		fresh: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
	): QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity {
		if (original.isCreating) {
			return {
				// Encoded within the placeholder
				isCreating: original.isCreating,
				entityName: original.entityName,

				// Not encoded within the placeholder
				alias: this.mergeSubTreeAliases(original.alias, fresh.alias),
				setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
				// forceCreation: original.value.forceCreation || fresh.value.forceCreation,
				expectedMutation: this.mergeExpectedQualifiedEntityMutation(original.expectedMutation, fresh.expectedMutation),
				isNonbearing: original.isNonbearing && fresh.isNonbearing,
				hasOneRelationPath: original.hasOneRelationPath, // TODO this is completely wrong.
				eventListeners: this.mergeSingleEntityEventListeners(original.eventListeners, fresh.eventListeners),
			}
		}
		return {
			// Encoded within the placeholder
			isCreating: original.isCreating,
			where: original.where,
			entityName: original.entityName,
			filter: original.filter,

			// Not encoded within the placeholder
			alias: this.mergeSubTreeAliases(original.alias, fresh.alias),
			setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
			// forceCreation: original.value.forceCreation || fresh.value.forceCreation,
			expectedMutation: this.mergeExpectedQualifiedEntityMutation(original.expectedMutation, fresh.expectedMutation),
			isNonbearing: original.isNonbearing && fresh.isNonbearing,
			hasOneRelationPath: original.hasOneRelationPath, // TODO this is completely wrong.
			eventListeners: this.mergeSingleEntityEventListeners(original.eventListeners, fresh.eventListeners),
		}
	}

	public static mergeEntityListSubTreeParametersWithSamePlaceholders(
		original: QualifiedEntityList | UnconstrainedQualifiedEntityList,
		fresh: QualifiedEntityList | UnconstrainedQualifiedEntityList,
	): QualifiedEntityList | UnconstrainedQualifiedEntityList {
		if (original.initialEntityCount !== fresh.initialEntityCount) {
			throw new BindingError(
				`Detected sub trees of the same entity '${original.entityName}' with different preferred initial ` +
					`entity counts: '${original.initialEntityCount}' and '${fresh.initialEntityCount}' respectively.`,
			)
		}

		if (original.isCreating) {
			return {
				// Encoded within the placeholder
				isCreating: original.isCreating,
				entityName: original.entityName,

				// Not encoded within the placeholder
				alias: this.mergeSubTreeAliases(original.alias, fresh.alias),
				setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
				// forceCreation: original.value.forceCreation || fresh.value.forceCreation,
				expectedMutation: this.mergeExpectedQualifiedEntityMutation(original.expectedMutation, fresh.expectedMutation),
				isNonbearing: original.isNonbearing && fresh.isNonbearing,
				hasOneRelationPath: original.hasOneRelationPath, // TODO this is completely wrong.
				eventListeners: this.mergeEntityListEventListeners(original.eventListeners, fresh.eventListeners),
				initialEntityCount: original.initialEntityCount, // Handled above
			}
		}
		return {
			// Encoded within the placeholder
			isCreating: original.isCreating,
			entityName: original.entityName,
			filter: original.filter,
			orderBy: original.orderBy,
			offset: original.offset,
			limit: original.limit,

			// Not encoded within the placeholder
			alias: this.mergeSubTreeAliases(original.alias, fresh.alias),
			setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
			// forceCreation: original.value.forceCreation || fresh.value.forceCreation,
			expectedMutation: this.mergeExpectedQualifiedEntityMutation(original.expectedMutation, fresh.expectedMutation),
			isNonbearing: original.isNonbearing && fresh.isNonbearing,
			hasOneRelationPath: original.hasOneRelationPath, // TODO this is completely wrong.
			eventListeners: this.mergeEntityListEventListeners(original.eventListeners, fresh.eventListeners),
			initialEntityCount: original.initialEntityCount, // Handled above
		}
	}

	public static mergeEntityCreationParameters(
		original: EntityCreationParameters,
		fresh: EntityCreationParameters,
	): EntityCreationParameters {
		return {
			// forceCreation: original.forceCreation || fresh.forceCreation,
			isNonbearing: original.isNonbearing && fresh.isNonbearing,
			setOnCreate: this.mergeSetOnCreate(original.setOnCreate, fresh.setOnCreate),
		}
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
			beforePersist: this.mergeEventListeners(original.beforePersist, fresh.beforePersist),
			beforeUpdate: this.mergeEventListeners(original.beforeUpdate, fresh.beforeUpdate),
			connectionUpdate: this.mergeFieldScopedListeners(original.connectionUpdate, fresh.connectionUpdate),
			initialize: this.mergeEventListeners(original.initialize, fresh.initialize),
			update: this.mergeEventListeners(original.update, fresh.update),
			persistError: this.mergeEventListeners(original.persistError, fresh.persistError),
			persistSuccess: this.mergeEventListeners(original.persistSuccess, fresh.persistSuccess),
		}
	}

	public static mergeEntityListEventListeners(
		original: EntityListEventListeners['eventListeners'],
		fresh: EntityListEventListeners['eventListeners'],
	): EntityListEventListeners['eventListeners'] {
		return {
			beforePersist: this.mergeEventListeners(original.beforePersist, fresh.beforePersist),
			beforeUpdate: this.mergeEventListeners(original.beforeUpdate, fresh.beforeUpdate),
			childInitialize: this.mergeEventListeners(original.childInitialize, fresh.childInitialize),
			initialize: this.mergeEventListeners(original.initialize, fresh.initialize),
			persistError: this.mergeEventListeners(original.persistError, fresh.persistError),
			persistSuccess: this.mergeEventListeners(original.persistSuccess, fresh.persistSuccess),
			update: this.mergeEventListeners(original.update, fresh.update),
		}
	}

	public static cloneSingleEntityEventListeners(
		listeners: SingleEntityEventListeners['eventListeners'] | undefined,
	): SingleEntityEventListeners['eventListeners'] {
		return {
			beforePersist: this.cloneOptionalSet(listeners?.beforePersist),
			connectionUpdate: this.cloneOptionalMapOfSets(listeners?.connectionUpdate),
			update: this.cloneOptionalSet(listeners?.update),
			beforeUpdate: this.cloneOptionalSet(listeners?.beforeUpdate),
			initialize: this.cloneOptionalSet(listeners?.initialize),
			persistError: this.cloneOptionalSet(listeners?.persistError),
			persistSuccess: this.cloneOptionalSet(listeners?.persistSuccess),
		}
	}

	public static cloneEntityListEventListeners(
		listeners: EntityListEventListeners['eventListeners'] | undefined,
	): EntityListEventListeners['eventListeners'] {
		return {
			beforePersist: this.cloneOptionalSet(listeners?.beforePersist),
			beforeUpdate: this.cloneOptionalSet(listeners?.beforeUpdate),
			childInitialize: this.cloneOptionalSet(listeners?.childInitialize),
			initialize: this.cloneOptionalSet(listeners?.initialize),
			persistError: this.cloneOptionalSet(listeners?.persistError),
			persistSuccess: this.cloneOptionalSet(listeners?.persistSuccess),
			update: this.cloneOptionalSet(listeners?.update),
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

	private static mergeExpectedRelationMutation(
		original: ExpectedRelationMutation,
		fresh: ExpectedRelationMutation,
	): ExpectedRelationMutation {
		if (original === fresh) {
			return original
		}
		if (original === 'none') {
			return fresh
		}
		if (fresh === 'none') {
			return original
		}
		return 'anyMutation'
	}

	private static mergeExpectedQualifiedEntityMutation(
		original: ExpectedQualifiedEntityMutation,
		fresh: ExpectedQualifiedEntityMutation,
	): ExpectedQualifiedEntityMutation {
		if (original === fresh) {
			return original
		}
		if (original === 'none') {
			return fresh
		}
		if (fresh === 'none') {
			return original
		}
		return 'anyMutation'
	}

	private static mergeSubTreeAliases(
		original: Set<Alias> | undefined,
		fresh: Set<Alias> | undefined,
	): Set<Alias> | undefined {
		if (original === undefined) {
			return fresh
		}
		if (fresh === undefined) {
			return original
		}
		return this.mergeSets(original, fresh)
	}
}
