import * as ReactDOM from 'react-dom'
import {
	BatchUpdatesOptions,
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	PersistErrorOptions,
	PersistSuccessOptions,
} from '../accessors'
import { SuccessfulPersistResult } from '../accessorTree'
import { BindingError } from '../BindingError'
import { HasManyRelationMarker } from '../markers'
import { EntityListEventListeners, PlaceholderName, SingleEntityEventListeners } from '../treeParameters'
import { assertNever } from '../utils'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import {
	EntityListState,
	EntityRealmState,
	getEntityMarker,
	RootStateNode,
	StateINode,
	StateIterator,
	StateNode,
	StateType,
} from './state'
import { TreeParameterMerger } from './TreeParameterMerger'
import { TreeStore } from './TreeStore'

export class EventManager {
	public static readonly NO_CHANGES_DIFFERENCE = 0

	private transactionDepth = 0
	private isFrozenWhileUpdating = false

	private ongoingPersistOperation: Promise<SuccessfulPersistResult> | undefined = undefined
	private hasEverUpdated = false

	private newlyInitializedWithListeners: Set<EntityListState | EntityRealmState> = new Set()
	private pendingWithBeforeUpdate: Set<StateNode> = new Set()
	private rootsWithPendingUpdates: Set<RootStateNode> = new Set()

	public constructor(
		private readonly batchUpdatesOptions: BatchUpdatesOptions,
		private readonly config: Config,
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly onUpdate: (isMutating: boolean) => void,
		private readonly treeStore: TreeStore,
	) {}

	public async persistOperation(operation: () => Promise<SuccessfulPersistResult>): Promise<SuccessfulPersistResult> {
		if (this.transactionDepth > 0) {
			throw new BindingError(`Cannot trigger a persist whilst batching updates!`)
		}
		const ongoingOperation = this.ongoingPersistOperation
		if (ongoingOperation !== undefined) {
			return await ongoingOperation
		}
		return await (this.ongoingPersistOperation = new Promise<SuccessfulPersistResult>(async (resolve, reject) => {
			this.updateTreeRoot() // Let the world know that we're mutating
			try {
				resolve(await this.asyncOperation(operation))
			} catch (e) {
				console.error('PersistError', e)
				reject(e)
			} finally {
				this.ongoingPersistOperation = undefined
				this.updateTreeRoot()
			}
		}))
	}

	public syncTransaction<T>(transaction: () => T) {
		try {
			this.transactionDepth++
			return transaction()
		} finally {
			this.transactionDepth--
		}
	}
	public syncOperation<T>(operation: () => T) {
		try {
			return this.syncTransaction(operation)
		} finally {
			this.flushUpdates()
		}
	}

	public async asyncTransaction<T>(transaction: () => Promise<T>): Promise<T> {
		try {
			this.transactionDepth++
			return await transaction()
		} finally {
			this.transactionDepth--
		}
	}
	public async asyncOperation<T>(operation: () => Promise<T>): Promise<T> {
		try {
			return await this.asyncTransaction(operation)
		} finally {
			this.flushUpdates()
		}
	}

	private flushUpdates() {
		if (this.transactionDepth > 0) {
			return
		}

		if (this.isFrozenWhileUpdating) {
			throw new BindingError(
				`Trying to perform an update while the whole accessor tree is already updating. This is most likely caused ` +
					`by updating the accessor tree during rendering or in the 'update' event handler, which is a no-op. ` +
					`If you wish to mutate the tree in reaction to other changes, use the 'beforeUpdate' event.`,
			)
		}

		if (this.hasEverUpdated && !this.rootsWithPendingUpdates.size) {
			return
		}
		this.hasEverUpdated = true

		console.log({
			realms: this.treeStore.entityRealmStore.size,
			entities: this.treeStore.entityStore.size,
		})

		ReactDOM.unstable_batchedUpdates(() => {
			this.isFrozenWhileUpdating = true
			this.triggerBeforeFlushEvents()
			this.updateTreeRoot()
			this.flushPendingAccessorUpdates(Array.from(this.rootsWithPendingUpdates))
			this.rootsWithPendingUpdates.clear()
			this.isFrozenWhileUpdating = false
		})
	}

	public registerNewlyInitialized(newlyInitialized: EntityListState | EntityRealmState) {
		const listeners = Array.isArray(newlyInitialized) ? newlyInitialized[1].initialEventListeners : newlyInitialized

		if (listeners && Object.values(listeners.eventListeners).filter(listeners => !!listeners).length) {
			this.newlyInitializedWithListeners.add(newlyInitialized)
		}
	}

	public registerUpdatedConnection(parentState: EntityRealmState, placeholderName: PlaceholderName) {
		if (parentState.fieldsWithPendingConnectionUpdates === undefined) {
			parentState.fieldsWithPendingConnectionUpdates = new Set()
		}

		const marker = getEntityMarker(parentState)
		placeholders: for (const [fieldName, placeholdersByField] of marker.fields.placeholders) {
			if (typeof placeholdersByField === 'string') {
				if (placeholdersByField === placeholderName) {
					parentState.fieldsWithPendingConnectionUpdates.add(fieldName)
				}
			} else {
				for (const placeholderByFieldName of placeholdersByField) {
					if (placeholderByFieldName === placeholderName) {
						parentState.fieldsWithPendingConnectionUpdates.add(fieldName)
						continue placeholders
					}
				}
			}
		}
	}

