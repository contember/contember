import { ContentClient, ContentQueryBuilder, GraphQlClient, GraphQlClientError } from '@contember/client'
import type { DataBindingEventListenerMap, DataBindingTransactionResult, EntityId, Environment, MarkerTreeRoot, TreeRootId } from '@contember/binding-common'
import {
	assertNever,
	AsyncBatchUpdatesOptions,
	BatchUpdatesOptions,
	BindingOperations,
	ErrorPersistResult,
	EventListenersStore,
	ExtendTreeOptions,
	MarkerMerger,
	PersistOptions,
	PersistSuccessOptions,
	ReceivedDataTree,
	SuccessfulPersistResult,
	TreeRootAccessor,
} from '@contember/binding-common'
import { generateEnumerabilityPreventingEntropy } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import { EventManager } from './EventManager'
import { createBatchUpdatesOptions } from './factories'
import { MutationGenerator, SubMutationOperation } from './MutationGenerator'
import { QueryGenerator } from './QueryGenerator'
import { StateIterator } from './state'
import { StateInitializer } from './StateInitializer'
import { TreeAugmenter } from './TreeAugmenter'
import { TreeStore } from './TreeStore'
import type { UpdateMetadata } from './UpdateMetadata'
import { getCombinedSignal } from './utils'
import { createQueryBuilder } from '@contember/binding-common'
import { DataBindingExtendAborted } from '@contember/binding-common'


export class DataBinding<Node> {
	private readonly accessorErrorManager: AccessorErrorManager
	private readonly batchUpdatesOptions: BatchUpdatesOptions
	private readonly asyncBatchUpdatesOptions: AsyncBatchUpdatesOptions
	private readonly bindingOperations: BindingOperations<Node>
	private readonly config: Config
	private readonly dirtinessTracker: DirtinessTracker
	private readonly eventManager: EventManager
	private readonly stateInitializer: StateInitializer
	private readonly treeAugmenter: TreeAugmenter
	private readonly queryBuilder: ContentQueryBuilder
	private readonly contentClient: ContentClient
	private readonly eventListenerStore = new EventListenersStore<DataBindingEventListenerMap>()

	// private treeRootListeners: {
	// 	eventListeners: {}
	// } = {
	// 	eventListeners: {},
	// }

	public constructor(
		private readonly contentApiClient: GraphQlClient,
		private readonly systemApiClient: GraphQlClient,
		private readonly tenantApiClient: GraphQlClient,
		private readonly treeStore: TreeStore,
		private readonly environment: Environment,
		private readonly createMarkerTree: (node: Node, environment: Environment) => MarkerTreeRoot,
		private readonly batchedUpdates: (callback: () => any) => void,
		private readonly onUpdate: (newData: TreeRootAccessor<Node>, binding: DataBinding<Node>) => void,
		private readonly onError: (error: GraphQlClientError, binding: DataBinding<Node>) => void,
		private readonly onPersistSuccess: (result: SuccessfulPersistResult, binding: DataBinding<Node>) => void,
		private readonly options: {
			skipStateUpdateAfterPersist: boolean
		},
	) {
		this.config = new Config()
		this.batchUpdatesOptions = createBatchUpdatesOptions(environment, this.treeStore)
		this.asyncBatchUpdatesOptions = {
			...this.batchUpdatesOptions,
			contentClient: contentApiClient,
			systemClient: systemApiClient,
			tenantClient: tenantApiClient,
		}
		this.dirtinessTracker = new DirtinessTracker()
		this.eventManager = new EventManager(
			this.asyncBatchUpdatesOptions,
			this.batchUpdatesOptions,
			this.config,
			this.dirtinessTracker,
			this.resolvedOnUpdate,
			this.treeStore,
			this.batchedUpdates,
		)
		this.accessorErrorManager = new AccessorErrorManager(this.eventManager, this.treeStore)
		this.stateInitializer = new StateInitializer(
			this.accessorErrorManager,
			this.batchUpdatesOptions,
			this.eventManager,
			this.treeStore,
		)
		this.treeAugmenter = new TreeAugmenter(this.eventManager, this.stateInitializer, this.treeStore, options.skipStateUpdateAfterPersist)

		// TODO move this elsewhere
		this.bindingOperations = Object.freeze<BindingOperations<Node>>({
			...this.asyncBatchUpdatesOptions,
			addEventListener: (type, listener) => this.eventListenerStore.add({ type }, listener),
			batchDeferredUpdates: performUpdates => {
				this.eventManager.syncTransaction(() => performUpdates(this.bindingOperations))
			},
			extendTree: async (...args) => await this.extendTree(...args),
			persist: async options => await this.persist(options),
			fetchData: async (...args) => await this.fetchData(...args),
		})
		this.queryBuilder = createQueryBuilder(this.environment.getSchema())
		this.contentClient = new ContentClient(contentApiClient)
	}

