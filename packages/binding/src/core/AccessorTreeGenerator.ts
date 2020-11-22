import { GraphQlBuilder, GraphQlClient, TreeFilter } from '@contember/client'
import { emptyArray, noop } from '@contember/react-utils'
import * as ReactDOM from 'react-dom'
import { validate as uuidValidate } from 'uuid'
import { BindingOperations, EntityAccessor, EntityListAccessor, FieldAccessor, TreeRootAccessor } from '../accessors'
import {
	ClientGeneratedUuid,
	EntityFieldPersistedData,
	metadataToRequestError,
	MutationDataResponse,
	MutationErrorType,
	NormalizedQueryResponseData,
	PersistedEntityDataStore,
	PersistResultSuccessType,
	QueryRequestResponse,
	RequestError,
	ServerGeneratedUuid,
	SuccessfulPersistResult,
	UnpersistedEntityKey,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	PlaceholderGenerator,
	SubTreeMarker,
	SubTreeMarkerParameters,
} from '../markers'
import {
	Alias,
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
	EntityCreationParameters,
	EntityListEventListeners,
	EntityListPreferences,
	FieldName,
	Scalar,
	SingleEntityEventListeners,
} from '../treeParameters'
import { assertNever } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import {
	InternalEntityListState,
	InternalEntityState,
	InternalFieldState,
	InternalRootStateNode,
	InternalStateIterator,
	InternalStateNode,
	InternalStateType,
	OnEntityListUpdate,
	OnEntityUpdate,
	OnFieldUpdate,
} from './internalState'
import { MarkerMerger } from './MarkerMerger'
import { MutationGenerator } from './MutationGenerator'
import { QueryGenerator } from './QueryGenerator'
import { QueryResponseNormalizer } from './QueryResponseNormalizer'
import { TreeFilterGenerator } from './TreeFilterGenerator'
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

export class AccessorTreeGenerator {
	private readonly treeFilterGenerator: TreeFilterGenerator
	private readonly accessorErrorManager: AccessorErrorManager

	private updateData: ((newData: TreeRootAccessor) => void) | undefined = undefined
	private yieldError: ((error: RequestError) => void) | undefined = undefined
	private persistedEntityData: PersistedEntityDataStore = new Map()

	// TODO deletes and disconnects cause memory leaks here as they don't traverse the tree to remove nested states.
	//  This could theoretically also be intentional given that both operations happen relatively infrequently,
	//  or at least rarely enough that we could potentially just ignore the problem (which we're doing now).
	//  Nevertheless, no real analysis has been done and it could turn out to be a problem.
	private entityStore: Map<string, InternalEntityState> = new Map()
	private subTreeStates: Map<string, InternalRootStateNode> = new Map()

	private newlyInitializedWithListeners: Set<InternalEntityListState | InternalEntityState> = new Set()

	// private treeRootListeners: {
	// 	eventListeners: {}
	// } = {
	// 	eventListeners: {},
	// }

	private readonly bindingOperations = Object.freeze<BindingOperations>({
		getAllEntities: (accessorTreeGenerator => {
			return function* (): Generator<EntityAccessor> {
				if (accessorTreeGenerator.isFrozenWhileUpdating) {
					throw new BindingError(`Cannot query all entities while the tree is updating.`)
				}
				for (const [, entity] of accessorTreeGenerator.entityStore) {
					yield entity.getAccessor()
				}
			}
		})(this),
		getEntityByKey: (key: string) => {
			const entity = this.entityStore.get(key)

			if (entity === undefined) {
				throw new BindingError(`Trying to retrieve a non-existent entity: key '${key}' was not found.`)
			}
			return entity.getAccessor()
		},
		getEntityListSubTree: (
			aliasOrParameters: Alias | BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList,
		): EntityListAccessor => {
			const subTreeState = this.getSubTreeState(aliasOrParameters)
			const accessor = subTreeState.getAccessor()
			if (!(accessor instanceof EntityListAccessor)) {
				throw new BindingError(
					`Trying to retrieve an entity list sub-tree but resolves to a single entity.\n` +
						`Perhaps you meant to use 'getEntitySubTree'?`,
				)
			}
			return accessor
		},
		getEntitySubTree: (
			aliasOrParameters: Alias | BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity,
		): EntityAccessor => {
			const subTreeState = this.getSubTreeState(aliasOrParameters)
			const accessor = subTreeState.getAccessor()
			if (!(accessor instanceof EntityAccessor)) {
				throw new BindingError(
					`Trying to retrieve an entity sub-tree but resolves to an entity list.\n` +
						`Perhaps you meant to use 'getEntityListSubTree'?`,
				)
			}
			return accessor
		},
		getTreeFilters: (): TreeFilter[] => {
			return this.treeFilterGenerator.generateTreeFilter()
		},
		batchDeferredUpdates: performUpdates => {
			this.batchTreeWideUpdates(() => {
				performUpdates(this.bindingOperations)
			})
		},
		persistAll: async ({ signal } = {}) => {
			if (this.isMutating) {
				throw {
					type: MutationErrorType.AlreadyMutating,
				}
			}
			if (this.unpersistedChangesCount === 0) {
				return {
					type: PersistResultSuccessType.NothingToPersist,
				}
			}
			// TODO if the tree is in an inconsistent state, schedule a persist

			const hasBeforePersist = this.triggerOnBeforePersist()

			const generator = new MutationGenerator(this.markerTree, this.subTreeStates)
			const mutation = generator.getPersistMutation()

			if (hasBeforePersist || mutation === undefined) {
				// TODO This ideally shouldn't be necessary but given the current limitations, this makes for better UX.
				Promise.resolve().then(() => {
					this.unpersistedChangesCount = 0
					this.isMutating = false
					this.updateTreeRoot()
				})
			}

			if (mutation === undefined) {
				return {
					type: PersistResultSuccessType.NothingToPersist,
				}
			}
			this.isMutating = true
			this.updateTreeRoot() // Let the world know that we're mutating

			const data = await this.client.sendRequest(mutation, { signal })
			const normalizedData = data.data === null ? {} : data.data
			const aliases = Object.keys(normalizedData)
			const allSubMutationsOk = aliases.every(item => data.data[item].ok)

			if (!allSubMutationsOk) {
				this.setErrors(data.data)
				throw {
					type: MutationErrorType.InvalidInput,
				}
			}
			const persistedEntityIds = aliases.map(alias => data.data[alias].node.id)
			const successfulResult: SuccessfulPersistResult = {
				type: PersistResultSuccessType.JustSuccess,
				persistedEntityIds,
			}

			try {
				const persistedData = await this.fetchNewPersistedData()
				this.isMutating = false
				this.updatePersistedData(persistedData)
				return successfulResult
			} catch {
				this.isMutating = false
				this.unpersistedChangesCount = 0
				this.updateTreeRoot()

				// This is rather tricky. Since the mutation went well, we don't care how the subsequent query goes as the
				// data made it successfully to the server. Thus we'll just resolve from here no matter what.
				return successfulResult
			}
		},
	})

