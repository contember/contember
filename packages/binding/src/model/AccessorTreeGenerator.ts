import { GraphQlBuilder } from '@contember/client'
import { emptyArray, noop } from '@contember/react-utils'
import * as ReactDOM from 'react-dom'
import { EntityAccessor, EntityListAccessor, FieldAccessor, GetSubTree, TreeRootAccessor } from '../accessors'
import {
	BoxedSingleEntityId,
	EntityFieldPersistedData,
	MutationDataResponse,
	PersistedEntityDataStore,
	QueryRequestResponse,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { TYPENAME_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import {
	EntityFieldMarkers,
	FieldMarker,
	hasAtLeastOneBearingField,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	PlaceholderGenerator,
	SubTreeMarker,
	SubTreeMarkerParameters,
} from '../markers'
import { EntityCreationParameters, EntityListPreferences, FieldName, Scalar } from '../treeParameters'
import { assertNever } from '../utils'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'
import {
	InternalEntityListState,
	InternalEntityState,
	InternalFieldState,
	InternalRootStateNode,
	InternalStateNode,
	InternalStateType,
	OnEntityListUpdate,
	OnEntityUpdate,
	OnFieldUpdate,
} from './internalState'
import { MarkerMerger } from './MarkerMerger'
import { MutationGenerator } from './MutationGenerator'
import { QueryResponseNormalizer } from './QueryResponseNormalizer'
import { TreeParameterMerger } from './TreeParameterMerger'

// This only applies to the 'beforeUpdate' event:

// If the listeners mutate the entity/list, other listeners may want to respond to that, which in turn may trigger
// further responses, etc. We don't want the order of addition of event listeners to matter and we don't have
// the necessary information to perform some sort of a topological sort. We wouldn't want to do that anyway
// though.

// To get around all this, we just trigger all event listeners repeatedly until things settle and they stop
// mutating the accessor. If, however, that doesn't happen until some number of iterations (I think the limit
// is actually fairly generous), we conclude that there is an infinite feedback loop and just shut things down.

// Notice also that we effectively shift the responsibility to check whether an update concerns them to the
// listeners.
const BEFORE_UPDATE_SETTLE_LIMIT = 20

enum ErrorPopulationMode {
	Add = 'add',
	Clear = 'clear',
}

export class AccessorTreeGenerator {
	private updateData: ((newData: TreeRootAccessor) => void) | undefined
	private persistedEntityData: PersistedEntityDataStore = new Map()

	// TODO deletes and disconnects cause memory leaks here as they don't traverse the tree to remove nested states.
	//  This could theoretically also be intentional given that both operations happen relatively infrequently,
	//  or at least rarely enough that we could potentially just ignore the problem (which we're doing now).
	//  Nevertheless, no real analysis has been done and it could turn out to be a problem.
	private entityStore: Map<string, InternalEntityState> = new Map()
	private subTreeStates: Map<string, InternalRootStateNode> = new Map()

	private currentErrors: ErrorsPreprocessor.ErrorTreeRoot | undefined

	private readonly getEntityByKey = (key: string) => {
		const entity = this.entityStore.get(key)

		if (entity === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent entity: key '${key}' was not found.`)
		}
		return entity.getAccessor()
	}
	private readonly getSubTree = ((parameters: SubTreeMarkerParameters) => {
		const placeholderName = PlaceholderGenerator.getSubTreeMarkerPlaceholder(parameters)
		const subTreeState = this.subTreeStates.get(placeholderName)

		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent accessor sub tree.`)
		}
		return subTreeState.getAccessor()
	}) as GetSubTree

	private readonly getAllEntities = (accessorTreeGenerator => {
		return function*(): Generator<EntityAccessor> {
			if (accessorTreeGenerator.isFrozenWhileUpdating) {
				throw new BindingError(`Cannot query all entitites while the tree is updating.`)
			}
			for (const [, entity] of accessorTreeGenerator.entityStore) {
				yield entity.getAccessor()
			}
		}
	})(this)

	private readonly getAllTypeNames = (): Set<string> => {
		const typeNames = new Set<string>()

		for (const [, { typeName }] of this.entityStore) {
			typeName && typeNames.add(typeName)
		}

		return typeNames
	}

	private isFrozenWhileUpdating = false
	private treeWideBatchUpdateDepth = 0
	private unpersistedChangesCount = 0

	public constructor(private markerTree: MarkerTreeRoot) {}

	public initializeLiveTree(
		queryResponse: QueryRequestResponse | undefined,
		updateData: (newData: TreeRootAccessor) => void,
	): void {
		const persistedData = QueryResponseNormalizer.normalizeResponse(queryResponse)

		this.persistedEntityData = persistedData.persistedEntityDataStore
		this.updateData = updateData

		for (const [placeholderName, marker] of this.markerTree.subTrees) {
			const subTreeState = this.initializeSubTree(marker, persistedData.subTreeDataStore.get(placeholderName))
			this.subTreeStates.set(placeholderName, subTreeState)
		}

		this.updateTreeRoot()
	}

	public generatePersistMutation() {
		if (this.unpersistedChangesCount === 0) {
			return undefined
		}
		const generator = new MutationGenerator(this.markerTree, this.subTreeStates, this.entityStore)

		return generator.getPersistMutation()
	}

	public setErrors(data: MutationDataResponse | undefined) {
		this.performRootTreeOperation(() => {
			if (this.currentErrors) {
				this.setRootStateErrors(this.currentErrors, ErrorPopulationMode.Clear)
			}

			const preprocessor = new ErrorsPreprocessor(data)
			const errorTreeRoot = preprocessor.preprocess()
			this.currentErrors = errorTreeRoot

			this.setRootStateErrors(errorTreeRoot, ErrorPopulationMode.Add)

			console.error('Errors', errorTreeRoot)
		})
	}

	public updatePersistedData(queryResponse: QueryRequestResponse | undefined) {
		this.performRootTreeOperation(() => {
			const normalizedResponse = QueryResponseNormalizer.normalizeResponse(queryResponse)
			this.persistedEntityData = normalizedResponse.persistedEntityDataStore

			const alreadyProcessed: Set<InternalEntityState> = new Set()

			let didUpdateSomething = false
			for (const [subTreePlaceholder, subTreeState] of this.subTreeStates) {
				const newSubTreeData = normalizedResponse.subTreeDataStore.get(subTreePlaceholder)

				if (subTreeState.type === InternalStateType.SingleEntity) {
					if (newSubTreeData instanceof BoxedSingleEntityId) {
						if (newSubTreeData.id === subTreeState.id) {
							didUpdateSomething =
								didUpdateSomething ||
								this.updateSingleEntityPersistedData(alreadyProcessed, subTreeState, newSubTreeData.id)
						} else {
							const newSubTreeState = this.initializeEntityAccessor(
								newSubTreeData.id,
								subTreeState.environment,
								subTreeState.fieldMarkers,
								subTreeState.creationParameters,
								subTreeState.onChildFieldUpdate,
							)
							newSubTreeState.hasPendingUpdate = true
							this.subTreeStates.set(subTreePlaceholder, newSubTreeState)
							didUpdateSomething = true
						}
					}
				} else if (subTreeState.type === InternalStateType.EntityList) {
					if (newSubTreeData instanceof Set) {
						didUpdateSomething =
							didUpdateSomething || this.updateEntityListPersistedData(alreadyProcessed, subTreeState, newSubTreeData)
					}
				} else {
					assertNever(subTreeState)
				}
			}
			if (!didUpdateSomething) {
				this.updateTreeRoot() // Still force an update, albeit without update events.
			}

			this.unpersistedChangesCount = 0
		})
	}

	private updateSingleEntityPersistedData(
		alreadyProcessed: Set<InternalEntityState>,
		state: InternalEntityState,
		newPersistedId: string,
	): boolean {
		if (alreadyProcessed.has(state)) {
			return false
		}
		alreadyProcessed.add(state)

		// TODO this entire process needs to also update realms!
		let didUpdate = false

		if (state.plannedHasOneDeletions?.size) {
			state.plannedHasOneDeletions.clear()
			didUpdate = true
		}

		if (newPersistedId !== state.id) {
			state.id = newPersistedId
			didUpdate = true
		}

		if (state.childrenWithPendingUpdates) {
			for (const child of state.childrenWithPendingUpdates) {
				if (child.type === InternalStateType.SingleEntity && child.id instanceof EntityAccessor.UnpersistedEntityId) {
					state.childrenWithPendingUpdates.delete(child) // We should delete it completely.
					didUpdate = true
				}
			}
		}

		const newPersistedData = this.persistedEntityData.get(this.idToKey(state.id))

		for (const [fieldPlaceholder, fieldState] of state.fields) {
			let didChildUpdate = false
			const newFieldDatum = newPersistedData?.get(fieldPlaceholder)

			switch (fieldState.type) {
				case InternalStateType.Field: {
					if (!(newFieldDatum instanceof Set) && !(newFieldDatum instanceof BoxedSingleEntityId)) {
						if (fieldState.persistedValue !== newFieldDatum) {
							fieldState.persistedValue = newFieldDatum
							fieldState.currentValue = newFieldDatum ?? fieldState.fieldMarker.defaultValue ?? null
							fieldState.hasUnpersistedChanges = false

							didChildUpdate = true
						}
					}
					break
				}
				case InternalStateType.SingleEntity: {
					const marker = state.fieldMarkers.get(fieldPlaceholder)

					if (!(marker instanceof HasOneRelationMarker)) {
						break
					}

					if (newFieldDatum instanceof BoxedSingleEntityId) {
						const previousFieldDatum = state.persistedData?.get(fieldPlaceholder)
						if (
							previousFieldDatum instanceof BoxedSingleEntityId &&
							newFieldDatum.id === previousFieldDatum.id &&
							newFieldDatum.id === fieldState.id
						) {
							didChildUpdate = this.updateSingleEntityPersistedData(alreadyProcessed, fieldState, fieldState.id)
						} else {
							// TODO delete the previous entity
							state.fields.set(
								fieldPlaceholder,
								this.initializeEntityAccessor(
									newFieldDatum.id,
									marker.environment,
									marker.fields,
									marker.relation,
									state.onChildFieldUpdate,
								),
							)
							didUpdate = true // Deliberately not child update
						}
					} else if (newFieldDatum === null || newFieldDatum === undefined) {
						state.fields.set(
							fieldPlaceholder,
							this.initializeEntityAccessor(
								new EntityAccessor.UnpersistedEntityId(),
								marker.environment,
								marker.fields,
								marker.relation,
								state.onChildFieldUpdate,
							),
						)
						didUpdate = true // Deliberately not child update
					}

					break
				}
				case InternalStateType.EntityList: {
					if (newFieldDatum instanceof Set || newFieldDatum === undefined) {
						didChildUpdate = this.updateEntityListPersistedData(
							alreadyProcessed,
							fieldState,
							newFieldDatum || new Set(),
						)
					}
					break
				}
				default:
					assertNever(fieldState)
			}

			if (didChildUpdate) {
				if (state.childrenWithPendingUpdates === undefined) {
					state.childrenWithPendingUpdates = new Set()
				}
				fieldState.hasPendingUpdate = true
				fieldState.hasStaleAccessor = true
				state.childrenWithPendingUpdates.add(fieldState)
				didUpdate = true
			}
		}

		if (didUpdate) {
			state.persistedData = newPersistedData
			state.hasStaleAccessor = true
			state.hasPendingUpdate = true
		}
		return didUpdate
	}

	private updateEntityListPersistedData(
		alreadyProcessed: Set<InternalEntityState>,
		state: InternalEntityListState,
		newPersistedData: Set<string>,
	): boolean {
		let didUpdate = false

		if (state.plannedRemovals?.size) {
			state.plannedRemovals.clear()
			didUpdate = true
		}

		if (state.childrenWithPendingUpdates) {
			for (const child of state.childrenWithPendingUpdates) {
				if (child.id instanceof EntityAccessor.UnpersistedEntityId) {
					state.childrenWithPendingUpdates.delete(child) // We should delete it completely.
					didUpdate = true
				}
			}
		}

		let haveSameKeySets = state.childrenKeys.size === newPersistedData.size

		if (haveSameKeySets) {
			const newKeyIterator = newPersistedData[Symbol.iterator]()
			for (const oldKey of state.childrenKeys) {
				if (!newPersistedData.has(oldKey)) {
					haveSameKeySets = false
					// TODO delete the corresponding state
				}
				// We also check the order
				const newKeyResult = newKeyIterator.next()
				if (!newKeyResult.done && newKeyResult.value !== oldKey) {
					haveSameKeySets = false
				}
			}
		}
		if (!haveSameKeySets) {
			didUpdate = true
		}

		state.persistedEntityIds = newPersistedData

		const initialData: Set<string | undefined> =
			newPersistedData.size > 0
				? newPersistedData
				: new Set(Array.from({ length: state.creationParameters.initialEntityCount }))

		state.childrenKeys.clear()

		for (const newPersistedId of initialData) {
			let key: string

			if (newPersistedId === undefined) {
				const newKey = new EntityAccessor.UnpersistedEntityId()

				this.initializeEntityAccessor(
					newKey,
					state.environment,
					state.fieldMarkers,
					state.creationParameters,
					state.onChildEntityUpdate,
				)
				key = newKey.value
				didUpdate = true
			} else {
				key = newPersistedId
				let childState = this.entityStore.get(newPersistedId)

				if (childState === undefined) {
					childState = this.initializeEntityAccessor(
						newPersistedId,
						state.environment,
						state.fieldMarkers,
						state.creationParameters,
						state.onChildEntityUpdate,
					)
					didUpdate = true
				} else {
					const didChildUpdate = this.updateSingleEntityPersistedData(alreadyProcessed, childState, newPersistedId)

					if (didChildUpdate) {
						didUpdate = true
						if (state.childrenWithPendingUpdates === undefined) {
							state.childrenWithPendingUpdates = new Set()
						}
						state.childrenWithPendingUpdates.add(childState)
					}
				}
			}
			state.childrenKeys.add(key)
		}

		if (didUpdate) {
			state.hasStaleAccessor = true
			state.hasPendingUpdate = true
		}
		return didUpdate
	}

	private setRootStateErrors(errorTreeRoot: ErrorsPreprocessor.ErrorTreeRoot, mode: ErrorPopulationMode) {
		for (const subTreePlaceholder in errorTreeRoot) {
			const rootError = errorTreeRoot[subTreePlaceholder]
			const rootState = this.subTreeStates.get(subTreePlaceholder)

			if (!rootState) {
				continue
			}
			switch (rootState.type) {
				case InternalStateType.SingleEntity: {
					if (rootError.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
						this.setEntityStateErrors(rootState, rootError, mode)
					}
					break
				}
				case InternalStateType.EntityList: {
					if (rootError.nodeType === ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
						this.setEntityListStateErrors(rootState, rootError, mode)
					}
					break
				}
			}
		}
	}

	private setEntityStateErrors(
		state: InternalEntityState,
		errors: ErrorsPreprocessor.FieldIndexedErrorNode | ErrorsPreprocessor.LeafErrorNode,
		mode: ErrorPopulationMode,
	) {
		state.hasStaleAccessor = true
		state.hasPendingUpdate = true
		state.errors = mode === ErrorPopulationMode.Add ? errors.errors : emptyArray

		if (errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
			return
		}

		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}

		for (const childKey in errors.children) {
			const child = errors.children[childKey]

			if (child.nodeType === ErrorsPreprocessor.ErrorNodeType.Leaf) {
				const fieldState = state.fields.get(childKey)

				if (fieldState?.type === InternalStateType.Field) {
					fieldState.hasStaleAccessor = true
					fieldState.hasPendingUpdate = true
					fieldState.errors = mode === ErrorPopulationMode.Add ? child.errors : emptyArray
					state.childrenWithPendingUpdates.add(fieldState)
					continue
				}
			}
			// Deliberately letting flow get here as well. Leaf errors *CAN* refer to relations as well.

			for (const [fieldPlaceholder, fieldState] of state.fields) {
				if (fieldState.type === InternalStateType.SingleEntity) {
					if (
						child.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed &&
						PlaceholderGenerator.isHasOneRelationFieldPlaceholder(childKey, fieldPlaceholder)
					) {
						state.childrenWithPendingUpdates.add(fieldState)
						this.setEntityStateErrors(fieldState, child, mode)
					}
				} else if (fieldState.type === InternalStateType.EntityList) {
					if (
						child.nodeType !== ErrorsPreprocessor.ErrorNodeType.FieldIndexed &&
						PlaceholderGenerator.isHasManyRelationFieldPlaceholder(childKey, fieldPlaceholder)
					) {
						state.childrenWithPendingUpdates.add(fieldState)
						this.setEntityListStateErrors(fieldState, child, mode)
					}
				}
			}
		}
	}

	private setEntityListStateErrors(
		state: InternalEntityListState,
		errors: ErrorsPreprocessor.KeyIndexedErrorNode | ErrorsPreprocessor.LeafErrorNode,
		mode: ErrorPopulationMode,
	) {
		state.hasStaleAccessor = true
		state.hasPendingUpdate = true
		state.errors = mode === ErrorPopulationMode.Add ? errors.errors : emptyArray

		if (errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			return
		}

		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}

		for (const childKey in errors.children) {
			const childError = errors.children[childKey]
			const childState = this.entityStore.get(childKey)

			if (childState && childError.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
				state.childrenWithPendingUpdates.add(childState)
				this.setEntityStateErrors(childState, childError, mode)
			}
		}
	}

	private performRootTreeOperation(operation: () => void) {
		this.treeWideBatchUpdateDepth++
		operation()
		this.treeWideBatchUpdateDepth--
		this.updateSubTrees()
	}

	private updateSubTrees() {
		if (this.treeWideBatchUpdateDepth > 0) {
			return
		}

		if (this.isFrozenWhileUpdating) {
			throw new BindingError(
				`Trying to perform an update while the whole accessor tree is already updating. This is most likely caused ` +
					`by updating the accessor tree during rendering or in the 'update' event handler, which is a no-op. ` +
					`If you wish to mutate the tree in reaction to changes, use the 'beforeUpdate' event handler.`,
			)
		}

		const rootsWithPendingUpdates = Array.from(this.subTreeStates.values()).filter(state => state.hasPendingUpdate)

		if (!rootsWithPendingUpdates.length) {
			return
		}

		ReactDOM.unstable_batchedUpdates(() => {
			this.isFrozenWhileUpdating = true
			this.updateTreeRoot()
			this.flushPendingAccessorUpdates(rootsWithPendingUpdates)
			this.isFrozenWhileUpdating = false
		})
	}

	private updateTreeRoot() {
		const treeRootAccessor = new TreeRootAccessor(
			this.unpersistedChangesCount !== 0,
			this.getEntityByKey,
			this.getSubTree,
			this.getAllEntities,
			this.getAllTypeNames,
		)

		this.updateData?.(treeRootAccessor)
	}

	private initializeSubTree(
		tree: SubTreeMarker,
		persistedRootData: BoxedSingleEntityId | Set<string> | undefined,
	): InternalRootStateNode {
		let subTreeState: InternalEntityState | InternalEntityListState

		if (tree.parameters.type === 'qualifiedEntityList' || tree.parameters.type === 'unconstrainedQualifiedEntityList') {
			const persistedEntityIds: Set<string> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListAccessor(
				tree.environment,
				tree.fields,
				{ initialEntityCount: 0, ...tree.parameters.value },
				noop,
				persistedEntityIds,
			)
		} else {
			const id =
				persistedRootData instanceof BoxedSingleEntityId
					? persistedRootData.id
					: new EntityAccessor.UnpersistedEntityId()
			subTreeState = this.initializeEntityAccessor(id, tree.environment, tree.fields, tree.parameters.value, noop)
		}
		this.subTreeStates.set(tree.placeholderName, subTreeState)

		return subTreeState
	}

	private initializeFromFieldMarker(
		entityState: InternalEntityState,
		field: FieldMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		if (fieldDatum instanceof Set) {
			throw new BindingError(
				`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		} else if (fieldDatum instanceof BoxedSingleEntityId) {
			throw new BindingError(
				`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use <HasOne />?`,
			)
		} else {
			const fieldState = this.initializeFieldAccessor(
				field.placeholderName,
				field,
				entityState.onChildFieldUpdate,
				fieldDatum,
			)
			entityState.fields.set(field.placeholderName, fieldState)
		}
	}

	private initializeFromHasOneRelationMarker(
		entityState: InternalEntityState,
		field: HasOneRelationMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		const relation = field.relation

		if (fieldDatum instanceof Set) {
			throw new BindingError(
				`Received a collection of entities for field '${relation.field}' where a single entity was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		} else if (fieldDatum instanceof BoxedSingleEntityId || fieldDatum === null || fieldDatum === undefined) {
			const entityId =
				fieldDatum instanceof BoxedSingleEntityId ? fieldDatum.id : new EntityAccessor.UnpersistedEntityId()
			const referenceEntityState = this.initializeEntityAccessor(
				entityId,
				field.environment,
				field.fields,
				field.relation,
				entityState.onChildFieldUpdate,
			)
			entityState.fields.set(field.placeholderName, referenceEntityState)
		} else {
			throw new BindingError(
				`Received a scalar value for field '${relation.field}' where a single entity was expected.` +
					`Perhaps you meant to use a variant of <Field />?`,
			)
		}
	}

	private initializeFromHasManyRelationMarker(
		entityState: InternalEntityState,
		field: HasManyRelationMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		const relation = field.relation

		if (fieldDatum === undefined || fieldDatum instanceof Set) {
			entityState.fields.set(
				field.placeholderName,
				this.initializeEntityListAccessor(
					field.environment,
					field.fields,
					relation,
					entityState.onChildFieldUpdate,
					fieldDatum || new Set(),
				),
			)
		} else if (typeof fieldDatum === 'object') {
			// Intentionally allowing `fieldDatum === null` here as well since this should only happen when a *hasOne
			// relation is unlinked, e.g. a Person does not have a linked Nationality.
			throw new BindingError(
				`Received a referenced entity for field '${relation.field}' where a collection of entities was expected.` +
					`Perhaps you wanted to use a <HasOne />?`,
			)
		} else {
			throw new BindingError(
				`Received a scalar value for field '${relation.field}' where a collection of entities was expected.` +
					`Perhaps you meant to use a variant of <Field />?`,
			)
		}
	}

	private initializeEntityFields(entityState: InternalEntityState, fieldMarkers: EntityFieldMarkers): void {
		for (const [placeholderName, field] of fieldMarkers) {
			const fieldDatum = entityState.persistedData?.get(placeholderName)
			if (field instanceof FieldMarker) {
				this.initializeFromFieldMarker(entityState, field, fieldDatum)
			} else if (field instanceof HasOneRelationMarker) {
				this.initializeFromHasOneRelationMarker(entityState, field, fieldDatum)
			} else if (field instanceof HasManyRelationMarker) {
				this.initializeFromHasManyRelationMarker(entityState, field, fieldDatum)
			} else if (field instanceof SubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else {
				assertNever(field)
			}
		}
	}

	private mergeInEntityFields(existingEntityState: InternalEntityState, newFieldMarkers: EntityFieldMarkers): void {
		for (const [placeholderName, field] of newFieldMarkers) {
			const fieldState = existingEntityState.fields.get(placeholderName)
			const fieldDatum = existingEntityState.persistedData?.get(placeholderName)

			if (field instanceof FieldMarker) {
				// Merge markers but don't re-initialize the state. It shouldn't be needed.
				if (fieldState === undefined) {
					this.initializeFromFieldMarker(existingEntityState, field, fieldDatum)
				} else if (fieldState.type === InternalStateType.Field) {
					fieldState.fieldMarker = MarkerMerger.mergeFieldMarkers(fieldState.fieldMarker, field)
				}
			} else if (field instanceof HasOneRelationMarker) {
				if (fieldState === undefined || fieldState.type === InternalStateType.SingleEntity) {
					// This method calls initializeEntityAccessor which handles the merging on its own.
					this.initializeFromHasOneRelationMarker(existingEntityState, field, fieldDatum)
				}
			} else if (field instanceof HasManyRelationMarker) {
				if (fieldState === undefined) {
					this.initializeFromHasManyRelationMarker(existingEntityState, field, fieldDatum)
				} else if (fieldState.type === InternalStateType.EntityList) {
					for (const childKey of fieldState.childrenKeys) {
						const childState = this.entityStore.get(childKey)!
						this.initializeEntityAccessor(
							childState.id,
							fieldState.environment,
							newFieldMarkers,
							fieldState.creationParameters,
							fieldState.onChildEntityUpdate,
						)
					}
					fieldState.fieldMarkers = MarkerMerger.mergeEntityFields(fieldState.fieldMarkers, newFieldMarkers)
				}
			} else if (field instanceof SubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else {
				assertNever(field)
			}
		}
	}

	private initializeEntityAccessor(
		id: string | EntityAccessor.UnpersistedEntityId,
		environment: Environment,
		fieldMarkers: EntityFieldMarkers,
		creationParameters: EntityCreationParameters,
		onEntityUpdate: OnEntityUpdate,
	): InternalEntityState {
		const entityKey = this.idToKey(id)
		const existingEntityState = this.entityStore.get(entityKey)

		if (existingEntityState !== undefined) {
			existingEntityState.fieldMarkers = MarkerMerger.mergeEntityFields(existingEntityState.fieldMarkers, fieldMarkers)
			existingEntityState.realms.add(onEntityUpdate)
			existingEntityState.hasStaleAccessor = true
			existingEntityState.creationParameters = {
				forceCreation: existingEntityState.creationParameters.forceCreation || creationParameters.forceCreation,
				isNonbearing: existingEntityState.creationParameters.isNonbearing && creationParameters.isNonbearing, // If either is false, it's bearing
				setOnCreate: TreeParameterMerger.mergeSetOnCreate(
					existingEntityState.creationParameters.setOnCreate,
					creationParameters.setOnCreate,
				),
			}

			if (!existingEntityState.hasAtLeastOneBearingField) {
				existingEntityState.hasAtLeastOneBearingField = hasAtLeastOneBearingField(fieldMarkers)
			}
			this.mergeInEntityFields(existingEntityState, fieldMarkers)

			return existingEntityState
		}

		const entityState: InternalEntityState = {
			type: InternalStateType.SingleEntity,
			addEventListener: undefined as any,
			batchUpdateDepth: 0,
			childrenWithPendingUpdates: undefined,
			creationParameters,
			environment,
			errors: emptyArray,
			eventListeners: {
				update: undefined,
				beforeUpdate: undefined,
			},
			fields: new Map(),
			fieldMarkers,
			hasAtLeastOneBearingField: hasAtLeastOneBearingField(fieldMarkers),
			hasPendingUpdate: false,
			hasPendingParentNotification: false,
			hasStaleAccessor: true,
			id,
			isScheduledForDeletion: false,
			persistedData: this.persistedEntityData.get(entityKey),
			plannedHasOneDeletions: undefined,
			realms: new Set([onEntityUpdate]),
			typeName: undefined,
			getAccessor: (() => {
				let accessor: EntityAccessor | undefined = undefined
				return () => {
					if (entityState.hasStaleAccessor || accessor === undefined) {
						entityState.hasStaleAccessor = false
						accessor = new EntityAccessor(
							entityState.id,
							entityState.typeName,

							// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
							// keep in sync two copies of the same data. TS hides the extra info anyway.
							entityState.fields,
							entityState.errors,
							entityState.environment,
							entityState.addEventListener,
							entityState.batchUpdates,
							entityState.connectEntityAtField,
							entityState.disconnectEntityAtField,
							entityState.deleteEntity,
						)
					}
					return accessor
				}
			})(),
			onChildFieldUpdate: (updatedState: InternalStateNode) => {
				// No before update for child updates!
				batchUpdatesImplementation(() => {
					if (updatedState.type === InternalStateType.SingleEntity && updatedState.isScheduledForDeletion) {
						processEntityDeletion(updatedState)
					} else {
						this.markChildStateInNeedOfUpdate(entityState, updatedState)
					}
					entityState.hasStaleAccessor = true
					entityState.hasPendingParentNotification = true
				})
			},
			batchUpdates: performUpdates => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						batchUpdatesImplementation(performUpdates)
					})
				})
			},
			connectEntityAtField: (placeholderName, entityToConnectOrItsKey) => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const hasOneMarker = resolveHasOneRelationMarker(
							placeholderName,
							`Cannot connect at field '${placeholderName}' as it doesn't refer to a has one relation. ` +
								`Perhaps you forgot to generate a placeholder?`,
						)
						const previouslyConnectedState = entityState.fields.get(placeholderName)

						if (
							previouslyConnectedState === undefined ||
							previouslyConnectedState.type !== InternalStateType.SingleEntity
						) {
							this.rejectInvalidAccessorTree()
						}

						const [connectedEntityKey, newlyConnectedState] = this.resolveAndPrepareEntityToConnect(
							entityToConnectOrItsKey,
						)

						if (previouslyConnectedState === newlyConnectedState) {
							return // Do nothing.
						}
						// TODO remove from planned deletions if appropriate

						const persistedKey = entityState.persistedData?.get(placeholderName)
						if (persistedKey instanceof BoxedSingleEntityId) {
							if (persistedKey.id === connectedEntityKey) {
								this.unpersistedChangesCount-- // It was removed from the list but now we're adding it back.
							} else if (persistedKey.id === this.idToKey(previouslyConnectedState.id)) {
								this.unpersistedChangesCount++ // We're changing it from the persisted id.
							}
						} else if (previouslyConnectedState.id instanceof EntityAccessor.UnpersistedEntityId) {
							// This assumes the invariant enforced above that we cannot connect unpersisted entities.
							// Hence the previouslyConnectedState still refers to the entity created initially.

							if (
								persistedKey === null || // We're updating.
								(persistedKey === undefined && // We're creating.
									(!entityState.hasAtLeastOneBearingField || !hasOneMarker.relation.isNonbearing))
							) {
								this.unpersistedChangesCount++
							}
						}

						// TODO do something about the existing state…

						newlyConnectedState.realms.add(entityState.onChildFieldUpdate)
						entityState.fields.set(placeholderName, newlyConnectedState)
						entityState.hasStaleAccessor = true
						entityState.hasPendingParentNotification = true
					})
				})
			},
			disconnectEntityAtField: placeholderName => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const hasOneMarker = resolveHasOneRelationMarker(
							placeholderName,
							`Cannot disconnect the field '${placeholderName}' as it doesn't refer to a has one relation. ` +
								`Perhaps you forgot to generate a placeholder?`,
						)
						const stateToDisconnect = entityState.fields.get(placeholderName)

						if (stateToDisconnect === undefined) {
							throw new BindingError(`Cannot disconnect field '${placeholderName}' as it doesn't exist.`)
						}
						if (stateToDisconnect.type !== InternalStateType.SingleEntity) {
							this.rejectInvalidAccessorTree()
						}

						const persistedKey = entityState.persistedData?.get(placeholderName)

						if (persistedKey instanceof BoxedSingleEntityId && persistedKey.id === this.idToKey(stateToDisconnect.id)) {
							this.unpersistedChangesCount++
						} else {
							// Do nothing. Disconnecting unpersisted entities doesn't change the count.
						}

						stateToDisconnect.realms.delete(entityState.onChildFieldUpdate)

						// TODO update changes count?

						const newEntityState = this.initializeEntityAccessor(
							new EntityAccessor.UnpersistedEntityId(),
							hasOneMarker.environment,
							hasOneMarker.fields,
							hasOneMarker.relation,
							entityState.onChildFieldUpdate,
						)
						entityState.fields.set(placeholderName, newEntityState)

						entityState.hasStaleAccessor = true
						entityState.hasPendingParentNotification = true
					})
				})
			},
			deleteEntity: () => {
				this.performRootTreeOperation(() => {
					// Deliberately not calling performOperationWithBeforeUpdate ‒ no beforeUpdate events after deletion
					batchUpdatesImplementation(() => {
						if (typeof entityState.id === 'string') {
							this.unpersistedChangesCount++
						}
						entityState.isScheduledForDeletion = true
						entityState.hasPendingParentNotification = true
					})
				})
			},
		}
		entityState.addEventListener = this.getAddEventListener(entityState)
		this.entityStore.set(entityKey, entityState)

		const typeName = entityState.persistedData?.get(TYPENAME_KEY_NAME)

		if (typeof typeName === 'string') {
			entityState.typeName = typeName
		}
		if (creationParameters.forceCreation && id instanceof EntityAccessor.UnpersistedEntityId) {
			this.unpersistedChangesCount++
		}

		const batchUpdatesImplementation: EntityAccessor.BatchUpdates = performUpdates => {
			if (entityState.isScheduledForDeletion) {
				throw new BindingError(`Trying to update an entity (or something within said entity) that has been deleted.`)
			}
			entityState.batchUpdateDepth++
			performUpdates(entityState.getAccessor)
			entityState.batchUpdateDepth--

			if (
				entityState.batchUpdateDepth === 0 &&
				// We must have already told the parent if hasPendingUpdate is true. However, we may have updated the entity
				// and then subsequently deleted it, in which case we want to let the parent know regardless.
				(!entityState.hasPendingUpdate || entityState.isScheduledForDeletion) &&
				entityState.hasPendingParentNotification
			) {
				entityState.hasPendingUpdate = true
				entityState.hasPendingParentNotification = false
				for (const onUpdate of entityState.realms) {
					onUpdate(entityState)
				}
			}
		}

		const performOperationWithBeforeUpdate = (operation: () => void) => {
			batchUpdatesImplementation(getAccessor => {
				operation()

				if (
					!entityState.hasPendingParentNotification || // That means the operation hasn't done anything
					entityState.eventListeners.beforeUpdate === undefined ||
					entityState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				let currentAccessor: EntityAccessor
				for (let i = 0; i < BEFORE_UPDATE_SETTLE_LIMIT; i++) {
					currentAccessor = getAccessor()
					for (const listener of entityState.eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (currentAccessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}

		const processEntityDeletion = (deletedState: InternalEntityState) => {
			const relevantPlaceholders = new Set<FieldName>()

			// All has one relations where this entity is present.
			for (const [placeholderName, candidateState] of entityState.fields) {
				if (candidateState === deletedState) {
					relevantPlaceholders.add(placeholderName)
				}
			}

			if (typeof deletedState.id === 'string') {
				if (entityState.plannedHasOneDeletions === undefined) {
					entityState.plannedHasOneDeletions = new Map()
				}
				for (const placeholderName of relevantPlaceholders) {
					entityState.plannedHasOneDeletions.set(placeholderName, deletedState)
				}
			}

			for (const placeholderName of relevantPlaceholders) {
				const newEntityState = this.initializeEntityAccessor(
					new EntityAccessor.UnpersistedEntityId(),
					deletedState.environment,
					deletedState.fieldMarkers,
					deletedState.creationParameters,
					entityState.onChildFieldUpdate,
				)
				entityState.fields.set(placeholderName, newEntityState)
			}
			// TODO update the changes count
			entityState.childrenWithPendingUpdates?.delete(deletedState)
		}

		const resolveHasOneRelationMarker = (field: FieldName, message: string): HasOneRelationMarker => {
			const hasOneRelation = entityState.fieldMarkers.get(field)

			if (!(hasOneRelation instanceof HasOneRelationMarker)) {
				throw new BindingError(message)
			}
			return hasOneRelation
		}

		this.initializeEntityFields(entityState, fieldMarkers)
		return entityState
	}

	private initializeEntityListAccessor(
		environment: Environment,
		fieldMarkers: EntityFieldMarkers,
		creationParameters: EntityCreationParameters & EntityListPreferences,
		onEntityListUpdate: OnEntityListUpdate,
		persistedEntityIds: Set<string>,
	): InternalEntityListState {
		const entityListState: InternalEntityListState = {
			type: InternalStateType.EntityList,
			creationParameters,
			fieldMarkers,
			onEntityListUpdate,
			persistedEntityIds,
			addEventListener: undefined as any,
			batchUpdateDepth: 0,
			childrenKeys: new Set(),
			childrenWithPendingUpdates: undefined,
			environment,
			eventListeners: {
				update: undefined,
				beforeUpdate: undefined,
			},
			errors: emptyArray,
			plannedRemovals: undefined,
			hasPendingParentNotification: false,
			hasPendingUpdate: false,
			hasStaleAccessor: true,
			getAccessor: (() => {
				let accessor: EntityListAccessor | undefined = undefined
				return () => {
					if (entityListState.hasStaleAccessor || accessor === undefined) {
						entityListState.hasStaleAccessor = false
						accessor = new EntityListAccessor(
							entityListState.getChildEntityByKey,
							entityListState.childrenKeys,
							entityListState.errors,
							entityListState.addEventListener,
							entityListState.batchUpdates,
							entityListState.connectEntity,
							entityListState.createNewEntity,
							entityListState.disconnectEntity,
						)
					}
					return accessor
				}
			})(),
			onChildEntityUpdate: updatedState => {
				if (updatedState.type !== InternalStateType.SingleEntity) {
					throw new BindingError(`Illegal entity list value.`)
				}

				// No beforeUpdate for child updates!
				batchUpdatesImplementation(() => {
					if (updatedState.isScheduledForDeletion) {
						processEntityDeletion(updatedState)
					} else {
						this.markChildStateInNeedOfUpdate(entityListState, updatedState)
					}
					entityListState.hasPendingParentNotification = true
					entityListState.hasStaleAccessor = true
				})
			},
			batchUpdates: performUpdates => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						batchUpdatesImplementation(performUpdates)
					})
				})
			},
			connectEntity: entityToConnectOrItsKey => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const [connectedEntityKey, connectedState] = this.resolveAndPrepareEntityToConnect(entityToConnectOrItsKey)

						if (entityListState.childrenKeys.has(connectedEntityKey)) {
							return
						}

						connectedState.realms.add(entityListState.onChildEntityUpdate)
						entityListState.childrenKeys.add(connectedEntityKey)
						entityListState.plannedRemovals?.delete(connectedState)

						if (entityListState.persistedEntityIds.has(connectedEntityKey)) {
							// It was removed from the list but now we're adding it back.
							this.unpersistedChangesCount--
						} else {
							this.unpersistedChangesCount++
						}

						entityListState.hasPendingParentNotification = true
						entityListState.hasStaleAccessor = true
					})
				})
			},
			createNewEntity: initialize => {
				entityListState.batchUpdates(() => {
					const newState = generateNewEntityState(undefined)
					this.markChildStateInNeedOfUpdate(entityListState, newState)
					entityListState.hasPendingParentNotification = true
					initialize && newState.batchUpdates(initialize)
				})
			},
			disconnectEntity: childEntityOrItsKey => {
				// TODO disallow this if the EntityList is at the top level
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const disconnectedChildKey =
							typeof childEntityOrItsKey === 'string' ? childEntityOrItsKey : childEntityOrItsKey.key

						const disconnectedChildState = this.entityStore.get(disconnectedChildKey)
						if (disconnectedChildState === undefined) {
							throw new BindingError(
								`EntityListAccessor: Cannot remove entity with key '${disconnectedChildKey}' as it doesn't exist.`,
							)
						}

						if (!entityListState.childrenKeys.has(disconnectedChildKey)) {
							throw new BindingError(
								`Entity list doesn't include an entity with key '${disconnectedChildKey}' and so it cannot remove it.`,
							)
						}
						const didDelete = disconnectedChildState.realms.delete(entityListState.onChildEntityUpdate)
						if (!didDelete) {
							this.rejectInvalidAccessorTree()
						}
						if (entityListState.persistedEntityIds.has(disconnectedChildKey)) {
							if (entityListState.plannedRemovals === undefined) {
								entityListState.plannedRemovals = new Map()
							}
							entityListState.plannedRemovals.set(disconnectedChildState, 'disconnect')
						}

						if (entityListState.persistedEntityIds.has(disconnectedChildKey)) {
							this.unpersistedChangesCount++
						} else {
							// It wasn't on the list, then it was, and now we're removing it again.
							this.unpersistedChangesCount--
						}

						entityListState.childrenKeys.delete(disconnectedChildKey)
						entityListState.hasPendingParentNotification = true
						entityListState.hasStaleAccessor = true
					})
				})
			},
			getChildEntityByKey: key => {
				if (!entityListState.childrenKeys.has(key)) {
					throw new BindingError(`EntityList: cannot retrieve an entity with key '${key}' as is is not on the list.`)
				}
				const entity = this.getEntityByKey(key)
				if (entity === null) {
					throw new BindingError(`Corrupted data`)
				}
				return entity
			},
		}
		entityListState.addEventListener = this.getAddEventListener(entityListState)

		const batchUpdatesImplementation: EntityListAccessor.BatchUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			performUpdates(entityListState.getAccessor)
			entityListState.batchUpdateDepth--

			if (
				entityListState.batchUpdateDepth === 0 &&
				!entityListState.hasPendingUpdate && // We must have already told the parent if this is true.
				entityListState.hasPendingParentNotification
			) {
				entityListState.hasPendingUpdate = true
				entityListState.hasPendingParentNotification = false
				entityListState.onEntityListUpdate(entityListState)
			}
		}

		const performOperationWithBeforeUpdate = (operation: () => void) => {
			batchUpdatesImplementation(getAccessor => {
				operation()

				if (
					!entityListState.hasPendingParentNotification || // That means the operation hasn't done anything.
					entityListState.eventListeners.beforeUpdate === undefined ||
					entityListState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				let currentAccessor: EntityListAccessor
				for (let i = 0; i < BEFORE_UPDATE_SETTLE_LIMIT; i++) {
					currentAccessor = getAccessor()
					for (const listener of entityListState.eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (currentAccessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}

		const processEntityDeletion = (stateForDeletion: InternalEntityState) => {
			// We don't remove entities from the store so as to allow their re-connection.
			entityListState.childrenWithPendingUpdates?.delete(stateForDeletion)

			const key = this.idToKey(stateForDeletion.id)
			entityListState.childrenKeys.delete(key)
			entityListState.hasPendingParentNotification = true

			if (stateForDeletion.id instanceof EntityAccessor.UnpersistedEntityId) {
				return
			}

			if (entityListState.plannedRemovals === undefined) {
				entityListState.plannedRemovals = new Map()
			}
			entityListState.plannedRemovals.set(stateForDeletion, 'delete')
		}

		const generateNewEntityState = (persistedId: string | undefined): InternalEntityState => {
			const id = persistedId === undefined ? new EntityAccessor.UnpersistedEntityId() : persistedId
			const key = this.idToKey(id)

			const entityState = this.initializeEntityAccessor(
				id,
				entityListState.environment,
				entityListState.fieldMarkers,
				entityListState.creationParameters,
				entityListState.onChildEntityUpdate,
			)

			entityListState.hasStaleAccessor = true
			entityListState.childrenKeys.add(key)

			return entityState
		}

		const initialData: Set<string | undefined> =
			persistedEntityIds.size === 0
				? new Set(Array.from({ length: creationParameters.initialEntityCount }))
				: persistedEntityIds
		for (const entityId of initialData) {
			generateNewEntityState(entityId)
		}

		return entityListState
	}

	private initializeFieldAccessor(
		placeholderName: FieldName,
		fieldMarker: FieldMarker,
		onFieldUpdate: OnFieldUpdate,
		persistedValue: Scalar | undefined,
	): InternalFieldState {
		const resolvedFieldValue = persistedValue ?? fieldMarker.defaultValue ?? null

		const fieldState: InternalFieldState = {
			type: InternalStateType.Field,
			fieldMarker,
			onFieldUpdate,
			placeholderName,
			persistedValue,
			currentValue: resolvedFieldValue,
			addEventListener: undefined as any,
			eventListeners: {
				beforeUpdate: undefined,
				update: undefined,
			},
			errors: emptyArray,
			touchLog: undefined,
			hasPendingUpdate: false,
			hasUnpersistedChanges: false,
			hasStaleAccessor: true,
			getAccessor: (() => {
				let accessor: FieldAccessor | undefined = undefined
				return () => {
					if (fieldState.hasStaleAccessor || accessor === undefined) {
						fieldState.hasStaleAccessor = false
						accessor = new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
							fieldState.placeholderName,
							fieldState.currentValue,
							fieldState.persistedValue === undefined ? null : fieldState.persistedValue,
							fieldState.fieldMarker.defaultValue,
							fieldState.errors,
							fieldState.hasUnpersistedChanges,
							fieldState.isTouchedBy,
							fieldState.addEventListener,
							fieldState.updateValue,
						)
					}
					return accessor
				}
			})(),
			updateValue: (
				newValue: Scalar | GraphQlBuilder.Literal,
				{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
			) => {
				this.performRootTreeOperation(() => {
					if (fieldState.touchLog === undefined) {
						fieldState.touchLog = new Map()
					}
					fieldState.touchLog.set(agent, true)
					if (newValue === fieldState.currentValue) {
						return
					}
					fieldState.currentValue = newValue
					fieldState.hasPendingUpdate = true
					fieldState.hasStaleAccessor = true

					const resolvedValue =
						fieldState.fieldMarker.defaultValue === undefined
							? newValue
							: newValue === null
							? fieldState.fieldMarker.defaultValue
							: newValue
					const normalizedValue = resolvedValue instanceof GraphQlBuilder.Literal ? resolvedValue.value : resolvedValue
					const normalizedPersistedValue = fieldState.persistedValue === undefined ? null : fieldState.persistedValue
					const hadUnpersistedChangesBefore = fieldState.hasUnpersistedChanges
					const hasUnpersistedChangesNow = normalizedValue !== normalizedPersistedValue
					fieldState.hasUnpersistedChanges = hasUnpersistedChangesNow

					// TODO if the entity only has nonbearing fields, this should be true.
					const shouldInfluenceUpdateCount =
						!fieldState.fieldMarker.isNonbearing || fieldState.persistedValue !== undefined

					if (shouldInfluenceUpdateCount) {
						if (!hadUnpersistedChangesBefore && hasUnpersistedChangesNow) {
							this.unpersistedChangesCount++
						} else if (hadUnpersistedChangesBefore && !hasUnpersistedChangesNow) {
							this.unpersistedChangesCount--
						}
					}

					fieldState.onFieldUpdate(fieldState)

					// Deliberately firing this *AFTER* letting the parent know.
					// Listeners are likely to invoke a parent's batchUpdates, and so the parents should be up to date.
					if (fieldState.eventListeners.beforeUpdate) {
						for (const listener of fieldState.eventListeners.beforeUpdate) {
							listener(fieldState.getAccessor())
						}
					}
				})
			},
			isTouchedBy: (agent: string) =>
				fieldState.touchLog === undefined ? false : fieldState.touchLog.get(agent) || false,
		}
		fieldState.addEventListener = this.getAddEventListener(fieldState)
		return fieldState
	}

	private rejectInvalidAccessorTree(): never {
		throw new BindingError(
			`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
		)
	}

	private idToKey(id: string | EntityAccessor.UnpersistedEntityId) {
		if (typeof id === 'string') {
			return id
		}
		return id.value
	}

	private markChildStateInNeedOfUpdate(
		entityListState: InternalEntityListState,
		updatedState: InternalEntityState,
	): void
	private markChildStateInNeedOfUpdate(entityState: InternalEntityState, updatedState: InternalStateNode): void
	private markChildStateInNeedOfUpdate(
		state: InternalEntityListState | InternalEntityState,
		updatedState: InternalStateNode,
	): void {
		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}
		state.childrenWithPendingUpdates.add(updatedState as InternalEntityState)
	}

	private resolveAndPrepareEntityToConnect(
		entityToConnectOrItsKey: string | EntityAccessor,
	): [string, InternalEntityState] {
		let connectedEntityKey: string

		if (typeof entityToConnectOrItsKey === 'string') {
			connectedEntityKey = entityToConnectOrItsKey
		} else {
			if (!entityToConnectOrItsKey.existsOnServer) {
				throw new BindingError(
					`Attempting to connect an entity with key '${entityToConnectOrItsKey.key}' that ` +
						`doesn't exist on server. That is currently impossible.`, // At least for now.
				)
			}
			connectedEntityKey = entityToConnectOrItsKey.key
		}

		const connectedState = this.entityStore.get(connectedEntityKey)
		if (connectedState === undefined) {
			throw new BindingError(`Attempting to connect an entity with key '${connectedEntityKey}' but it doesn't exist.`)
		}
		if (connectedState.isScheduledForDeletion) {
			// As far as the other realms are concerned, this entity is deleted. We don't want to just make it re-appear
			// for them just because some other random relation decided to connect it.
			connectedState.realms.clear()
			connectedState.isScheduledForDeletion = false
		}

		return [connectedEntityKey, connectedState]
	}

	private getAddEventListener(state: {
		eventListeners: {
			[eventType: string]: Set<Function> | undefined
		}
	}) {
		return (type: string, listener: Function) => {
			if (state.eventListeners[type] === undefined) {
				state.eventListeners[type] = new Set<never>()
			}
			state.eventListeners[type]!.add(listener as any)
			return () => {
				if (state.eventListeners[type] === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				state.eventListeners[type]!.delete(listener as any)
				if (state.eventListeners[type]!.size === 0) {
					state.eventListeners[type] = undefined
				}
			}
		}
	}

	private flushPendingAccessorUpdates(rootStates: Array<InternalEntityState | InternalEntityListState>) {
		// It is *CRUCIAL* that this is a BFS so that we update the components in top-down order.
		const agenda: InternalStateNode[] = rootStates

		for (const state of agenda) {
			if (!state.hasPendingUpdate) {
				continue
			}
			state.hasPendingUpdate = false

			if (state.eventListeners.update !== undefined) {
				//console.log(state)
				for (const handler of state.eventListeners.update) {
					// TS can't quite handle the polymorphism here but this is fine.
					handler(state.getAccessor() as any)
				}
			}
			switch (state.type) {
				case InternalStateType.SingleEntity:
				case InternalStateType.EntityList: {
					if (state.childrenWithPendingUpdates !== undefined) {
						for (const childState of state.childrenWithPendingUpdates) {
							agenda.push(childState)
						}
						state.childrenWithPendingUpdates = undefined
					}
					break
				}
				case InternalStateType.Field:
					// Do nothing
					break
				default:
					assertNever(state)
			}
		}
	}
}