	private async persist({ onPersistError, onPersistSuccess, signal }: PersistOptions = {}) {
		return await this.eventManager.persistOperation(async () => {
			// TODO if the tree is in an inconsistent state, wait for lock releases

			this.eventManager.syncTransaction(() => {
				this.accessorErrorManager.clearErrors()
			})
			await this.eventManager.triggerOnBeforePersist()

			await this.checkErrorsBeforePersist(onPersistError)

			const generator = new MutationGenerator(this.treeStore, this.queryBuilder)
			const mutationResult = generator.getPersistMutation()

			if (mutationResult.operations.length === 0) {
				return await this.processEmptyPersistMutation(onPersistSuccess)
			}

			const { mutations, operations } = mutationResult

			let response: DataBindingTransactionResult
			try {
				response = await this.contentClient.mutate(this.queryBuilder.transaction(mutations, {
					deferForeignKeyConstraints: true,
				}), {
					signal,
					onBeforeRequest: ({ query, variables }) => {
						// eslint-disable-next-line no-console
						console.debug(query, variables)
					},
				})
			} catch (e) {
				if (e instanceof GraphQlClientError) {
					this.onError(e, this)
					throw await this.persistFail({
						errors: [e],
						type: 'invalidResponse',
					})
				} else {
					throw e
				}
			}

			if (response.ok && Object.values(response.data).every(it => it.ok)) {
				return await this.processSuccessfulPersistResult(response, operations, onPersistSuccess)
			} else {
				if (response.errorMessage) {
					// eslint-disable-next-line no-console
					console.debug(response.errorMessage)
				}

				this.eventManager.syncTransaction(() => this.accessorErrorManager.replaceErrors(response, operations))

				await this.eventManager.triggerOnPersistError(this.bindingOperations)
				await onPersistError?.(this.bindingOperations)
				throw await this.persistFail({
					errors: this.accessorErrorManager.getErrors(),
					type: 'invalidInput',
					response,
				})

			}
		})
	}

	private async checkErrorsBeforePersist(onPersistError: PersistOptions['onPersistError']) {
		if (this.accessorErrorManager.hasErrors()) {
			await this.eventManager.triggerOnPersistError(this.bindingOperations)
			await onPersistError?.(this.bindingOperations)
			throw await this.persistFail({
				errors: this.accessorErrorManager.getErrors(),
				type: 'invalidInput',
			})
		}
	}

	private async processEmptyPersistMutation(onPersistSuccess: PersistOptions['onPersistSuccess']): Promise<SuccessfulPersistResult> {
		this.dirtinessTracker.reset() // TODO This ideally shouldn't be necessary but given the current limitations, this makes for better UX.
		const persistSuccessOptions: PersistSuccessOptions = {
			...this.bindingOperations,
			successType: 'nothingToPersist',
		}
		await this.eventManager.triggerOnPersistSuccess(persistSuccessOptions)
		await onPersistSuccess?.(persistSuccessOptions)
		const result: SuccessfulPersistResult = { type: 'nothingToPersist' }
		await this.eventListenerStore.invoke({ type: 'persistSuccess' }, result)
		return result
	}

