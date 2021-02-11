import { GraphQlClient, TreeFilter } from '@contember/client'
import * as React from 'react'
import {
	BindingOperations,
	EntityAccessor,
	EntityListAccessor,
	ExtendTreeOptions,
	PersistErrorOptions,
	TreeRootAccessor,
} from '../accessors'
import {
	metadataToRequestError,
	MutationErrorType,
	MutationRequestResponse,
	PersistResultSuccessType,
	QueryRequestResponse,
	RequestError,
	SuccessfulPersistResult,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import { MarkerTreeRoot, PlaceholderGenerator } from '../markers'
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
import { Schema, SchemaLoader, SchemaValidator } from './schema'
import { StateInitializer } from './StateInitializer'
import { TreeAugmenter } from './TreeAugmenter'
import { TreeFilterGenerator } from './TreeFilterGenerator'
import { TreeStore } from './TreeStore'

export class DataBinding {
	private static readonly schemaLoadCache: Map<string, Schema | Promise<Schema>> = new Map()

	private readonly accessorErrorManager: AccessorErrorManager
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
		private readonly client: GraphQlClient,
		private readonly environment: Environment,
		private readonly onUpdate: (newData: TreeRootAccessor) => void,
		private readonly onError: (error: RequestError) => void,
	) {
		this.config = new Config()
		this.treeStore = new TreeStore()
		this.dirtinessTracker = new DirtinessTracker()
		this.eventManager = new EventManager(
			this.bindingOperations,
			this.config,
			this.dirtinessTracker,
			this.resolvedOnUpdate,
			this.treeStore,
		)
		this.accessorErrorManager = new AccessorErrorManager(this.eventManager, this.treeStore)
		this.stateInitializer = new StateInitializer(
			this.accessorErrorManager,
			this.bindingOperations,
			this.config,
			this.eventManager,
			this.treeStore,
		)
		this.treeAugmenter = new TreeAugmenter(this.eventManager, this.stateInitializer, this.treeStore)
	}

	private resolvedOnUpdate = (isMutating: boolean) => {
		this.onUpdate(new TreeRootAccessor(this.dirtinessTracker.hasChanges(), isMutating, this.bindingOperations))
	}

	private readonly bindingOperations = Object.freeze<BindingOperations>({
		hasEntityKey: key => {
			return this.treeStore.entityRealmStore.has(key)
		},
		hasSubTree: aliasOrParameters => {
			if (typeof aliasOrParameters === 'string') {
				return this.treeStore.markerTree.placeholdersByAliases.has(aliasOrParameters)
			}
			return this.treeStore.markerTree.subTrees.has(PlaceholderGenerator.getSubTreeMarkerPlaceholder(aliasOrParameters))
		},
		getEntityByKey: key => {
			const realm = this.treeStore.entityRealmStore.get(key)

			if (realm === undefined) {
				throw new BindingError(`Trying to retrieve a non-existent entity: key '${key}' was not found.`)
			}
			return realm.getAccessor()
		},
		getEntityListSubTree: (
			aliasOrParameters: Alias | BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList,
		): EntityListAccessor => {
			const subTreeState = this.treeStore.getSubTreeState(aliasOrParameters)
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
			const subTreeState = this.treeStore.getSubTreeState(aliasOrParameters)
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
			const generator = new TreeFilterGenerator(this.treeStore)
			return generator.generateTreeFilter()
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

					const mutationResponse: MutationRequestResponse = await this.client.sendRequest(mutation, { signal })
					const mutationData = mutationResponse.data?.transaction ?? {}
					const aliases = Object.keys(mutationData)
					const allSubMutationsOk = aliases.every(item => mutationData[item].ok)

					if (allSubMutationsOk) {
						const persistedEntityIds = aliases.map(alias => mutationData[alias].node.id)
						const result: SuccessfulPersistResult = {
							type: PersistResultSuccessType.JustSuccess,
							persistedEntityIds,
						}

						this.eventManager.syncTransaction(() => {
							this.accessorErrorManager.clearErrors()
							this.dirtinessTracker.reset()
							// TODO clear thoroughly. Planned removals, everything.
							this.treeAugmenter.updatePersistedData(
								Object.fromEntries(
									Object.entries(mutationData).map(([placeholderName, subTreeResponse]) => [
										placeholderName,
										subTreeResponse.node,
									]),
								),
							)
							this.eventManager.triggerOnPersistSuccess({
								...this.bindingOperations,
								successType: result.type,
								unstable_persistedEntityIds: persistedEntityIds,
							})
						})
						return result
					} else {
						this.eventManager.syncTransaction(() => this.accessorErrorManager.replaceErrors(mutationData))
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
				// Max attempts exceeded
				throw {
					type: MutationErrorType.GivenUp,
				}
			})
		},
	})

	// This is currently useless but potentially future-compatible
	// private readonly addTreeRootEventListener: TreeRootAccessor.AddTreeRootEventListener = this.getAddEventListener(
	// 	this.treeRootListeners,
	// )

	public async extendTree(newFragment: React.ReactNode, { signal }: ExtendTreeOptions = {}) {
		return await this.eventManager.asyncOperation(async () => {
			if (signal?.aborted) {
				return Promise.reject()
			}
			const newMarkerTree = new MarkerTreeGenerator(newFragment, this.environment).generate()

			const schemaOrPromise = this.getOrLoadSchema()

			let newPersistedData: QueryRequestResponse | undefined

			if (schemaOrPromise instanceof Promise) {
				// We don't have a schema yet. We'll still optimistically fire the request so as to prevent a waterfall
				// in the most likely case that things will go fine and the query matches the schema.
				const newPersistedDataPromise = this.fetchPersistedData(newMarkerTree, signal)

				const schema = await schemaOrPromise

				// TODO we shouldn't just CHANGE the schema like that.
				this.treeStore.updateSchema(schema)

				if (__DEV_MODE__) {
					SchemaValidator.assertTreeValid(schema, newMarkerTree)
				}
				newPersistedData = await newPersistedDataPromise
			} else {
				if (__DEV_MODE__) {
					SchemaValidator.assertTreeValid(schemaOrPromise, newMarkerTree)
				}
				newPersistedData = await this.fetchPersistedData(newMarkerTree, signal)
			}

			if (signal?.aborted) {
				return Promise.reject()
			}

			this.treeAugmenter.extendTree(newMarkerTree, newPersistedData?.data ?? {})
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
					: await this.client.sendRequest(query, {
							signal,
					  })
		} catch (metadata) {
			if (metadata.name === 'AbortError') {
				return
			}
			this.onError(metadataToRequestError(metadata as GraphQlClient.FailedRequestMetadata))
		}
		return queryResponse
	}

	private getOrLoadSchema(): Schema | Promise<Schema> {
		const existing = DataBinding.schemaLoadCache.get(this.client.apiUrl)
		if (existing !== undefined) {
			return existing
		}

		const schemaPromise = SchemaLoader.loadSchema(this.client, this.config.getValue('maxSchemaLoadAttempts'))
		schemaPromise.then(schema => {
			DataBinding.schemaLoadCache.set(this.client.apiUrl, schema)
		})
		DataBinding.schemaLoadCache.set(this.client.apiUrl, schemaPromise)
		return schemaPromise
	}
}