	public registerJustUpdated(justUpdated: StateNode, changesDelta: number) {
		if (justUpdated.eventListeners.beforeUpdate) {
			this.pendingWithBeforeUpdate.add(justUpdated)
		}
		justUpdated.hasStaleAccessor = true

		switch (justUpdated.type) {
			case StateType.EntityRealm:
			case StateType.EntityList: {
				justUpdated.unpersistedChangesCount += changesDelta

				if (justUpdated.unpersistedChangesCount < 0) {
					debugger
				}

				const parent = justUpdated.blueprint.parent

				if (parent === undefined) {
					this.rootsWithPendingUpdates.add(justUpdated)
					this.dirtinessTracker.increaseBy(changesDelta)
				} else {
					if (!parent.childrenWithPendingUpdates) {
						parent.childrenWithPendingUpdates = new Set()
					}
					parent.childrenWithPendingUpdates.add(justUpdated as any)
					this.registerJustUpdated(parent, changesDelta)
				}
				break
			}
			case StateType.Field: {
				const parent = justUpdated.parent
				if (!parent.childrenWithPendingUpdates) {
					parent.childrenWithPendingUpdates = new Set()
				}
				parent.childrenWithPendingUpdates.add(justUpdated as any)
				this.registerJustUpdated(justUpdated.parent, changesDelta)
				break
			}
		}
	}

	private updateTreeRoot() {
		this.onUpdate(this.ongoingPersistOperation !== undefined)
	}

	private flushPendingAccessorUpdates(rootStates: Array<StateINode>) {
		// It is *CRUCIAL* that this is a BFS so that we update the components in top-down order.
		const agenda: StateNode[] = rootStates

		for (const state of agenda) {
			if (state.eventListeners.update !== undefined) {
				//console.log(state)
				for (const handler of state.eventListeners.update) {
					// TS can't quite handle the polymorphism here but this is fine.
					handler(state.getAccessor() as any)
				}
			}
			if (
				state.type === StateType.EntityRealm &&
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
				case StateType.EntityRealm:
				case StateType.EntityList: {
					if (state.childrenWithPendingUpdates !== undefined) {
						for (const childState of state.childrenWithPendingUpdates) {
							agenda.push(childState)
						}
						state.childrenWithPendingUpdates.clear()
					}
					break
				}
				case StateType.Field:
					// Do nothing
					break
				default:
					assertNever(state)
			}
		}
	}

	public async triggerOnBeforePersist() {
		return new Promise<void>(async resolve => {
			await this.asyncTransaction(async () => {
				const iNodeHasBeforePersist = (iNode: StateINode) => iNode.eventListeners.beforePersist !== undefined

				// TODO if an entity from here (or its parent) gets deleted, we need to remove stale handlers from here.
				const callbackQueue: Array<[
					// The typings could be nicer but TS…
					StateINode,
					EntityAccessor.BeforePersistHandler | EntityListAccessor.BeforePersistHandler,
				]> = []

				for (const [, subTreeState] of StateIterator.eachRootState(this.treeStore)) {
					for (const iNode of StateIterator.depthFirstINodes(subTreeState, iNodeHasBeforePersist)) {
						for (const listener of iNode.eventListeners.beforePersist!) {
							callbackQueue.push([iNode, listener])
						}
					}
				}
				for (
					let waterfallDepth = 0;
					waterfallDepth < this.config.getValue('beforePersistSettleLimit');
					waterfallDepth++
				) {
					const callbackReturns: Array<Promise<
						EntityAccessor.BeforePersistHandler | EntityListAccessor.BeforePersistHandler
					>> = []
					const correspondingStates: Array<StateINode> = []

					if (callbackQueue.length === 0) {
						break
					}

					for (const [state, callback] of callbackQueue) {
						const changesCountBefore = this.dirtinessTracker.getChangesCount()
						const result = callback(state.getAccessor as any, this.batchUpdatesOptions) // TS can't quite handle this but this is sound.
						const changesCountAfter = this.dirtinessTracker.getChangesCount()

						if (result instanceof Promise) {
							if (__DEV_MODE__) {
								if (changesCountBefore !== changesCountAfter) {
									// This isn't bulletproof. They could e.g. undo a change and make another one which would
									// slip through this detection. But for most cases, it should be good enough and not too expensive.
									throw new BindingError(
										`A beforePersist event handler cannot be asynchronous and alter the accessor tree at the same time. ` +
											`To achieve this, prepare your data asynchronously but only touch the tree from a returned callback.`,
									)
								}
							}

							callbackReturns.push(result)
							correspondingStates.push(state)
						}
					}
					// TODO timeout
					const newCallbacks = await Promise.allSettled(callbackReturns)

					callbackQueue.length = 0 // Empties the queue

					// TODO we're drifting away from the original depth-first order. Let's see if that's ever even an issue.
					for (const newlyInitialized of this.newlyInitializedWithListeners) {
						if (newlyInitialized.eventListeners.beforePersist) {
							for (const listener of newlyInitialized.eventListeners.beforePersist) {
								callbackQueue.push([newlyInitialized, listener])
							}
						}
					}

					this.triggerBeforeFlushEvents()

					for (let i = 0; i < newCallbacks.length; i++) {
						const result = newCallbacks[i]
						const correspondingState = correspondingStates[i]

						if (result.status === 'fulfilled') {
							callbackQueue.push([correspondingState, result.value])
						} else {
							// We just silently stop.
							// That's NOT ideal but what else exactly do we do so that it's even remotely recoverable?
							if (__DEV_MODE__) {
								throw new BindingError(
									`A beforePersist handler returned a promise that rejected. ` +
										`This is a no-op that will fail silently in production.`,
								)
							}
						}
					}
				}
				if (__DEV_MODE__) {
					if (callbackQueue.length) {
						throw new BindingError(
							`Exceeded the beforePersist settle limit. Your code likely contains a deadlock. ` +
								`If that's not the case, raise the settle limit from DataBindingProvider.`,
						)
					}
				}
			})
			resolve()
		})
	}

