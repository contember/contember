import type { GraphQlClient, GraphQlClientFailedRequestMetadata, TreeFilter } from '@contember/client'
import type { ReactNode } from 'react'
import {
	AsyncBatchUpdatesOptions,
	BatchUpdatesOptions,
	BindingOperations,
	ExtendTreeOptions,
	PersistErrorOptions,
	PersistSuccessOptions,
	TreeRootAccessor,
} from '../accessors'
import {
	metadataToRequestError,
	MutationRequestResponse,
	QueryRequestResponse,
	RequestError,
	SuccessfulPersistResult,
} from '../accessorTree'
import type { Environment } from '../dao'
import type { MarkerTreeRoot } from '../markers'
import type { TreeRootId } from '../treeParameters'
import { assertNever, generateEnumerabilityPreventingEntropy } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import { EventManager } from './EventManager'
import { createBatchUpdatesOptions } from './factories'
import { MarkerMerger } from './MarkerMerger'
import { MarkerTreeGenerator } from './MarkerTreeGenerator'
import { MutationGenerator } from './MutationGenerator'
import { QueryGenerator } from './QueryGenerator'
import { Schema, SchemaLoader } from './schema'
import { StateIterator } from './state'
import { StateInitializer } from './StateInitializer'
import { TreeAugmenter } from './TreeAugmenter'
import { TreeFilterGenerator } from './TreeFilterGenerator'
import { TreeStore } from './TreeStore'
import type { UpdateMetadata } from './UpdateMetadata'
import { getCombinedSignal } from './utils'

export class DataBinding {
	private static readonly schemaLoadCache: Map<string, Schema | Promise<Schema>> = new Map()

	private readonly accessorErrorManager: AccessorErrorManager
	private readonly batchUpdatesOptions: BatchUpdatesOptions
	private readonly asyncBatchUpdatesOptions: AsyncBatchUpdatesOptions
	private readonly bindingOperations: BindingOperations
	private readonly config: Config
	private readonly dirtinessTracker: DirtinessTracker
	private readonly eventManager: EventManager
	private readonly stateInitializer: StateInitializer
	private readonly treeAugmenter: TreeAugmenter
	private readonly treeStore: TreeStore

	// private treeRootListeners: {
	// 	eventListeners: {}
	// } = {
	// 	eventListeners: {},
	// }

	public constructor(
		private readonly contentApiClient: GraphQlClient,
		private readonly systemApiClient: GraphQlClient,
		private readonly tenantApiClient: GraphQlClient,
		private readonly environment: Environment,
		private readonly onUpdate: (newData: TreeRootAccessor) => void,
		private readonly onError: (error: RequestError) => void,
		private readonly onPersistSuccess: (result: SuccessfulPersistResult) => void,
	) {
		this.config = new Config()
		this.treeStore = new TreeStore()
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
		)
		this.accessorErrorManager = new AccessorErrorManager(this.eventManager, this.treeStore)
		this.stateInitializer = new StateInitializer(
			this.accessorErrorManager,
			this.batchUpdatesOptions,
			this.config,
			this.eventManager,
			this.treeStore,
		)
		this.treeAugmenter = new TreeAugmenter(this.eventManager, this.stateInitializer, this.treeStore)

