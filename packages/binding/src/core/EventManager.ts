import * as ReactDOM from 'react-dom'
import {
	BindingOperations,
	EntityAccessor,
	EntityListAccessor,
	PersistErrorOptions,
	PersistSuccessOptions,
	TreeRootAccessor,
} from '../accessors'
import { RequestError, SuccessfulPersistResult } from '../accessorTree'
import { BindingError } from '../BindingError'
import { HasManyRelationMarker } from '../markers'
import { EntityListEventListeners, SingleEntityEventListeners } from '../treeParameters'
import { FieldName } from '../treeParameters/primitives'
import { assertNever } from '../utils'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import {
	EntityListState,
	EntityRealm,
	EntityState,
	FieldState,
	StateINode,
	StateIterator,
	StateNode,
	StateType,
} from './state'
import { TreeParameterMerger } from './TreeParameterMerger'
import { TreeStore } from './TreeStore'

export class EventManager {
	private transactionDepth = 0
	private isFrozenWhileUpdating = false

	private ongoingPersistOperation: Promise<SuccessfulPersistResult> | undefined = undefined
	private hasUpdated = false

	private newlyInitializedWithListeners: Set<EntityListState | [EntityState, EntityRealm]> = new Set()
	private pendingWithBeforeUpdate: Set<EntityState | EntityListState | FieldState> = new Set()

