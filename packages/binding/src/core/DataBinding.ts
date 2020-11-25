import { GraphQlClient, TreeFilter } from '@contember/client'
import {
	BindingOperations,
	EntityAccessor,
	EntityListAccessor,
	PersistErrorOptions,
	TreeRootAccessor,
} from '../accessors'
import {
	metadataToRequestError,
	MutationErrorType,
	NormalizedQueryResponseData,
	PersistResultSuccessType,
	QueryRequestResponse,
	RequestError,
	ServerGeneratedUuid,
	SuccessfulPersistResult,
	UnpersistedEntityKey,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { HasOneRelationMarker, MarkerTreeRoot, PlaceholderGenerator, SubTreeMarkerParameters } from '../markers'
import {
	Alias,
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { assertNever } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import { EventManager } from './EventManager'
import { MutationGenerator } from './MutationGenerator'
import { QueryGenerator } from './QueryGenerator'
import { QueryResponseNormalizer } from './QueryResponseNormalizer'
import { EntityListState, EntityState, RootStateNode, StateType } from './state'
import { StateInitializer } from './StateInitializer'
import { TreeStore } from './TreeStore'
import { TreeFilterGenerator } from './TreeFilterGenerator'

export class DataBinding {
	private readonly config: Config
	private readonly treeStore: TreeStore
	private readonly stateInitializer: StateInitializer
	private readonly treeFilterGenerator: TreeFilterGenerator
	private readonly accessorErrorManager: AccessorErrorManager
	private readonly eventManager: EventManager
	private readonly dirtinessTracker: DirtinessTracker

	// private treeRootListeners: {
	// 	eventListeners: {}
	// } = {
	// 	eventListeners: {},
	// }

	private readonly bindingOperations = Object.freeze<BindingOperations>({
		getAllEntities: (treeStore => {
			return function* (): Generator<EntityAccessor> {
				for (const [, entity] of treeStore.entityStore) {
					yield entity.getAccessor()
				}
			}
		})(this.treeStore),
		getEntityByKey: (key: string) => {
			const entity = this.treeStore.entityStore.get(key)

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
			this.eventManager.syncTransaction(() => performUpdates(this.bindingOperations))
		},
		persistAll: async ({ signal } = {}) => {
			if (!this.dirtinessTracker.hasChanges()) {
				return {
					type: PersistResultSuccessType.NothingToPersist,
				}
			}
			return await this.eventManager.persistOperation(async () => {
				let successfulResult: SuccessfulPersistResult | undefined = undefined
				for (let attemptNumber = 1; attemptNumber <= this.config.getValue('maxPersistAttempts'); attemptNumber++) {
					// TODO if the tree is in an inconsistent state, wait for lock releases

					this.eventManager.syncTransaction(() => {
						this.accessorErrorManager.clearErrors()
					})
					await this.eventManager.triggerOnBeforePersist()

					let shouldTryAgain = false
					const proposedBackOffs: number[] = []
					const persistErrorOptions: PersistErrorOptions = {
						...this.bindingOperations,
						tryAgain: options => {
							shouldTryAgain = true
							if (options?.proposedBackoff !== undefined && options.proposedBackoff > 0) {
								proposedBackOffs.push(options.proposedBackoff)
							}
						},
						attemptNumber,
					}

					if (this.accessorErrorManager.hasErrors()) {
						await this.eventManager.triggerOnPersistError(persistErrorOptions)
						if (shouldTryAgain) {
							continue // Trying again immediately
						}

						throw {
							type: MutationErrorType.InvalidInput,
						}
					}

					const generator = new MutationGenerator(this.treeStore)
					const mutation = generator.getPersistMutation()

					if (mutation === undefined) {
						this.dirtinessTracker.reset() // TODO This ideally shouldn't be necessary but given the current limitations, this makes for better UX.
						return {
							type: PersistResultSuccessType.NothingToPersist,
						}
					}

					const mutationResponse = await this.client.sendRequest(mutation, { signal })
					const normalizedMutationResponse = mutationResponse.data === null ? {} : mutationResponse.data
					const aliases = Object.keys(normalizedMutationResponse)
					const allSubMutationsOk = aliases.every(item => mutationResponse.data[item].ok)

					if (allSubMutationsOk) {
						const persistedEntityIds = aliases.map(alias => mutationResponse.data[alias].node.id)
						successfulResult = {
							type: PersistResultSuccessType.JustSuccess,
							persistedEntityIds,
						}

						this.eventManager.syncTransaction(() => this.accessorErrorManager.clearErrors())
						break
					} else {
						this.eventManager.syncTransaction(() => this.accessorErrorManager.replaceErrors(mutationResponse.data))
						await this.eventManager.triggerOnPersistError(persistErrorOptions)
						if (shouldTryAgain) {
							if (proposedBackOffs.length) {
								const geometricMean = Math.round(
									Math.pow(
										proposedBackOffs.reduce((a, b) => a * b, 1),
										1 / proposedBackOffs.length,
									),
								)
								await new Promise(resolve => setTimeout(resolve, geometricMean))
							}
							continue
						}
						throw {
							type: MutationErrorType.InvalidInput,
						}
					}
				}

				if (successfulResult === undefined) {
					// Max attempts exceeded
					throw new BindingError() // TODO msg
				}
				const result = successfulResult
				this.dirtinessTracker.reset()

				try {
					const persistedData = await this.fetchNewPersistedData()
					this.eventManager.syncOperation(() => {
						this.updatePersistedData(persistedData)
						this.eventManager.triggerOnPersistSuccess({
							...this.bindingOperations,
							successType: result.type,
							unstable_persistedEntityIds: result.persistedEntityIds,
						})
					})
					return successfulResult
				} catch {
					this.eventManager.triggerOnPersistSuccess({
						...this.bindingOperations,
						successType: result.type,
						unstable_persistedEntityIds: result.persistedEntityIds,
					})

					// This is rather tricky. Since the mutation went well, we don't care how the subsequent query goes as the
					// data made it successfully to the server. Thus we'll just resolve from here no matter what.
					return successfulResult
				}
			})
		},
	})

	// This is currently useless but potentially future-compatible
	// private readonly addTreeRootEventListener: TreeRootAccessor.AddTreeRootEventListener = this.getAddEventListener(
	// 	this.treeRootListeners,
	// )

	public constructor(
		markerTree: MarkerTreeRoot,
		private readonly client: GraphQlClient,
		private readonly onUpdate: (newData: TreeRootAccessor) => void,
		private readonly onError: (error: RequestError) => void,
	) {
		this.config = new Config()
		this.treeStore = new TreeStore(markerTree)
		this.treeFilterGenerator = new TreeFilterGenerator(this.treeStore)
		this.accessorErrorManager = new AccessorErrorManager(this.treeStore)
		this.dirtinessTracker = new DirtinessTracker()
		this.eventManager = new EventManager(
			this.bindingOperations,
			this.config,
			this.dirtinessTracker,
			this.onError,
			this.onUpdate,
			this.treeStore,
		)
		this.stateInitializer = new StateInitializer(
			this.accessorErrorManager,
			this.bindingOperations,
			this.config,
			this.dirtinessTracker,
			this.eventManager,
			this.treeStore,
		)
	}

	public async initializeLiveTree() {
		const persistedData = await this.fetchNewPersistedData()

		this.treeStore.persistedEntityData = persistedData.persistedEntityDataStore

		for (const [placeholderName, marker] of this.treeStore.markerTree.subTrees) {
			const subTreeState = this.stateInitializer.initializeSubTree(
				marker,
				persistedData.subTreeDataStore.get(placeholderName),
			)
			this.treeStore.subTreeStates.set(placeholderName, subTreeState)
		}

		this.eventManager.triggerOnInitialize()
		this.eventManager.updateTreeRoot()
	}

	private updatePersistedData(normalizedResponse: NormalizedQueryResponseData) {
		this.eventManager.syncOperation(() => {
			this.treeStore.persistedEntityData = normalizedResponse.persistedEntityDataStore

			const alreadyProcessed: Set<EntityState> = new Set()

			let didUpdateSomething = false
			for (const [subTreePlaceholder, subTreeState] of this.treeStore.subTreeStates) {
				const newSubTreeData = normalizedResponse.subTreeDataStore.get(subTreePlaceholder)

				if (subTreeState.type === StateType.SingleEntity) {
					if (newSubTreeData instanceof ServerGeneratedUuid) {
						if (newSubTreeData.value === subTreeState.id.value) {
							didUpdateSomething =
								didUpdateSomething ||
								this.updateSingleEntityPersistedData(alreadyProcessed, subTreeState, newSubTreeData)
						} else {
							const newSubTreeState = this.stateInitializer.initializeEntityAccessor(
								newSubTreeData,
								subTreeState.environment,
								subTreeState.markersContainer,
								subTreeState.creationParameters,
								subTreeState.onChildFieldUpdate,
								(this.treeStore.markerTree.subTrees.get(subTreePlaceholder)?.parameters as
									| BoxedQualifiedSingleEntity
									| undefined)?.value,
							)
							newSubTreeState.hasPendingUpdate = true
							this.treeStore.subTreeStates.set(subTreePlaceholder, newSubTreeState)
							didUpdateSomething = true
						}
					}
				} else if (subTreeState.type === StateType.EntityList) {
					if (newSubTreeData instanceof Set) {
						didUpdateSomething =
							didUpdateSomething || this.updateEntityListPersistedData(alreadyProcessed, subTreeState, newSubTreeData)
					}
				} else {
					assertNever(subTreeState)
				}
			}
			// TODO was this ever even necessary?
			// if (!didUpdateSomething) {
			// 	this.updateTreeRoot() // Still force an update, albeit without update events.
			// }
		})
	}

	private updateSingleEntityPersistedData(
		alreadyProcessed: Set<EntityState>,
		state: EntityState,
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
				if (child.type === StateType.SingleEntity && !child.id.existsOnServer) {
					state.childrenWithPendingUpdates.delete(child) // We should delete it completely.
					didUpdate = true
				}
			}
		}

		const newPersistedData = this.treeStore.persistedEntityData.get(state.id.value)

		for (let [fieldPlaceholder, fieldState] of state.fields) {
			let didChildUpdate = false
			const newFieldDatum = newPersistedData?.get(fieldPlaceholder)

			switch (fieldState.type) {
				case StateType.Field: {
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
				case StateType.SingleEntity: {
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
							(fieldState = this.stateInitializer.initializeEntityAccessor(
								newFieldDatum instanceof ServerGeneratedUuid ? newFieldDatum : new UnpersistedEntityKey(),
								marker.environment,
								marker.fields,
								marker.relation,
								state.onChildFieldUpdate,
								marker.relation,
							)),
						)
						this.eventManager.markPendingConnections(state, new Set([fieldPlaceholder]))
						alreadyProcessed.add(fieldState)
						didChildUpdate = true
					}

					break
				}
				case StateType.EntityList: {
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
		alreadyProcessed: Set<EntityState>,
		state: EntityListState,
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

				const childState = this.stateInitializer.initializeEntityAccessor(
					newKey,
					state.environment,
					state.markersContainer,
					state.creationParameters,
					state.onChildEntityUpdate,
					this.eventManager.getEventListenersForListEntity(state),
				)
				state.children.add(childState)

				didUpdate = true
			} else {
				let childState = this.treeStore.entityStore.get(newPersistedId)

				if (childState === undefined) {
					childState = this.stateInitializer.initializeEntityAccessor(
						new ServerGeneratedUuid(newPersistedId),
						state.environment,
						state.markersContainer,
						state.creationParameters,
						state.onChildEntityUpdate,
						this.eventManager.getEventListenersForListEntity(state),
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

	private getSubTreeState(aliasOrParameters: Alias | SubTreeMarkerParameters): RootStateNode {
		let placeholderName: string

		if (typeof aliasOrParameters === 'string') {
			const placeholderByAlias = this.treeStore.markerTree.placeholdersByAliases.get(aliasOrParameters)

			if (placeholderByAlias === undefined) {
				throw new BindingError(`Undefined sub-tree alias '${aliasOrParameters}'.`)
			}
			placeholderName = placeholderByAlias
		} else {
			placeholderName = PlaceholderGenerator.getSubTreeMarkerPlaceholder(aliasOrParameters)
		}
		const subTreeState = this.treeStore.subTreeStates.get(placeholderName)

		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent sub-tree '${placeholderName}'.`)
		}
		return subTreeState
	}

	private async fetchNewPersistedData(): Promise<NormalizedQueryResponseData> {
		const queryGenerator = new QueryGenerator(this.treeStore.markerTree)
		const query = queryGenerator.getReadQuery()

		let queryResponse: QueryRequestResponse | undefined

		try {
			queryResponse = query === undefined ? undefined : await this.client.sendRequest(query)
		} catch (metadata) {
			this.onError(metadataToRequestError(metadata as GraphQlClient.FailedRequestMetadata))
		}
		return QueryResponseNormalizer.normalizeResponse(queryResponse)
	}
}