	private async processSuccessfulPersistResult(mutationData: DataBindingTransactionResult, operations: SubMutationOperation[], onPersistSuccess: PersistOptions['onPersistSuccess']) {
		const persistedEntityIds = Object.values(mutationData.data).map(it => it.node?.id).filter((id): id is EntityId => id !== undefined)
		const result: SuccessfulPersistResult = {
			type: 'justSuccess',
			persistedEntityIds,
		}

		try {
			await this.eventManager.asyncTransaction(async () => {
				this.resetTreeAfterSuccessfulPersist()
				this.treeAugmenter.updatePersistedData(
					Object.fromEntries(
						Object.entries(mutationData.data).map(([placeholderName, subTreeResponse]) => [
							placeholderName,
							subTreeResponse.node,
						]),
					),
					operations,
				)
				const persistSuccessOptions: PersistSuccessOptions = {
					...this.bindingOperations,
					successType: result.type,
				}
				await this.eventManager.triggerOnPersistSuccess(persistSuccessOptions)
				await onPersistSuccess?.(persistSuccessOptions)
				await this.eventListenerStore.invoke({ type: 'persistSuccess' }, result)

				this.treeAugmenter.resetCreatingSubTrees()
			})
		} catch (e) {
			console.error(e)
			const resultWithError = {
				...result,
				afterPersistError: e,
			}
			this.onPersistSuccess(resultWithError, this)
			return resultWithError
		}
		this.onPersistSuccess(result, this)
		return result
	}

	private async persistFail(error: ErrorPersistResult): Promise<ErrorPersistResult> {
		await this.eventListenerStore.invoke({ type: 'persistError' }, error)
		return error
	}

	private resolvedOnUpdate = ({ isMutating }: UpdateMetadata) => {
		this.onUpdate(new TreeRootAccessor<Node>(this.dirtinessTracker.hasChanges(), isMutating, this.bindingOperations), this)
	}

	// This is currently useless but potentially future-compatible
	// private readonly addTreeRootEventListener: TreeRootAccessor.AddTreeRootEventListener = this.getAddEventListener(
	// 	this.treeRootListeners,
	// )

	private pendingExtensions: Set<{
		markerTreeRoot: MarkerTreeRoot
		newFragment: Node
		newTreeRootId: TreeRootId | undefined
		options: ExtendTreeOptions
		onError?: (error: Error) => void
	}> = new Set()

	private flushResult: Promise<boolean> | undefined

	public async extendTree(newFragment: Node, options: ExtendTreeOptions = {}): Promise<TreeRootId | undefined> {
		if (options.signal?.aborted) {
			return Promise.reject(DataBindingExtendAborted)
		}
		const markerTreeRoot =  this.createMarkerTree(newFragment, options.environment ?? this.environment)

		if (!options.force && this.treeStore.effectivelyHasTreeRoot(markerTreeRoot)) {
			// This isn't perfectly accurate as theoretically, we could already have all the data necessary but this
			// could still be false.

			return this.eventManager.syncOperation(() => {
				const newTreeRootId = this.getNewTreeRootId()
				this.treeAugmenter.extendTreeStates(newTreeRootId, markerTreeRoot)
				return newTreeRootId
			})
		}

		return await new Promise(async (resolve, reject) => {
			const treeRootId = this.getNewTreeRootId()
			this.pendingExtensions.add({
				markerTreeRoot,
				newFragment,
				newTreeRootId: treeRootId,
				options,
				onError: options.onError,
			})
			this.flushResult ??= (async () => {
				await Promise.resolve()
				this.flushResult = undefined
				return await this.flushBatchedTreeExtensions()
			})()

			if (!(await this.flushResult) || options.signal?.aborted) {
				return reject(DataBindingExtendAborted)
			}

			resolve(treeRootId)
		})
	}

	public async fetchData(fragment: Node, options?: { signal?: AbortSignal; environment?: Environment }): Promise<{
		data: ReceivedDataTree
		markerTreeRoot: MarkerTreeRoot
	}> {
		const markerTreeRoot = this.createMarkerTree(fragment, options?.environment ?? this.environment)
		const data = await this.fetchPersistedData(markerTreeRoot, options?.signal)

		return {
			data: data,
			markerTreeRoot,
		}
	}

