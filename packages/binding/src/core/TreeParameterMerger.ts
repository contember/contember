import { GraphQlBuilder } from '@contember/client'
import { BindingError } from '../BindingError'
import type {
	Alias,
	EntityCreationParameters,
	EntityEventListenerStore,
	EntityListEventListenerStore,
	ExpectedQualifiedEntityMutation,
	ExpectedRelationMutation,
	HasManyRelation,
	HasOneRelation,
	ParentEntityParameters,
	QualifiedEntityList,
	QualifiedSingleEntity,
	SetOnCreate,
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
			childEventListeners: this.mergeSingleEntityEventListeners(
				original.childEventListeners,
				fresh.childEventListeners,
			),
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
				childEventListeners: this.mergeSingleEntityEventListeners(
					original.childEventListeners,
					fresh.childEventListeners,
				),
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
			childEventListeners: this.mergeSingleEntityEventListeners(
				original.childEventListeners,
				fresh.childEventListeners,
			),
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

	private static mergeEventListeners<F extends Function>(
		original: Set<F> | undefined,
		fresh: Set<F> | undefined,
	): Set<F> | undefined {
		if (original === undefined) {
			return new Set(fresh)
		}
		if (fresh === undefined) {
			return new Set(original)
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

	public static mergeParentEntityParameters(
		original: ParentEntityParameters | undefined,
		fresh: ParentEntityParameters | undefined,
	): ParentEntityParameters | undefined {
		if (original === fresh) {
			return original
		}
		if (original === undefined) {
			return fresh
		}
		if (fresh === undefined) {
			return original
		}
		return {
			eventListeners: TreeParameterMerger.mergeSingleEntityEventListeners(
				original.eventListeners,
				fresh.eventListeners,
			),
		}
	}

	public static mergeInParentEntity<
		Original extends Record<Key, EntityEventListenerStore | undefined>,
		Key extends keyof Original
	>(original: Original, key: Key, parentEntity: ParentEntityParameters | undefined): Original {
		if (!parentEntity) {
			return original
		}

		return {
			...original,
			[key]: TreeParameterMerger.mergeSingleEntityEventListeners(original[key], parentEntity.eventListeners),
		}
	}

	public static mergeSingleEntityEventListeners(
		original: EntityEventListenerStore | undefined,
		fresh: EntityEventListenerStore | undefined,
	): EntityEventListenerStore | undefined {
		if (original === undefined) {
			if (fresh === undefined) {
				return undefined
			}
			return this.cloneSingleEntityEventListeners(fresh)
		}

		if (fresh === undefined) {
			return this.cloneSingleEntityEventListeners(original)
		}

		return this.mergeEventListenerStores(this.cloneSingleEntityEventListeners(original), fresh)
	}

	public static mergeEntityListEventListeners(
		original: EntityListEventListenerStore | undefined,
		fresh: EntityListEventListenerStore | undefined,
	): EntityListEventListenerStore | undefined {
		if (original === undefined) {
			if (fresh === undefined) {
				return undefined
			}
			return this.cloneEntityListEventListeners(fresh)
		}

		if (fresh === undefined) {
			return this.cloneEntityListEventListeners(original)
		}

		return this.mergeEventListenerStores(this.cloneEntityListEventListeners(original), fresh)
	}

	private static mergeEventListenerStores<Store extends Map<string, Set<Function>>>(
		original: Store,
		fresh: Store,
	): Store {
		for (const [eventName, fromFresh] of fresh) {
			const fromOriginal = original.get(eventName)

			if (fromOriginal === undefined) {
				original.set(eventName, new Set(fromFresh))
			} else {
				const newListeners = this.mergeEventListeners(fromOriginal, fromFresh)

				if (newListeners) {
					original.set(eventName, newListeners)
				}
			}
		}
		return original
	}

	public static cloneSingleEntityEventListeners(store: EntityEventListenerStore): EntityEventListenerStore {
		return new Map(store) as EntityEventListenerStore
	}

	public static cloneEntityListEventListeners(store: EntityListEventListenerStore): EntityListEventListenerStore {
		const cloned: EntityListEventListenerStore = new Map()

		for (const [eventName, listeners] of store) {
			cloned.set(eventName, new Set(listeners as Set<any>))
		}

		return cloned
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