	private triggerBeforeFlushEvents() {
		this.syncTransaction(() => {
			const settleLimit = this.config.getValue('beforeUpdateSettleLimit')

			for (let attemptNumber = 0; attemptNumber < settleLimit; attemptNumber++) {
				if (!this.pendingWithBeforeUpdate.size) {
					this.triggerOnInitialize()
					return
				}
				const withBeforeUpdate = this.pendingWithBeforeUpdate
				this.pendingWithBeforeUpdate = new Set()

				for (const state of withBeforeUpdate) {
					const listeners = state.eventListeners.beforeUpdate
					if (listeners === undefined) {
						// This can happen if the listener has unsubscribed since we added it to the set.
						continue
					}
					switch (state.type) {
						case StateType.Field:
							for (const listener of listeners) {
								;(listener as FieldAccessor.BeforeUpdateListener)(state.getAccessor())
							}
							break
						case StateType.EntityRealm:
						case StateType.EntityList:
							for (const listener of listeners) {
								state.batchUpdates(listener as any)
							}
							break
						default:
							return assertNever(state)
					}
				}

				this.triggerOnInitialize()
			}
			throw new BindingError(
				`Maximum stabilization limit of updates caused by 'beforeUpdate' exceeded. ` +
					`This likely means there is an infinite feedback loop in your code.`,
			)
		})
	}

	private triggerOnInitialize() {
		this.syncTransaction(() => {
			for (const state of this.newlyInitializedWithListeners) {
				const listeners = state.eventListeners.initialize

				if (listeners) {
					for (const listener of listeners) {
						listener(state.getAccessor as any, this.batchUpdatesOptions)
					}
				}
				if (state.type === StateType.EntityRealm) {
					state.entity.hasIdSetInStone = true
				}
			}
			this.newlyInitializedWithListeners.clear()
		})
	}

	public async triggerOnPersistError(options: PersistErrorOptions) {
		return new Promise<void>(async resolve => {
			await this.asyncTransaction(async () => {
				const iNodeHasPersistErrorHandler = (iNode: StateINode) => iNode.eventListeners.persistError !== undefined

				const handlerPromises: Array<Promise<void>> = []

				for (const [, subTreeState] of StateIterator.eachRootState(this.treeStore)) {
					for (const iNode of StateIterator.depthFirstINodes(subTreeState, iNodeHasPersistErrorHandler)) {
						for (const listener of iNode.eventListeners.persistError!) {
							const result = listener(iNode.getAccessor as any, options)

							if (result instanceof Promise) {
								handlerPromises.push(result)
							}
						}
					}
				}

				// TODO timeout
				const handlerResults = await Promise.allSettled(handlerPromises)

				if (__DEV_MODE__) {
					for (const result of handlerResults) {
						if (result.status === 'rejected') {
							throw new BindingError(
								`A persistError handler returned a promise that rejected. ` +
									`This is a no-op that will fail silently in production.`,
							)
						}
					}
				}
				return resolve()
			})
		})
	}

	public triggerOnPersistSuccess(options: PersistSuccessOptions) {
		this.syncTransaction(() => {
			const iNodeHasPersistSuccessHandler = (iNode: StateINode) => iNode.eventListeners.persistSuccess !== undefined

			for (const [, subTreeState] of StateIterator.eachRootState(this.treeStore)) {
				for (const iNode of StateIterator.depthFirstINodes(subTreeState, iNodeHasPersistSuccessHandler)) {
					for (const listener of iNode.eventListeners.persistSuccess!) {
						listener(iNode.getAccessor as any, options)
					}
				}
			}
		})
	}

	public getEventListenersForListEntity(
		containingListState: EntityListState,
		additionalMarker?: HasManyRelationMarker,
	): SingleEntityEventListeners['eventListeners'] {
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
				create(additionalMarker.parameters),
			)
		}
		return eventListeners
	}
}