	private readonly getNewTreeRootInstance = () =>
		new TreeRootAccessor(this.unpersistedChangesCount !== 0, this.isMutating, this.bindingOperations)

	// This is currently useless but potentially future-compatible
	// private readonly addTreeRootEventListener: TreeRootAccessor.AddTreeRootEventListener = this.getAddEventListener(
	// 	this.treeRootListeners,
	// )

	private isMutating = false
	private isFrozenWhileUpdating = false
	private treeWideBatchUpdateDepth = 0
	private unpersistedChangesCount = 0

	public constructor(private readonly markerTree: MarkerTreeRoot, private readonly client: GraphQlClient) {
		this.treeFilterGenerator = new TreeFilterGenerator(this.markerTree, this.subTreeStates)
		this.accessorErrorManager = new AccessorErrorManager(this.subTreeStates, this.entityStore)
	}

	public async initializeLiveTree(
		updateData: (newTree: TreeRootAccessor) => void,
		yieldError: (error: RequestError) => void,
	) {
		this.updateData = updateData
		this.yieldError = yieldError

		const persistedData = await this.fetchNewPersistedData()

		this.persistedEntityData = persistedData.persistedEntityDataStore

		for (const [placeholderName, marker] of this.markerTree.subTrees) {
			const subTreeState = this.initializeSubTree(marker, persistedData.subTreeDataStore.get(placeholderName))
			this.subTreeStates.set(placeholderName, subTreeState)
		}

		this.batchTreeWideUpdates(() => this.triggerOnInitialize())
		this.updateTreeRoot()
	}

	private setErrors(data: MutationDataResponse | undefined) {
		this.performRootTreeOperation(() => {
			this.accessorErrorManager.setErrors(data)
		})
	}

