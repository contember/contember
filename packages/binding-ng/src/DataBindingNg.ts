import {
	BatchDeferredUpdates,
	BindingOperations,
	createQueryBuilder,
	DataBindingExtendAborted,
	Environment,
	EventListenersStore,
	ExtendTree,
	FetchData,
	GetEntityByKey,
	GetEntityListSubTree,
	GetEntitySubTree,
	MarkerTreeRoot,
	Persist,
	ReceivedDataTree,
	TreeRootAccessor,
} from '@contember/binding-common'
import { ContentClient, ContentQueryBuilder } from '@contember/client-content'
import { GraphQlClient, GraphQlClientError, TreeFilter } from '@contember/client'
import { QueryGenerator } from './QueryGenerator'
import { SubTreeInitializer } from './SubTreeInitializer'
import { EntityAccessorStore } from './accessors/EntityAccessorStore'
import { EntityStore } from './entities/EntityStore'

export type DataBindingEvents<Node> = {
	update: (args: { accessor: TreeRootAccessor<Node>; options: BindingOperations<Node> }) => void
	error: (args: { error: Error; options: BindingOperations<Node> }) => void
}

export class DataBindingNg<Node> implements BindingOperations<Node> {
	private queryBuilder: ContentQueryBuilder

	#events = new EventListenersStore<DataBindingEvents<Node>>()
	private readonly entityAccessorStore: EntityAccessorStore
	private readonly subTreeInitializer: SubTreeInitializer

	constructor(
		public readonly contentClient: GraphQlClient,
		public readonly systemClient: GraphQlClient,
		public readonly tenantClient: GraphQlClient,
		private readonly environment: Environment,
		private readonly createMarkerTree: (node: Node, environment: Environment) => MarkerTreeRoot,
	) {
		this.entityAccessorStore = new EntityAccessorStore()
		const schema = this.environment.getSchema()
		this.subTreeInitializer = new SubTreeInitializer(
			schema,
			new EntityStore(schema),
			this.entityAccessorStore,
		)
		this.queryBuilder = createQueryBuilder(schema)
	}

	addEventListener<Type extends keyof DataBindingEvents<Node>>(type: Type, handler: DataBindingEvents<Node>[Type]): () => void {
		return this.#events.add({ type }, handler)
	}

	getTreeFilters(): TreeFilter[] {
		throw new Error('Method not implemented.')
	}

	extendTree: ExtendTree<Node> = async (newFragment, options = {}) => {
		if (options.signal?.aborted) {
			return Promise.reject(DataBindingExtendAborted)
		}
		// todo check if marker tree already exists
		// todo batch updates

		const signal = options.signal

		const markerTreeRoot = this.createMarkerTree(newFragment, options.environment ?? this.environment)
		const persistedData = await this.fetchPersistedData(markerTreeRoot, signal)

		if (signal?.aborted || persistedData === undefined) {
			return
		}
		this.subTreeInitializer.receiveData(markerTreeRoot, persistedData)
		this.invokeUpdate()
	}

	private invokeUpdate() {
		this.#events.invoke({ type: 'update' },  {
			accessor: new TreeRootAccessor(false, false, this), // todo
			options: this,
		})

	}

	fetchData: FetchData<Node> = () => {
		throw new Error()
	}

	batchDeferredUpdates: BatchDeferredUpdates = () => {
		throw new Error('Method not implemented.')
	}

	persist: Persist = () => {
		throw new Error('Method not implemented.')
	}

	getEntityByKey: GetEntityByKey = key => {
		return this.entityAccessorStore.getEntityByKey(key)
	}

	getEntityListSubTree: GetEntityListSubTree = (params, treeRootId, env) => {
		return this.entityAccessorStore.getEntityListSubTree(params, env ?? this.environment).getAccessor()
	}

	getEntitySubTree: GetEntitySubTree = (params, treeRootId, env) => {
		return this.entityAccessorStore.getEntitySubTree(params, env ?? this.environment).getAccessor()
	}

	private async fetchPersistedData(
		tree: MarkerTreeRoot,
		signal?: AbortSignal,
	): Promise<ReceivedDataTree | undefined> {
		const queryGenerator = new QueryGenerator(tree, this.queryBuilder)
		const query = queryGenerator.getReadQuery()

		try {
			const contentClient = new ContentClient(this.contentClient)
			return await contentClient.query(query, {
				signal,
				onBeforeRequest: ({ query, variables }) => {
					// eslint-disable-next-line no-console
					console.debug(query, variables)
				},
			})
		} catch (e) {
			if (e instanceof GraphQlClientError) {
				if (e.type === 'aborted') {
					return undefined
				}
				this.onError(e)
			}
		}
	}

	private onError(e: Error) {
		this.#events.invoke({ type: 'error' }, { error: e, options: this })
	}
}
