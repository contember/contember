import { GraphQlClient, TreeFilter } from '@contember/client'
import * as React from 'react'
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
	SuccessfulPersistResult,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import { MarkerTreeRoot, PlaceholderGenerator, SubTreeMarkerParameters } from '../markers'
import {
	Alias,
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import { EventManager } from './EventManager'
import { MarkerTreeGenerator } from './MarkerTreeGenerator'
import { MutationGenerator } from './MutationGenerator'
import { QueryGenerator } from './QueryGenerator'
import { QueryResponseNormalizer } from './QueryResponseNormalizer'
import { RootStateNode, StateType } from './state'
import { StateInitializer } from './StateInitializer'
import { TreeAugmenter } from './TreeAugmenter'
import { TreeFilterGenerator } from './TreeFilterGenerator'
import { TreeStore } from './TreeStore'

export class DataBinding {
	private readonly accessorErrorManager: AccessorErrorManager
	private readonly config: Config
	private readonly dirtinessTracker: DirtinessTracker
	private readonly eventManager: EventManager
	private readonly stateInitializer: StateInitializer
	private readonly treeAugmenter: TreeAugmenter
	private readonly treeFilterGenerator: TreeFilterGenerator
	private readonly treeStore: TreeStore

	// private treeRootListeners: {
	// 	eventListeners: {}
	// } = {
	// 	eventListeners: {},
	// }

	public constructor(
		private readonly client: GraphQlClient,
		private readonly environment: Environment,
		private readonly onUpdate: (newData: TreeRootAccessor) => void,
		private readonly onError: (error: RequestError) => void,
	) {
		this.config = new Config()
		this.treeStore = new TreeStore()
		this.treeFilterGenerator = new TreeFilterGenerator(this.treeStore)
		this.dirtinessTracker = new DirtinessTracker()
		this.eventManager = new EventManager(
			this.bindingOperations,
			this.config,
			this.dirtinessTracker,
			this.onError,
			this.onUpdate,
			this.treeStore,
		)
		this.accessorErrorManager = new AccessorErrorManager(this.eventManager, this.treeStore)
		this.stateInitializer = new StateInitializer(
			this.accessorErrorManager,
			this.bindingOperations,
			this.config,
			this.dirtinessTracker,
			this.eventManager,
			this.treeStore,
		)
		this.treeAugmenter = new TreeAugmenter(this.eventManager, this.stateInitializer, this.treeStore)
	}

	private readonly bindingOperations = Object.freeze<BindingOperations>({
		hasEntityKey: key => {
			return this.treeStore.entityStore.has(key)
		},
		hasSubTree: aliasOrParameters => {
			if (typeof aliasOrParameters === 'string') {
				return this.treeStore.markerTree.placeholdersByAliases.has(aliasOrParameters)
			}
			return this.treeStore.markerTree.subTrees.has(PlaceholderGenerator.getSubTreeMarkerPlaceholder(aliasOrParameters))
		},
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
		extendTree: async (...args) => await this.extendTree(...args),
		persist: async ({ signal } = {}) => {
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

				// TODO do this cleanup somewhere else and in a less brittle fashion.
				for (const [, entityState] of this.treeStore.entityStore) {
					entityState.plannedHasOneDeletions = undefined
					for (const [, child] of entityState.children) {
						if (child.type === StateType.EntityList) {
							child.plannedRemovals = undefined
						}
					}
				}

				try {
					const persistedData = await this.fetchPersistedData(this.treeStore.markerTree)
					this.eventManager.syncOperation(() => {
						this.treeAugmenter.augmentTree(this.treeStore.markerTree, persistedData)
						this.eventManager.triggerOnPersistSuccess({
							...this.bindingOperations,
							successType: result.type,
							unstable_persistedEntityIds: result.persistedEntityIds,
						})
					})
					return successfulResult
				} catch (e) {
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

	public async extendTree(newFragment: React.ReactNode) {
		return await this.eventManager.asyncOperation(async () => {
			const newMarkerTree = new MarkerTreeGenerator(newFragment, this.environment).generate()
			const newPersistedData = await this.fetchPersistedData(newMarkerTree)

			this.treeAugmenter.augmentTree(newMarkerTree, newPersistedData)
		})
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

	private async fetchPersistedData(tree: MarkerTreeRoot): Promise<QueryRequestResponse | undefined> {
		const queryGenerator = new QueryGenerator(tree)
		const query = queryGenerator.getReadQuery()

		let queryResponse: QueryRequestResponse | undefined = undefined

		try {
			queryResponse = query === undefined ? undefined : await this.client.sendRequest(query)
		} catch (metadata) {
			this.onError(metadataToRequestError(metadata as GraphQlClient.FailedRequestMetadata))
		}
		return queryResponse
	}
}