	private updatePersistedData(normalizedResponse: NormalizedQueryResponseData) {
		this.performRootTreeOperation(() => {
			this.persistedEntityData = normalizedResponse.persistedEntityDataStore

			const alreadyProcessed: Set<InternalEntityState> = new Set()

			let didUpdateSomething = false
			for (const [subTreePlaceholder, subTreeState] of this.subTreeStates) {
				const newSubTreeData = normalizedResponse.subTreeDataStore.get(subTreePlaceholder)

				if (subTreeState.type === InternalStateType.SingleEntity) {
					if (newSubTreeData instanceof ServerGeneratedUuid) {
						if (newSubTreeData.value === subTreeState.id.value) {
							didUpdateSomething =
								didUpdateSomething ||
								this.updateSingleEntityPersistedData(alreadyProcessed, subTreeState, newSubTreeData)
						} else {
							const newSubTreeState = this.initializeEntityAccessor(
								newSubTreeData,
								subTreeState.environment,
								subTreeState.markersContainer,
								subTreeState.creationParameters,
								subTreeState.onChildFieldUpdate,
								(this.markerTree.subTrees.get(subTreePlaceholder)?.parameters as BoxedQualifiedSingleEntity | undefined)
									?.value,
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
		newPersistedId: ServerGeneratedUuid,
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

		if (!(state.id instanceof ServerGeneratedUuid) || newPersistedId.value !== state.id.value) {
			state.id = newPersistedId
			state.maidenKey = undefined
			state.hasIdSetInStone = true
			didUpdate = true
		}

		if (state.childrenWithPendingUpdates) {
			for (const child of state.childrenWithPendingUpdates) {
				if (child.type === InternalStateType.SingleEntity && !child.id.existsOnServer) {
					state.childrenWithPendingUpdates.delete(child) // We should delete it completely.
					didUpdate = true
				}
			}
		}

		const newPersistedData = this.persistedEntityData.get(state.id.value)

		for (let [fieldPlaceholder, fieldState] of state.fields) {
			let didChildUpdate = false
			const newFieldDatum = newPersistedData?.get(fieldPlaceholder)

			switch (fieldState.type) {
				case InternalStateType.Field: {
					if (!(newFieldDatum instanceof Set) && !(newFieldDatum instanceof ServerGeneratedUuid)) {
						if (fieldState.persistedValue !== newFieldDatum) {
							fieldState.persistedValue = newFieldDatum
							fieldState.value = newFieldDatum ?? fieldState.fieldMarker.defaultValue ?? null
							fieldState.hasUnpersistedChanges = false

							didChildUpdate = true
						}
					}
					break
				}
				case InternalStateType.SingleEntity: {
					const marker = state.markersContainer.markers.get(fieldPlaceholder)

					if (!(marker instanceof HasOneRelationMarker)) {
						break
					}

					let shouldInitializeNewEntity = false
					const previousFieldDatum = state.persistedData?.get(fieldPlaceholder)
					if (newFieldDatum instanceof ServerGeneratedUuid) {
						if (previousFieldDatum instanceof ServerGeneratedUuid) {
							if (newFieldDatum.value === previousFieldDatum.value && newFieldDatum.value === fieldState.id.value) {
								// Updating an entity that already existed on the server.
								didChildUpdate = this.updateSingleEntityPersistedData(alreadyProcessed, fieldState, newFieldDatum)
							} else {
								// An entity still exists on the server but got re-connected.
								shouldInitializeNewEntity = true
							}
						} else if (previousFieldDatum === null || previousFieldDatum === undefined) {
							// This entity got created/connected.
							shouldInitializeNewEntity = true
						}
					} else if (newFieldDatum === null || newFieldDatum === undefined) {
						if (previousFieldDatum instanceof ServerGeneratedUuid) {
							// This entity got deleted/disconnected.
							shouldInitializeNewEntity = true
						} else if (previousFieldDatum === null || previousFieldDatum === undefined) {
							// This entity remained untouched.
							shouldInitializeNewEntity = true
						}
					}

					if (shouldInitializeNewEntity) {
						state.fields.set(
							fieldPlaceholder,
							(fieldState = this.initializeEntityAccessor(
								newFieldDatum instanceof ServerGeneratedUuid ? newFieldDatum : new UnpersistedEntityKey(),
								marker.environment,
								marker.fields,
								marker.relation,
								state.onChildFieldUpdate,
								marker.relation,
							)),
						)
						this.markPendingConnections(state, new Set([fieldPlaceholder]))
						alreadyProcessed.add(fieldState)
						didChildUpdate = true
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
				if (!child.id.existsOnServer) {
					state.childrenWithPendingUpdates.delete(child) // We should delete it completely.
					didUpdate = true
				}
			}
		}

		let haveSameKeySets = state.children.size === newPersistedData.size

		if (haveSameKeySets) {
			const newKeyIterator = newPersistedData[Symbol.iterator]()
			for (const childState of state.children) {
				const oldKey = childState.id.value
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

		state.children.clear()

		// TODO instead of calling initializeEntityAccessor we might be able to perform some Longest Common Subsequence
		// 	wizardry and match the id sets in order to convert the unpersisted
		for (const newPersistedId of initialData) {
			if (newPersistedId === undefined) {
				const newKey = new UnpersistedEntityKey()

				const childState = this.initializeEntityAccessor(
					newKey,
					state.environment,
					state.markersContainer,
					state.creationParameters,
					state.onChildEntityUpdate,
					this.getEventListenersForListEntity(state),
				)
				state.children.add(childState)

				didUpdate = true
			} else {
				let childState = this.entityStore.get(newPersistedId)

				if (childState === undefined) {
					childState = this.initializeEntityAccessor(
						new ServerGeneratedUuid(newPersistedId),
						state.environment,
						state.markersContainer,
						state.creationParameters,
						state.onChildEntityUpdate,
						this.getEventListenersForListEntity(state),
					)
					didUpdate = true
				} else {
					const didChildUpdate = this.updateSingleEntityPersistedData(
						alreadyProcessed,
						childState,
						new ServerGeneratedUuid(newPersistedId),
					)

					if (didChildUpdate) {
						didUpdate = true
						if (state.childrenWithPendingUpdates === undefined) {
							state.childrenWithPendingUpdates = new Set()
						}
						state.childrenWithPendingUpdates.add(childState)
					}
				}
				state.children.add(childState)
			}
		}

		if (didUpdate) {
			state.hasStaleAccessor = true
			state.hasPendingUpdate = true
		}
		return didUpdate
	}

	private performRootTreeOperation(operation: () => void) {
		this.batchTreeWideUpdates(operation)
		this.updateSubTrees()
	}

	private batchTreeWideUpdates(operation: () => void) {
		this.treeWideBatchUpdateDepth++
		operation()
		this.treeWideBatchUpdateDepth--
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
			this.triggerOnInitialize()
			this.updateTreeRoot()
			this.flushPendingAccessorUpdates(rootsWithPendingUpdates)
			this.isFrozenWhileUpdating = false
		})
	}

	private updateTreeRoot() {
		this.updateData?.(this.getNewTreeRootInstance())
	}

	private initializeSubTree(
		tree: SubTreeMarker,
		persistedRootData: ServerGeneratedUuid | Set<string> | undefined,
	): InternalRootStateNode {
		let subTreeState: InternalEntityState | InternalEntityListState

		if (tree.parameters.type === 'qualifiedEntityList' || tree.parameters.type === 'unconstrainedQualifiedEntityList') {
			const persistedEntityIds: Set<string> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListAccessor(
				tree.environment,
				tree.fields,
				tree.parameters.value,
				noop,
				persistedEntityIds,
				tree.parameters.value,
			)
		} else {
			const id = persistedRootData instanceof ServerGeneratedUuid ? persistedRootData : new UnpersistedEntityKey()
			subTreeState = this.initializeEntityAccessor(
				id,
				tree.environment,
				tree.fields,
				tree.parameters.value,
				noop,
				tree.parameters.value,
			)
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
		} else if (fieldDatum instanceof ServerGeneratedUuid) {
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
		} else if (fieldDatum instanceof ServerGeneratedUuid || fieldDatum === null || fieldDatum === undefined) {
			const entityId = fieldDatum instanceof ServerGeneratedUuid ? fieldDatum : new UnpersistedEntityKey()
			const referenceEntityState = this.initializeEntityAccessor(
				entityId,
				field.environment,
				field.fields,
				field.relation,
				entityState.onChildFieldUpdate,
				field.relation,
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
					field.relation,
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

	private initializeEntityFields(
		entityState: InternalEntityState,
		markersContainer: EntityFieldMarkersContainer,
	): void {
		for (const [placeholderName, field] of markersContainer.markers) {
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

	private mergeInEntityFieldsContainer(
		existingEntityState: InternalEntityState,
		newMarkersContainer: EntityFieldMarkersContainer,
	): void {
		for (const [placeholderName, field] of newMarkersContainer.markers) {
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
					for (const childState of fieldState.children) {
						this.initializeEntityAccessor(
							childState.id,
							fieldState.environment,
							newMarkersContainer,
							fieldState.creationParameters,
							fieldState.onChildEntityUpdate,
							this.getEventListenersForListEntity(fieldState, field),
						)
					}
					fieldState.markersContainer = MarkerMerger.mergeEntityFieldsContainers(
						fieldState.markersContainer,
						newMarkersContainer,
					)
				}
			} else if (field instanceof SubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else {
				assertNever(field)
			}
		}
	}

	private initializeEntityAccessor(
		id: EntityAccessor.RuntimeId,
		environment: Environment,
		markersContainer: EntityFieldMarkersContainer,
		creationParameters: EntityCreationParameters,
		onEntityUpdate: OnEntityUpdate,
		initialEventListeners: SingleEntityEventListeners | undefined,
	): InternalEntityState {
		const entityKey = id.value
		const existingEntityState = this.entityStore.get(entityKey)

		if (existingEntityState !== undefined) {
			existingEntityState.markersContainer = MarkerMerger.mergeEntityFieldsContainers(
				existingEntityState.markersContainer,
				markersContainer,
			)
			existingEntityState.realms.add(onEntityUpdate)
			existingEntityState.hasStaleAccessor = true
			existingEntityState.eventListeners = TreeParameterMerger.mergeSingleEntityEventListeners(
				TreeParameterMerger.cloneSingleEntityEventListeners(existingEntityState.eventListeners),
				TreeParameterMerger.cloneSingleEntityEventListeners(initialEventListeners?.eventListeners),
			)
			existingEntityState.creationParameters = {
				forceCreation: existingEntityState.creationParameters.forceCreation || creationParameters.forceCreation,
				isNonbearing: existingEntityState.creationParameters.isNonbearing && creationParameters.isNonbearing, // If either is false, it's bearing
				setOnCreate: TreeParameterMerger.mergeSetOnCreate(
					existingEntityState.creationParameters.setOnCreate,
					creationParameters.setOnCreate,
				),
			}
			this.mergeInEntityFieldsContainer(existingEntityState, markersContainer)

			if (existingEntityState.eventListeners.initialize?.size) {
				this.newlyInitializedWithListeners.add(existingEntityState)
			}

			return existingEntityState
		}

		const entityState: InternalEntityState = {
			type: InternalStateType.SingleEntity,
			batchUpdateDepth: 0,
			fieldsWithPendingConnectionUpdates: undefined,
			childrenWithPendingUpdates: undefined,
			creationParameters,
			environment,
			errors: undefined,
			eventListeners: TreeParameterMerger.cloneSingleEntityEventListeners(initialEventListeners?.eventListeners),
			fields: new Map(),
			hasIdSetInStone: true,
			hasPendingUpdate: false,
			hasPendingParentNotification: false,
			hasStaleAccessor: true,
			id,
			isScheduledForDeletion: false,
			maidenKey: id instanceof UnpersistedEntityKey ? id.value : undefined,
			markersContainer,
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
							entityState.persistedData,
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
					if (updatedState.type === InternalStateType.Field && updatedState.placeholderName === PRIMARY_KEY_NAME) {
						if (entityState.id.existsOnServer) {
							throw new BindingError(
								`Trying to change the id of an entity that already exists on the server. ` +
									`That is strictly prohibited. Once created, an entity's id cannot be changed.`,
							)
						}
						if (entityState.hasIdSetInStone) {
							throw new BindingError(
								`Trying to change the id of an entity at a time it's no longer allowed. ` +
									`In order to change it, it needs to be set immediately after initialization of the entity.`,
							)
						}
						entityState.hasIdSetInStone = true
						const previousKey = entityState.id.value
						const newKey = updatedState.value as string
						entityState.id = new ClientGeneratedUuid(newKey)
						this.entityStore.delete(previousKey)
						this.entityStore.set(newKey, entityState)
					}
					if (
						updatedState.type === InternalStateType.SingleEntity &&
						updatedState.maidenKey !== updatedState.id.value
					) {
						const relevantPlaceholders = this.findChildPlaceholdersByState(entityState, updatedState)
						this.markPendingConnections(entityState, relevantPlaceholders)
					}

					if (updatedState.type === InternalStateType.SingleEntity && updatedState.isScheduledForDeletion) {
						processEntityDeletion(updatedState)
					} else {
						this.markChildStateInNeedOfUpdate(entityState, updatedState)
					}
					entityState.hasStaleAccessor = true
					entityState.hasPendingParentNotification = true
				})
			},
			addEventListener: (type: EntityAccessor.EntityEventType, ...args: unknown[]) => {
				if (type === 'connectionUpdate') {
					if (entityState.eventListeners.connectionUpdate === undefined) {
						entityState.eventListeners.connectionUpdate = new Map()
					}
					const fieldName = args[0] as FieldName
					const listener = args[1] as EntityAccessor.UpdateListener
					const existingListeners = entityState.eventListeners.connectionUpdate.get(fieldName)

					if (existingListeners === undefined) {
						entityState.eventListeners.connectionUpdate.set(fieldName, new Set([listener]))
					} else {
						existingListeners.add(listener)
					}
					return () => {
						const existingListeners = entityState.eventListeners.connectionUpdate?.get(fieldName)
						if (existingListeners === undefined) {
							return // Throw an error? This REALLY should not happen.
						}
						existingListeners.delete(listener)
					}
				} else {
					const listener = args[0] as EntityAccessor.EntityEventListenerMap[typeof type]
					if (entityState.eventListeners[type] === undefined) {
						entityState.eventListeners[type] = new Set<never>()
					}
					entityState.eventListeners[type]!.add(listener as any)
					return () => {
						if (entityState.eventListeners[type] === undefined) {
							return // Throw an error? This REALLY should not happen.
						}
						entityState.eventListeners[type]!.delete(listener as any)
						if (entityState.eventListeners[type]!.size === 0) {
							entityState.eventListeners[type] = undefined
						}
					}
				}
			},
			batchUpdates: performUpdates => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						batchUpdatesImplementation(performUpdates)
					})
				})
			},
			connectEntityAtField: (fieldName, entityToConnectOrItsKey) => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const hasOneMarkers = resolveHasOneRelationMarkers(
							fieldName,
							`Cannot connect at field '${fieldName}' as it doesn't refer to a has one relation.`,
						)
						for (const hasOneMarker of hasOneMarkers) {
							const previouslyConnectedState = entityState.fields.get(hasOneMarker.placeholderName)

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

							const persistedKey = entityState.persistedData?.get(hasOneMarker.placeholderName)
							if (persistedKey instanceof ServerGeneratedUuid) {
								if (persistedKey.value === connectedEntityKey) {
									this.unpersistedChangesCount-- // It was removed from the list but now we're adding it back.
								} else if (persistedKey.value === previouslyConnectedState.id.value) {
									this.unpersistedChangesCount++ // We're changing it from the persisted id.
								}
							} else if (!previouslyConnectedState.id.existsOnServer) {
								// This assumes the invariant enforced above that we cannot connect unpersisted entities.
								// Hence the previouslyConnectedState still refers to the entity created initially.

								if (
									persistedKey === null || // We're updating.
									(persistedKey === undefined && // We're creating.
										(!entityState.markersContainer.hasAtLeastOneBearingField || !hasOneMarker.relation.isNonbearing))
								) {
									this.unpersistedChangesCount++
								}
							}

							// TODO do something about the existing state…

							newlyConnectedState.realms.add(entityState.onChildFieldUpdate)
							entityState.fields.set(hasOneMarker.placeholderName, newlyConnectedState)
							entityState.hasStaleAccessor = true
							entityState.hasPendingParentNotification = true
						}
						if (entityState.fieldsWithPendingConnectionUpdates === undefined) {
							entityState.fieldsWithPendingConnectionUpdates = new Set()
						}
						entityState.fieldsWithPendingConnectionUpdates.add(fieldName)
					})
				})
			},
			disconnectEntityAtField: (fieldName, initializeReplacement) => {
				this.performRootTreeOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const hasOneMarkers = resolveHasOneRelationMarkers(
							fieldName,
							`Cannot disconnect the field '${fieldName}' as it doesn't refer to a has one relation.`,
						)
						for (const hasOneMarker of hasOneMarkers) {
							const stateToDisconnect = entityState.fields.get(hasOneMarker.placeholderName)

							if (stateToDisconnect === undefined) {
								throw new BindingError(`Cannot disconnect field '${hasOneMarker.placeholderName}' as it doesn't exist.`)
							}
							if (stateToDisconnect.type !== InternalStateType.SingleEntity) {
								this.rejectInvalidAccessorTree()
							}

							const persistedKey = entityState.persistedData?.get(hasOneMarker.placeholderName)

							if (persistedKey instanceof ServerGeneratedUuid && persistedKey.value === stateToDisconnect.id.value) {
								this.unpersistedChangesCount++
							} else {
								// Do nothing. Disconnecting unpersisted entities doesn't change the count.
							}

							stateToDisconnect.realms.delete(entityState.onChildFieldUpdate)

							// TODO update changes count?

							const newEntityState = this.initializeEntityAccessor(
								new UnpersistedEntityKey(),
								hasOneMarker.environment,
								hasOneMarker.fields,
								hasOneMarker.relation,
								entityState.onChildFieldUpdate,
								hasOneMarker.relation,
							)
							entityState.fields.set(hasOneMarker.placeholderName, newEntityState)

							entityState.hasStaleAccessor = true
							entityState.hasPendingParentNotification = true

							this.runImmediateUserInitialization(newEntityState, initializeReplacement)
						}
						if (entityState.fieldsWithPendingConnectionUpdates === undefined) {
							entityState.fieldsWithPendingConnectionUpdates = new Set()
						}
						entityState.fieldsWithPendingConnectionUpdates.add(fieldName)
					})
				})
			},
			deleteEntity: () => {
				this.performRootTreeOperation(() => {
					// Deliberately not calling performOperationWithBeforeUpdate ‒ no beforeUpdate events after deletion
					batchUpdatesImplementation(() => {
						if (entityState.id.existsOnServer) {
							this.unpersistedChangesCount++
						}
						entityState.isScheduledForDeletion = true
						entityState.hasPendingParentNotification = true
					})
				})
			},
		}
		this.entityStore.set(entityKey, entityState)

		const typeName = entityState.persistedData?.get(TYPENAME_KEY_NAME)

		if (typeof typeName === 'string') {
			entityState.typeName = typeName
		}
		if (creationParameters.forceCreation && !id.existsOnServer) {
			this.unpersistedChangesCount++
		}

		const batchUpdatesImplementation: EntityAccessor.BatchUpdates = performUpdates => {
			if (entityState.isScheduledForDeletion) {
				if (entityState.hasPendingUpdate) {
					// If hasPendingUpdate, we've likely just deleted the entity as a part of this transaction, so don't worry
					// about it and just do nothing.
					return
				}
				throw new BindingError(`Trying to update an entity (or something within said entity) that has been deleted.`)
			}
			entityState.batchUpdateDepth++
			performUpdates(entityState.getAccessor, this.bindingOperations)
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
						listener(getAccessor, this.bindingOperations)
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
			const relevantPlaceholders = this.findChildPlaceholdersByState(entityState, deletedState)

			if (deletedState.id.existsOnServer) {
				if (entityState.plannedHasOneDeletions === undefined) {
					entityState.plannedHasOneDeletions = new Map()
				}
				for (const placeholderName of relevantPlaceholders) {
					entityState.plannedHasOneDeletions.set(placeholderName, deletedState)
				}
			}

			for (const placeholderName of relevantPlaceholders) {
				const newEntityState = this.initializeEntityAccessor(
					new UnpersistedEntityKey(),
					deletedState.environment,
					deletedState.markersContainer,
					deletedState.creationParameters,
					entityState.onChildFieldUpdate,
					initialEventListeners, // TODO this is wrong!!!
				)
				entityState.fields.set(placeholderName, newEntityState)
			}
			// TODO update the changes count
			entityState.childrenWithPendingUpdates?.delete(deletedState)

			this.markPendingConnections(entityState, relevantPlaceholders)
		}

		const resolveHasOneRelationMarkers = (field: FieldName, message: string): Set<HasOneRelationMarker> => {
			const placeholders = entityState.markersContainer.placeholders.get(field)

			if (placeholders === undefined) {
				throw new BindingError(message)
			}
			const placeholderArray = placeholders instanceof Set ? Array.from(placeholders) : [placeholders]

			return new Set(
				placeholderArray.map(placeholderName => {
					const hasOneRelation = entityState.markersContainer.markers.get(placeholderName)

					if (!(hasOneRelation instanceof HasOneRelationMarker)) {
						throw new BindingError(message)
					}
					return hasOneRelation
				}),
			)
		}

		this.initializeEntityFields(entityState, markersContainer)

		if (entityState.eventListeners.initialize?.size) {
			this.newlyInitializedWithListeners.add(entityState)
		}

		return entityState
	}

	private initializeEntityListAccessor(
		environment: Environment,
		markersContainer: EntityFieldMarkersContainer,
		creationParameters: EntityCreationParameters & EntityListPreferences,
		onEntityListUpdate: OnEntityListUpdate,
		persistedEntityIds: Set<string>,
		initialEventListeners: EntityListEventListeners | undefined,
	): InternalEntityListState {
		const entityListState: InternalEntityListState = {
			type: InternalStateType.EntityList,
			creationParameters,
			markersContainer,
			onEntityListUpdate,
			persistedEntityIds,
			addEventListener: undefined as any,
			batchUpdateDepth: 0,
			children: new Set(),
			childrenWithPendingUpdates: undefined,
			environment,
			eventListeners: TreeParameterMerger.cloneEntityListEventListeners(initialEventListeners?.eventListeners),
			errors: undefined,
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
							entityListState.children,
							entityListState.persistedEntityIds,
							entityListState.errors,
							entityListState.environment,
							entityListState.addEventListener,
							entityListState.batchUpdates,
							entityListState.connectEntity,
							entityListState.createNewEntity,
							entityListState.disconnectEntity,
							entityListState.getChildEntityByKey,
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

						if (entityListState.children.has(connectedState)) {
							return
						}

						connectedState.realms.add(entityListState.onChildEntityUpdate)
						entityListState.children.add(connectedState)
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

					this.runImmediateUserInitialization(newState, initialize)
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

						if (!entityListState.children.has(disconnectedChildState)) {
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

						entityListState.children.delete(disconnectedChildState)
						entityListState.hasPendingParentNotification = true
						entityListState.hasStaleAccessor = true
					})
				})
			},
			getChildEntityByKey: __DEV_MODE__
				? key => {
						const childState = this.entityStore.get(key)
						if (childState === undefined || !entityListState.children.has(childState)) {
							throw new BindingError(
								`EntityList: cannot retrieve an entity with key '${key}' as it is not on the list.`,
							)
						}
						return childState.getAccessor()
				  }
				: this.bindingOperations.getEntityByKey,
		}
		entityListState.addEventListener = this.getAddEventListener(entityListState)

		const batchUpdatesImplementation: EntityListAccessor.BatchUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			performUpdates(entityListState.getAccessor, this.bindingOperations)
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
						listener(getAccessor, this.bindingOperations)
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

			const key = stateForDeletion.id.value
			entityListState.children.delete(stateForDeletion)
			entityListState.hasPendingParentNotification = true

			if (!stateForDeletion.id.existsOnServer) {
				return
			}

			if (entityListState.plannedRemovals === undefined) {
				entityListState.plannedRemovals = new Map()
			}
			entityListState.plannedRemovals.set(stateForDeletion, 'delete')
		}

		const generateNewEntityState = (persistedId: string | undefined): InternalEntityState => {
			const id = persistedId === undefined ? new UnpersistedEntityKey() : new ServerGeneratedUuid(persistedId)

			const entityState = this.initializeEntityAccessor(
				id,
				entityListState.environment,
				entityListState.markersContainer,
				entityListState.creationParameters,
				entityListState.onChildEntityUpdate,
				this.getEventListenersForListEntity(entityListState),
			)

			entityListState.hasStaleAccessor = true
			entityListState.children.add(entityState)

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
			value: resolvedFieldValue,
			addEventListener: undefined as any,
			eventListeners: {
				beforeUpdate: undefined,
				update: undefined,
			},
			errors: undefined,
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
							fieldState.value,
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
					if (__DEV_MODE__) {
						if (placeholderName === PRIMARY_KEY_NAME && newValue !== fieldState.value) {
							throw new BindingError(
								`Trying to set the '${PRIMARY_KEY_NAME}' field for the second time. This is prohibited.\n` +
									`Once set, it is immutable.`,
							)
						}
					}
					if (__DEV_MODE__) {
						if (placeholderName === PRIMARY_KEY_NAME) {
							if (typeof newValue !== 'string' || !uuidValidate(newValue)) {
								throw new BindingError(
									`Invalid value supplied for the '${PRIMARY_KEY_NAME}' field. ` +
										`Expecting a valid uuid but '${newValue}' was given.\n` +
										`Hint: you may use 'FieldAccessor.asUuid.setToUuid()'.`,
								)
							}
							if (this.entityStore.has(newValue)) {
								throw new BindingError(
									`Trying to set the '${PRIMARY_KEY_NAME}' field to '${newValue}' which is a valid uuid but is not unique. ` +
										`It is already in use by an existing entity.`,
								)
							}
						}
					}
					if (newValue === fieldState.value) {
						return
					}
					if (fieldState.touchLog === undefined) {
						fieldState.touchLog = new Map()
					}
					fieldState.touchLog.set(agent, true)
					fieldState.value = newValue
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

	private findChildPlaceholdersByState(containingState: InternalEntityState, childState: InternalStateNode) {
		const relevantPlaceholders = new Set<FieldName>()

		// All has one relations where this entity is present.
		for (const [placeholderName, candidateState] of containingState.fields) {
			if (candidateState === childState) {
				relevantPlaceholders.add(placeholderName)
			}
		}

		return relevantPlaceholders
	}

	private runImmediateUserInitialization(
		newEntityState: InternalEntityState,
		initialize: EntityAccessor.BatchUpdatesHandler | undefined,
	) {
		newEntityState.hasIdSetInStone = false
		initialize && newEntityState.batchUpdates(initialize)

		if (!newEntityState.eventListeners.initialize) {
			newEntityState.hasIdSetInStone = true
		}
	}

	private markPendingConnections(parentState: InternalEntityState, connectionPlaceholders: Set<FieldName>) {
		if (parentState.fieldsWithPendingConnectionUpdates === undefined) {
			parentState.fieldsWithPendingConnectionUpdates = new Set()
		}
		placeholders: for (const [fieldName, placeholderNames] of parentState.markersContainer.placeholders) {
			if (typeof placeholderNames === 'string') {
				if (connectionPlaceholders.has(placeholderNames)) {
					parentState.fieldsWithPendingConnectionUpdates.add(fieldName)
				}
			} else {
				for (const placeholderName of placeholderNames) {
					if (connectionPlaceholders.has(placeholderName)) {
						parentState.fieldsWithPendingConnectionUpdates.add(fieldName)
						continue placeholders
					}
				}
			}
		}
		if (parentState.fieldsWithPendingConnectionUpdates.size === 0) {
			parentState.fieldsWithPendingConnectionUpdates = undefined
		}
	}

	private resolveAndPrepareEntityToConnect(
		entityToConnectOrItsKey: string | EntityAccessor,
	): [string, InternalEntityState] {
		let connectedEntityKey: string

		if (typeof entityToConnectOrItsKey === 'string') {
			connectedEntityKey = entityToConnectOrItsKey
		} else {
			// TODO This is commented out for now in order to at least somewhat mitigate the limitations of dealing with
			//		inverse relations. However, once that has been addressed systemically, this code needs to be re-enabled.
			// if (!entityToConnectOrItsKey.existsOnServer) {
			// 	throw new BindingError(
			// 		`Attempting to connect an entity with key '${entityToConnectOrItsKey.key}' that ` +
			// 			`doesn't exist on server. That is currently impossible.`, // At least for now.
			// 	)
			// }
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

	private getEventListenersForListEntity(
		containingListState: InternalEntityListState,
		additionalMarker?: HasManyRelationMarker,
	): SingleEntityEventListeners {
		const create = (base: {
			eventListeners: EntityListEventListeners['eventListeners']
		}): SingleEntityEventListeners['eventListeners'] => ({
			beforePersist: undefined,
			initialize: base.eventListeners.childInitialize,
			beforeUpdate: undefined,
			update: undefined,
			connectionUpdate: undefined,
			persistError: undefined,
			persistSuccess: undefined,
		})

		let eventListeners: SingleEntityEventListeners['eventListeners'] = create(containingListState)
		if (additionalMarker) {
			eventListeners = TreeParameterMerger.mergeSingleEntityEventListeners(
				eventListeners,
				create(additionalMarker.relation),
			)
		}
		return {
			eventListeners,
		}
	}

	private getSubTreeState(aliasOrParameters: Alias | SubTreeMarkerParameters): InternalRootStateNode {
		let placeholderName: string

		if (typeof aliasOrParameters === 'string') {
			const placeholderByAlias = this.markerTree.placeholdersByAliases.get(aliasOrParameters)

			if (placeholderByAlias === undefined) {
				throw new BindingError(`Undefined sub-tree alias '${aliasOrParameters}'.`)
			}
			placeholderName = placeholderByAlias
		} else {
			placeholderName = PlaceholderGenerator.getSubTreeMarkerPlaceholder(aliasOrParameters)
		}
		const subTreeState = this.subTreeStates.get(placeholderName)

		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent sub-tree '${placeholderName}'.`)
		}
		return subTreeState
	}

	private triggerOnBeforePersist(): boolean {
		let hasBeforePersist = false

		this.batchTreeWideUpdates(() => {
			const iNodeHasBeforePersist = (iNode: InternalEntityState | InternalEntityListState) =>
				iNode.eventListeners.beforePersist !== undefined

			for (const [, subTreeState] of this.subTreeStates) {
				for (const iNode of InternalStateIterator.depthFirstINodes(subTreeState, iNodeHasBeforePersist)) {
					for (const listener of iNode.eventListeners.beforePersist!) {
						listener(iNode.getAccessor as any, this.bindingOperations) // TS can't quite handle this but this is sound.
						hasBeforePersist = true
					}
				}
			}
		})

		// TODO if the newly initialized entities have beforePersist handlers, they won't fire.
		return this.triggerOnInitialize() || hasBeforePersist
	}

	private triggerOnInitialize(): boolean {
		let hasOnInitialize = false

		this.batchTreeWideUpdates(() => {
			for (const state of this.newlyInitializedWithListeners) {
				for (const listener of state.eventListeners.initialize!) {
					listener(state.getAccessor as any, this.bindingOperations)
					hasOnInitialize = true
				}
				if (state.type === InternalStateType.SingleEntity) {
					state.hasIdSetInStone = true
				}
			}
		})
		this.newlyInitializedWithListeners.clear()

		return hasOnInitialize
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
			if (
				state.type === InternalStateType.SingleEntity &&
				state.fieldsWithPendingConnectionUpdates &&
				state.eventListeners.connectionUpdate
			) {
				for (const updatedField of state.fieldsWithPendingConnectionUpdates) {
					const listenersMap = state.eventListeners.connectionUpdate
					const listeners = listenersMap.get(updatedField)
					if (!listeners) {
						continue
					}
					for (const listener of listeners) {
						listener(state.getAccessor())
					}
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

	private async fetchNewPersistedData(): Promise<NormalizedQueryResponseData> {
		const queryGenerator = new QueryGenerator(this.markerTree)
		const query = queryGenerator.getReadQuery()

		let queryResponse: QueryRequestResponse | undefined

		try {
			queryResponse = query === undefined ? undefined : await this.client.sendRequest(query)
		} catch (metadata) {
			this.yieldError?.(metadataToRequestError(metadata as GraphQlClient.FailedRequestMetadata))
		}
		return QueryResponseNormalizer.normalizeResponse(queryResponse)
	}
}