	public constructor(
		private readonly bindingOperations: BindingOperations,
		private readonly config: Config,
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly onError: (error: RequestError) => void,
		private readonly onUpdate: (newData: TreeRootAccessor) => void,
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
				reject(e)
			} finally {
				this.ongoingPersistOperation = undefined
				this.updateTreeRoot()
			}
		}))
	}

	public syncTransaction(transaction: () => void) {
		try {
			this.transactionDepth++
			transaction()
		} finally {
			this.transactionDepth--
		}
	}
	public syncOperation(operation: () => void) {
		this.syncTransaction(operation)
		this.flushUpdates()
	}

	public async asyncTransaction<T>(transaction: () => Promise<T>): Promise<T> {
		this.transactionDepth++
		let result: T
		try {
			result = await transaction()
		} finally {
			this.transactionDepth--
		}
		return result
	}
	public async asyncOperation<T>(operation: () => Promise<T>): Promise<T> {
		const result = await this.asyncTransaction(operation)
		this.flushUpdates()
		return result
	}

	private flushUpdates() {
		if (this.transactionDepth > 0) {
			return
		}

		if (this.isFrozenWhileUpdating) {
			throw new BindingError(
				`Trying to perform an update while the whole accessor tree is already updating. This is most likely caused ` +
					`by updating the accessor tree during rendering or in the 'update' event handler, which is a no-op. ` +
					`If you wish to mutate the tree in reaction to changes, use the 'beforeUpdate' event handler.`,
			)
		}

		const rootsWithPendingUpdates = Array.from(this.treeStore.subTreeStates.values()).filter(
			state => state.hasPendingUpdate,
		)

		if (this.hasUpdated && !rootsWithPendingUpdates.length) {
			return
		}
		this.hasUpdated = true

		ReactDOM.unstable_batchedUpdates(() => {
			this.isFrozenWhileUpdating = true
			this.triggerBeforeFlushEvents()
			this.updateTreeRoot()
			this.flushPendingAccessorUpdates(rootsWithPendingUpdates)
			this.isFrozenWhileUpdating = false
		})
	}

	public registerChildInNeedOfUpdate(entityListState: EntityListState, updatedState: EntityState): void
	public registerChildInNeedOfUpdate(entityState: EntityState, updatedState: StateNode): void
	public registerChildInNeedOfUpdate(state: StateINode, updatedState: StateNode): void {
		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}
		state.childrenWithPendingUpdates.add(updatedState as EntityState)
	}

	public registerNewlyInitialized(newlyInitialized: EntityListState | [EntityState, EntityRealm]) {
		const listeners = Array.isArray(newlyInitialized) ? newlyInitialized[1].initialEventListeners : newlyInitialized

		if (listeners && Object.values(listeners.eventListeners).filter(listeners => !!listeners).length) {
			this.newlyInitializedWithListeners.add(newlyInitialized)
		}
	}

	public registerJustUpdated(justUpdated: FieldState | EntityState | EntityListState) {
		if (justUpdated.eventListeners.beforeUpdate) {
			this.pendingWithBeforeUpdate.add(justUpdated)
		}
	}

	private updateTreeRoot() {
		this.onUpdate(
			new TreeRootAccessor(
				this.dirtinessTracker.hasChanges(),
				this.ongoingPersistOperation !== undefined,
				this.bindingOperations,
			),
		)
	}

	private flushPendingAccessorUpdates(rootStates: Array<StateINode>) {
		// It is *CRUCIAL* that this is a BFS so that we update the components in top-down order.
		const agenda: StateNode[] = rootStates

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
				state.type === StateType.Entity &&
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
				case StateType.Entity:
				case StateType.EntityList: {
					if (state.childrenWithPendingUpdates !== undefined) {
						for (const childState of state.childrenWithPendingUpdates) {
							agenda.push(childState)
						}
						state.childrenWithPendingUpdates = undefined
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

				for (const [, subTreeState] of this.treeStore.subTreeStates) {
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

					for (const [state, callback] of callbackQueue) {
						const changesCountBefore = this.dirtinessTracker.getChangesCount()
						const result = callback(state.getAccessor as any, this.bindingOperations) // TS can't quite handle this but this is sound.
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
					const newCallbacks = await Promise.allSettled(callbackReturns)

					callbackQueue.length = 0

					// TODO we're drifting away from the original depth-first order. Let's see if that's ever even an issue.
					for (const newlyInitialized of this.newlyInitializedWithListeners) {
						const listeners = Array.isArray(newlyInitialized)
							? newlyInitialized[1].initialEventListeners
							: newlyInitialized
						if (listeners && listeners.eventListeners.beforePersist) {
							for (const listener of listeners.eventListeners.beforePersist) {
								callbackQueue.push([Array.isArray(newlyInitialized) ? newlyInitialized[0] : newlyInitialized, listener])
							}
						}
					}

					this.triggerBeforeFlushEvents()

					for (let i = 0; i < newCallbacks.length; i++) {
						const result = newCallbacks[i]
						const correspondingState = correspondingStates[i]

						if (result.status === 'fulfilled') {
							callbackQueue.push([correspondingState as any, result.value])
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
					switch (state.type) {
						case StateType.Field:
							for (const listener of state.eventListeners.beforeUpdate!) {
								listener(state.getAccessor())
							}
							break
						case StateType.Entity:
							for (const listener of state.eventListeners.beforeUpdate!) {
								state.batchUpdates(listener)
							}
							break
						case StateType.EntityList:
							for (const listener of state.eventListeners.beforeUpdate!) {
								state.batchUpdates(listener)
							}
							break
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
		let hasOnInitialize = false

		this.syncTransaction(() => {
			for (const newlyInitialized of this.newlyInitializedWithListeners) {
				const listeners = Array.isArray(newlyInitialized) ? newlyInitialized[1].initialEventListeners : newlyInitialized
				const state = Array.isArray(newlyInitialized) ? newlyInitialized[0] : newlyInitialized

				if (listeners && listeners.eventListeners.initialize) {
					for (const listener of listeners.eventListeners.initialize) {
						listener(state.getAccessor as any, this.bindingOperations)
						hasOnInitialize = true
					}
				}
				if (state.type === StateType.Entity) {
					state.hasIdSetInStone = true
				}
			}
		})
		this.newlyInitializedWithListeners.clear()
	}

	public async triggerOnPersistError(options: PersistErrorOptions) {
		return new Promise<void>(async resolve => {
			await this.asyncTransaction(async () => {
				const iNodeHasPersistErrorHandler = (iNode: StateINode) => iNode.eventListeners.persistError !== undefined

				const handlerPromises: Array<Promise<void>> = []

				for (const [, subTreeState] of this.treeStore.subTreeStates) {
					for (const iNode of StateIterator.depthFirstINodes(subTreeState, iNodeHasPersistErrorHandler)) {
						for (const listener of iNode.eventListeners.persistError!) {
							const result = listener(iNode.getAccessor as any, options)

							if (result instanceof Promise) {
								handlerPromises.push(result)
							}
						}
					}
				}

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

	public notifyParents(childState: StateNode) {
		switch (childState.type) {
			case StateType.Entity: {
				for (const [parent] of childState.realms) {
					if (parent === undefined) {
						continue
					}
					switch (parent.type) {
						case StateType.EntityList:
						case StateType.Entity:
							parent.onChildUpdate(childState)
							break
						default:
							assertNever(parent)
					}
				}
				break
			}
			case StateType.Field:
			case StateType.EntityList: {
				childState.parent?.onChildUpdate(childState)
				break
			}
		}
	}

	public triggerOnPersistSuccess(options: PersistSuccessOptions) {
		this.syncTransaction(() => {
			const iNodeHasPersistSuccessHandler = (iNode: StateINode) => iNode.eventListeners.persistSuccess !== undefined

			for (const [, subTreeState] of this.treeStore.subTreeStates) {
				for (const iNode of StateIterator.depthFirstINodes(subTreeState, iNodeHasPersistSuccessHandler)) {
					for (const listener of iNode.eventListeners.persistSuccess!) {
						listener(iNode.getAccessor as any, options)
					}
				}
			}
		})
	}

	public markPendingConnections(parentState: EntityState, connectionPlaceholders: Set<FieldName>) {
		if (parentState.fieldsWithPendingConnectionUpdates === undefined) {
			parentState.fieldsWithPendingConnectionUpdates = new Set()
		}
		placeholders: for (const [fieldName, placeholderNames] of parentState.combinedMarkersContainer.placeholders) {
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

	public getEventListenersForListEntity(
		containingListState: EntityListState,
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
}