		// TODO move this elsewhere
		this.bindingOperations = Object.freeze<BindingOperations>({
			...this.asyncBatchUpdatesOptions,
			getTreeFilters: (): TreeFilter[] => {
				const generator = new TreeFilterGenerator(this.treeStore)
				return generator.generateTreeFilter()
			},
			batchDeferredUpdates: performUpdates => {
				this.eventManager.syncTransaction(() => performUpdates(this.bindingOperations))
			},
			extendTree: async (...args) => await this.extendTree(...args),
			persist: async ({ signal, onPersistSuccess, onPersistError } = {}) =>
				await this.eventManager.persistOperation(async () => {
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
							await onPersistError?.(persistErrorOptions)

							if (shouldTryAgain) {
								continue // Trying again immediately
							}

							throw {
								errors: this.accessorErrorManager.getErrors(),
								type: 'invalidInput',
							}
						}

						const generator = new MutationGenerator(this.treeStore)
						const mutation = generator.getPersistMutation()

						if (mutation === undefined) {
							this.dirtinessTracker.reset() // TODO This ideally shouldn't be necessary but given the current limitations, this makes for better UX.
							const persistSuccessOptions: PersistSuccessOptions = {
								...this.bindingOperations,
								successType: 'nothingToPersist',
							}
							await this.eventManager.triggerOnPersistSuccess(persistSuccessOptions)
							await onPersistSuccess?.(persistSuccessOptions)

							return {
								type: 'nothingToPersist',
							}
						}

						const mutationResponse: MutationRequestResponse = await this.contentApiClient.sendRequest(mutation, {
							signal,
						})

						if (mutationResponse.errors !== undefined && mutationResponse.errors.length > 0) {
							this.onError({
								type: 'gqlError',
								query: mutation,
								errors: mutationResponse.errors,
							})
						}

						const mutationData = mutationResponse.data?.transaction ?? {}
						const aliases = Object.keys(mutationData)
						if (!mutationResponse.data) {
							throw {
								errors: mutationData.errors,
								type: 'invalidResponse',
							}
						} else if (aliases.every(item => mutationData[item].ok)) {
							const persistedEntityIds = aliases.map(alias => mutationData[alias].node?.id).filter(id => id !== undefined)
							const result: SuccessfulPersistResult = {
								type: 'justSuccess',
								persistedEntityIds,
							}

							try {
								await this.eventManager.asyncTransaction(async () => {
									this.resetTreeAfterSuccessfulPersist()
									this.treeAugmenter.updatePersistedData(
										Object.fromEntries(
											Object.entries(mutationData).map(([placeholderName, subTreeResponse]) => [
												placeholderName,
												subTreeResponse.node,
											]),
										),
									)
									const persistSuccessOptions: PersistSuccessOptions = {
										...this.bindingOperations,
										successType: result.type,
									}
									await this.eventManager.triggerOnPersistSuccess(persistSuccessOptions)
									await onPersistSuccess?.(persistSuccessOptions)

									this.treeAugmenter.resetCreatingSubTrees()
								})
							} catch (e) {
								console.error(e)
								const resultWithError = {
									...result,
									afterPersistError: e,
								}
								this.onPersistSuccess(resultWithError)
								return resultWithError
							}
							this.onPersistSuccess(result)
							return result
						} else {
							this.eventManager.syncTransaction(() => this.accessorErrorManager.replaceErrors(mutationData))
							await this.eventManager.triggerOnPersistError(persistErrorOptions)
							await onPersistError?.(persistErrorOptions)
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
								errors: this.accessorErrorManager.getErrors(),
								type: 'invalidInput',
							}
						}
					}
					// Max attempts exceeded
					// TODO fire persist error
					throw {
						type: 'givenUp',
					}
				}),
		})
	}

	private resolvedOnUpdate = ({ isMutating }: UpdateMetadata) => {
		this.onUpdate(new TreeRootAccessor(this.dirtinessTracker.hasChanges(), isMutating, this.bindingOperations))
	}

	// This is currently useless but potentially future-compatible
	// private readonly addTreeRootEventListener: TreeRootAccessor.AddTreeRootEventListener = this.getAddEventListener(
	// 	this.treeRootListeners,
	// )

	private pendingExtensions: Set<{
		markerTreeRoot: MarkerTreeRoot
		newFragment: ReactNode
		newTreeRootId: TreeRootId | undefined
		options: ExtendTreeOptions
		reject: () => void
		resolve: (newRootId: TreeRootId | undefined) => void
	}> = new Set()

	public async extendTree(newFragment: ReactNode, options: ExtendTreeOptions = {}): Promise<TreeRootId | undefined> {
		if (options.signal?.aborted) {
			return Promise.reject(DataBindingExtendAborted)
		}
		const schema = await this.getOrLoadSchema()
		this.treeStore.setSchema(schema)
		const markerTreeRoot = new MarkerTreeGenerator(newFragment, (options.environment ?? this.environment).withSchema(schema)).generate()

		if (this.treeStore.effectivelyHasTreeRoot(markerTreeRoot)) {
			// This isn't perfectly accurate as theoretically, we could already have all the data necessary but this
			// could still be false.

			return this.eventManager.syncOperation(() => {
				const newTreeRootId = this.getNewTreeRootId()
				this.treeAugmenter.extendTreeStates(newTreeRootId, markerTreeRoot)
				return newTreeRootId
			})
		}

		return await new Promise((resolve, reject) => {
			this.pendingExtensions.add({
				markerTreeRoot,
				newFragment,
				newTreeRootId: this.getNewTreeRootId(),
				options,
				reject: () => reject(DataBindingExtendAborted),
				resolve,
			})
			const pendingExtensionsCount = this.pendingExtensions.size

			Promise.resolve().then(() => {
				if (pendingExtensionsCount < this.pendingExtensions.size) {
					return
				}
				this.flushBatchedTreeExtensions()
			})
		})
	}

	private async flushBatchedTreeExtensions() {
		// This is an async operation so we just take whatever pendingExtensions there are now and let any new ones
		// accumulate in an empty set.
		const pendingExtensions = Array.from(this.pendingExtensions).filter(extension => {
			if (extension.options.signal?.aborted) {
				extension.reject()
				return false
			}
			return true
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
			return
		}

		const aggregateSignal = getCombinedSignal(pendingExtensions.map(extension => extension.options.signal))

		const aggregatePersistedData = await this.fetchPersistedData(aggregateMarkerTreeRoot, aggregateSignal)

		if (aggregateSignal?.aborted) {
			return
		}

		this.eventManager.syncOperation(() => {
			this.treeAugmenter.extendPersistedData(aggregatePersistedData?.data ?? {})

			for (const extension of pendingExtensions) {
				this.treeAugmenter.extendTreeStates(extension.newTreeRootId, extension.markerTreeRoot)
				extension.resolve(extension.newTreeRootId)
			}
		})
	}

	private async fetchPersistedData(
		tree: MarkerTreeRoot,
		signal?: AbortSignal,
	): Promise<QueryRequestResponse | undefined> {
		const queryGenerator = new QueryGenerator(tree)
		const query = queryGenerator.getReadQuery()

		let queryResponse: QueryRequestResponse | undefined = undefined

		try {
			queryResponse =
				query === undefined
					? undefined
					: await this.contentApiClient.sendRequest(query, {
							signal,
					  })
		} catch (metadata) {
			if (metadata.name === 'AbortError') {
				return
			}
			this.onError(metadataToRequestError(metadata as GraphQlClientFailedRequestMetadata))
		}

		if (queryResponse && queryResponse.errors !== undefined && queryResponse.errors.length > 0) {
			this.onError({
				type: 'gqlError',
				query: query ?? 'unknown query',
				errors: queryResponse.errors,
			})
		}

		return queryResponse
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

	private getOrLoadSchema(): Schema | Promise<Schema> {
		const existing = DataBinding.schemaLoadCache.get(this.contentApiClient.apiUrl)
		if (existing !== undefined) {
			return existing
		}

		const schemaPromise = SchemaLoader.loadSchema(this.contentApiClient, this.config.getValue('maxSchemaLoadAttempts'))
		schemaPromise.then(schema => {
			DataBinding.schemaLoadCache.set(this.contentApiClient.apiUrl, schema)
		})
		DataBinding.schemaLoadCache.set(this.contentApiClient.apiUrl, schemaPromise)
		return schemaPromise
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

export const DataBindingExtendAborted = Symbol('aborted')