	private async flushBatchedTreeExtensions(): Promise<boolean> {
		// This is an async operation so we just take whatever pendingExtensions there are now and let any new ones
		// accumulate in an empty set.
		const pendingExtensions = Array.from(this.pendingExtensions).filter(extension => {
			return !extension.options.signal?.aborted
		})
		this.pendingExtensions.clear()

		const aggregateMarkerTreeRoot = pendingExtensions.reduce<MarkerTreeRoot | undefined>(
			(previousValue, currentValue) => {
				if (previousValue === undefined) {
					return currentValue.markerTreeRoot
				}
				return MarkerMerger.mergeMarkerTreeRoots(previousValue, currentValue.markerTreeRoot)
			},
			undefined,
		)

		if (aggregateMarkerTreeRoot === undefined) {
			return false
		}

		const aggregateSignal = getCombinedSignal(pendingExtensions.map(extension => extension.options.signal))

		let aggregatePersistedData: ReceivedDataTree
		try {
			aggregatePersistedData = await this.fetchPersistedData(aggregateMarkerTreeRoot, aggregateSignal)
		} catch (e) {
			if (e instanceof GraphQlClientError) {
				if (e.type === 'aborted') {
					return false
				}
				for (const extension of pendingExtensions) {
					extension.onError?.(e)
				}
				if (!pendingExtensions.every(it => !!it.onError)) {
					this.onError(e, this)
				}
				return false
			} else {
				throw e
			}
		}

		if (aggregateSignal?.aborted) {
			return false
		}

		this.eventManager.syncOperation(() => {
			this.treeAugmenter.extendPersistedData(aggregatePersistedData, aggregateMarkerTreeRoot)

			for (const extension of pendingExtensions) {
				this.treeAugmenter.extendTreeStates(extension.newTreeRootId, extension.markerTreeRoot)
			}
		})
		return true
	}

	private async fetchPersistedData(
		tree: MarkerTreeRoot,
		signal?: AbortSignal,
	): Promise<ReceivedDataTree> {
		const queryGenerator = new QueryGenerator(tree, this.queryBuilder)
		const query = queryGenerator.getReadQuery()

		return await this.contentClient.query(query, {
			signal,
			onBeforeRequest: ({ query, variables }) => {
				// eslint-disable-next-line no-console
				console.debug(query, variables)
			},
		})
	}

	private resetTreeAfterSuccessfulPersist() {
		this.eventManager.syncTransaction(() => {
			this.accessorErrorManager.clearErrors()
			this.dirtinessTracker.reset()

			for (const [, rootState] of StateIterator.eachRootState(this.treeStore)) {
				for (const state of StateIterator.depthFirstAllNodes(rootState)) {
					switch (state.type) {
						case 'field': {
							if (state.hasUnpersistedChanges || state.touchLog?.size) {
								state.touchLog?.clear()
								state.hasUnpersistedChanges = false
								this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
							}
							break
						}
						case 'entityList':
							if (state.unpersistedChangesCount > 0 || state.plannedRemovals?.size) {
								state.unpersistedChangesCount = 0
								state.plannedRemovals?.clear()
								this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
							}
							break
						case 'entityRealm': {
							if (state.unpersistedChangesCount > 0 || state.plannedHasOneDeletions?.size) {
								state.unpersistedChangesCount = 0
								state.plannedHasOneDeletions?.clear()
								this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
							}
							break
						}
						default:
							assertNever(state)
					}
				}
			}
		})
	}

	private static getNextTreeRootIdSeed = (() => {
		let seed = 1
		return () => seed++
	})()

	private getNewTreeRootId() {
		// TODO this is an awful, awful hack.
		// TODO the particular shape of the alias is relied on in MutationAlias. If you change this, change it there too.
		return this.treeStore.markerTrees.size === 0
			? undefined
			: `${generateEnumerabilityPreventingEntropy()}-${DataBinding.getNextTreeRootIdSeed()}`
	}
}
