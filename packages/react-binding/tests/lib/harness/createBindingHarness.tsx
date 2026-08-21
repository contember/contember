import { act, render } from '@testing-library/react'
import { ReactNode, useSyncExternalStore } from 'react'
import {
	BindingOperations,
	createQueryBuilder,
	DataBinding,
	EntityAccessor,
	EntityListAccessor,
	Environment,
	PersistOptions,
	Schema,
	SchemaStore,
	SuccessfulPersistResult,
	TreeStore,
} from '@contember/binding-legacy'
import { AccessorTree, AccessorTreeState, MarkerTreeGenerator } from '@contember/react-binding'
import { FakeContentApi, SubTreeFixtures } from './FakeContentApi.js'

export interface BindingHarnessOptions {
	schema: SchemaStore
	/** The very same tree the binding renders. Sub-trees are addressed by their alias throughout the harness. */
	node: ReactNode
	/** What the content API answers the initial query with, keyed by sub-tree alias. */
	data?: SubTreeFixtures
	/** The binding debug-logs every query it sends. Turn this on when a test needs to see them. */
	logRequests?: boolean
}

export interface BindingHarness {
	readonly server: FakeContentApi
	/** The very same operations a component would reach through `useBindingOperations`. */
	readonly bindingOperations: BindingOperations<ReactNode>
	readonly treeStore: TreeStore
	readonly environment: Environment
	getEntity(alias: string): EntityAccessor
	getEntityList(alias: string): EntityListAccessor
	/**
	 * Runs everything the callback does inside a single `act`, so React only re-renders once it returns. Put several
	 * steps in one call to keep them in the same window — a persist followed by an edit, say, which is where the
	 * interesting races live.
	 */
	update(performUpdates: () => void | Promise<void>): Promise<void>
	persist(options?: PersistOptions): Promise<SuccessfulPersistResult>
	unmount(): void
}

/**
 * Mounts a data binding on top of {@link FakeContentApi} and renders `node` through it, so that a test drives the
 * real thing: the query goes out, the accessors carry server data, `persist` really generates a mutation and the
 * response really lands back in the tree.
 */
export const createBindingHarness = async (
	{ schema: schemaStore, node, data, logRequests = false }: BindingHarnessOptions,
): Promise<BindingHarness> => {
	const schema = new Schema(schemaStore)
	const environment = Environment.create().withSchema(schema)
	const treeStore = new TreeStore(schema)
	const markerTree = new MarkerTreeGenerator(node, environment).generate()
	const server = new FakeContentApi({ markerTree, treeStore, queryBuilder: createQueryBuilder(schema) })

	if (data !== undefined) {
		server.setData(data)
	}

	const quietly = async (operation: () => Promise<void>) => {
		if (logRequests) {
			return await operation()
		}
		const debug = console.debug
		console.debug = () => {}
		try {
			await operation()
		} finally {
			console.debug = debug
		}
	}

	let state: AccessorTreeState = { name: 'initializing', environment }
	let bindingOperations: BindingOperations<ReactNode> | undefined
	const subscribers = new Set<() => void>()
	const publish = (newState: AccessorTreeState) => {
		state = newState
		for (const subscriber of subscribers) {
			subscriber()
		}
	}

	const client = server.createClient()
	const binding = new DataBinding<ReactNode>(
		client,
		client,
		client,
		treeStore,
		environment,
		(fragment, env) => new MarkerTreeGenerator(fragment, env).generate(),
		callback => callback(),
		data => {
			bindingOperations = data.bindingOperations
			publish({ name: 'initialized', environment, data })
		},
		error => publish({ name: 'error', environment, error }),
		() => {},
		{ skipStateUpdateAfterPersist: false },
	)

	const subscribe = (onStoreChange: () => void) => {
		subscribers.add(onStoreChange)
		return () => subscribers.delete(onStoreChange)
	}
	const getState = () => state

	const Root = () => {
		const currentState = useSyncExternalStore(subscribe, getState)
		return (
			<AccessorTree state={currentState}>
				{currentState.name === 'initialized' ? node : null}
			</AccessorTree>
		)
	}

	let result!: ReturnType<typeof render>
	await quietly(async () => {
		await act(async () => {
			result = render(<Root />)
			await binding.extendTree(node)
		})
	})

	if (bindingOperations === undefined) {
		throw new Error('The binding failed to initialize.')
	}
	const operations = bindingOperations

	const update = async (performUpdates: () => void | Promise<void>) => {
		await quietly(async () => {
			await act(async () => {
				await performUpdates()
			})
		})
	}

	const persist = async (options?: PersistOptions) => {
		let persistResult!: SuccessfulPersistResult
		await quietly(async () => {
			await act(async () => {
				persistResult = await operations.persist(options)
			})
		})
		return persistResult
	}

	return {
		server,
		bindingOperations: operations,
		treeStore,
		environment,
		getEntity: alias => treeStore.getSubTreeState('entity', undefined, alias, environment).getAccessor(),
		getEntityList: alias => treeStore.getSubTreeState('entityList', undefined, alias, environment).getAccessor(),
		update,
		persist,
		unmount: () => result.unmount(),
	}
}
