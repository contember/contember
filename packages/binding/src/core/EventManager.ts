import * as ReactDOM from 'react-dom'
import {
	BindingOperations,
	EntityAccessor,
	EntityListAccessor,
	PersistErrorOptions,
	TreeRootAccessor,
} from '../accessors'
import { PersistSuccessOptions } from '../accessors/PersistSuccessOptions'
import { RequestError, SuccessfulPersistResult } from '../accessorTree'
import { BindingError } from '../BindingError'
import { assertNever } from '../utils'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import {
	InternalEntityListState,
	InternalEntityState,
	InternalRootStateNode,
	InternalStateIterator,
	InternalStateNode,
	InternalStateType,
} from './internalState'

export class EventManager {
	private transactionDepth = 0
	private isFrozenWhileUpdating = false

	private ongoingPersistOperation: Promise<SuccessfulPersistResult> | undefined = undefined

	private newlyInitializedWithListeners: Set<InternalEntityListState | InternalEntityState> = new Set()

	public constructor(
		private readonly subTreeStates: Map<string, InternalRootStateNode>,
		private readonly config: Config,
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly bindingOperations: BindingOperations,
		private readonly onUpdate: (newData: TreeRootAccessor) => void,
		private readonly onError: (error: RequestError) => void,
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
		this.transactionDepth++
		transaction()
		this.transactionDepth--
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

	public registerNewlyInitialized(state: InternalEntityState | InternalEntityListState) {
		if (Object.values(state.eventListeners).filter(listeners => !!listeners).length) {
			this.newlyInitializedWithListeners.add(state)
		}
	}

	public updateTreeRoot() {
		this.onUpdate(
			new TreeRootAccessor(
				this.dirtinessTracker.hasChanges(),
				this.ongoingPersistOperation !== undefined,
				this.bindingOperations,
			),
		)
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

	public async triggerOnBeforePersist() {
		return new Promise<void>(async resolve => {
			await this.asyncTransaction(async () => {
				const iNodeHasBeforePersist = (iNode: InternalEntityState | InternalEntityListState) =>
					iNode.eventListeners.beforePersist !== undefined

				// TODO if an entity from here (or its parent) gets deleted, we need to remove stale handlers from here.
				const callbackQueue: Array<[
					// The typings could be nicer but TS…
					InternalEntityState | InternalEntityListState,
					EntityAccessor.BeforePersistHandler | EntityListAccessor.BeforePersistHandler,
				]> = []

				for (const [, subTreeState] of this.subTreeStates) {
					for (const iNode of InternalStateIterator.depthFirstINodes(subTreeState, iNodeHasBeforePersist)) {
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
					const correspondingStates: Array<InternalEntityState | InternalEntityListState> = []

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
					for (const state of this.newlyInitializedWithListeners) {
						if (state.eventListeners.beforePersist) {
							for (const listener of state.eventListeners.beforePersist) {
								callbackQueue.push([state, listener])
							}
						}
					}

					this.triggerOnInitialize()

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

	public triggerOnInitialize() {
		let hasOnInitialize = false

		this.syncTransaction(() => {
			for (const state of this.newlyInitializedWithListeners) {
				if (state.eventListeners.initialize) {
					for (const listener of state.eventListeners.initialize) {
						listener(state.getAccessor as any, this.bindingOperations)
						hasOnInitialize = true
					}
				}
				if (state.type === InternalStateType.SingleEntity) {
					state.hasIdSetInStone = true
				}
			}
		})
		this.newlyInitializedWithListeners.clear()
	}

	public async triggerOnPersistError(options: PersistErrorOptions) {
		return new Promise<void>(async resolve => {
			await this.asyncTransaction(async () => {
				const iNodeHasPersistErrorHandler = (iNode: InternalEntityState | InternalEntityListState) =>
					iNode.eventListeners.persistError !== undefined

				const handlerPromises: Array<Promise<void>> = []

				for (const [, subTreeState] of this.subTreeStates) {
					for (const iNode of InternalStateIterator.depthFirstINodes(subTreeState, iNodeHasPersistErrorHandler)) {
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

	public triggerOnPersistSuccess(options: PersistSuccessOptions) {
		this.syncTransaction(() => {
			const iNodeHasPersistSuccessHandler = (iNode: InternalEntityState | InternalEntityListState) =>
				iNode.eventListeners.persistSuccess !== undefined

			for (const [, subTreeState] of this.subTreeStates) {
				for (const iNode of InternalStateIterator.depthFirstINodes(subTreeState, iNodeHasPersistSuccessHandler)) {
					for (const listener of iNode.eventListeners.persistSuccess!) {
						listener(iNode.getAccessor as any, options)
					}
				}
			}
		})
	}
}
