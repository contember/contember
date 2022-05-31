import * as ReactDOM from 'react-dom'
import type {
	AsyncBatchUpdatesOptions,
	BatchUpdatesOptions,
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	PersistErrorOptions,
	PersistSuccessOptions,
} from '../accessors'
import type { SuccessfulPersistResult } from '../accessorTree'
import { BindingError } from '../BindingError'
import type { PlaceholderName } from '../treeParameters'
import { assertNever } from '../utils'
import type { Config } from './Config'
import type { DirtinessTracker } from './DirtinessTracker'
import {
	EntityListState,
	EntityRealmState,
	FieldState,
	getEntityMarker,
	RootStateNode,
	StateINode,
	StateIterator,
	StateNode,
} from './state'
import type { TreeStore } from './TreeStore'
import type { UpdateMetadata } from './UpdateMetadata'
import type { EventListenersStore } from '../treeParameters'

export class EventManager {
	public static readonly NO_CHANGES_DIFFERENCE = 0

	private transactionDepth = 0
	private isFrozenWhileUpdating = false

	// This should ideally not exists as it should be synonymous to `this.ongoingPersistOperation !== undefined`
	// but it makes persist-related promise juggling significantly more straightforward.
	private isMutating: boolean = false
	private ongoingPersistOperation: Promise<SuccessfulPersistResult> | undefined = undefined

	private previousMetadata: UpdateMetadata | undefined = undefined

	private newlyInitializedWithListeners: Set<EntityListState | EntityRealmState | FieldState> = new Set()
	private pendingWithBeforeUpdate: Set<StateNode> = new Set()
	private rootsWithPendingUpdates: Set<RootStateNode> = new Set()

	public constructor(
		private readonly asyncBatchUpdatesOptions: AsyncBatchUpdatesOptions,
		private readonly batchUpdatesOptions: BatchUpdatesOptions,
		private readonly config: Config,
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly onUpdate: (metadata: UpdateMetadata) => void,
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
			this.isMutating = true
			this.flushUpdates() // Let the world know that we're mutating

			try {
				resolve(await this.asyncOperation(operation))
			} catch (e) {
				console.error('PersistError', e)
				reject(e)
			} finally {
				this.ongoingPersistOperation = undefined
				this.isMutating = false
				this.flushUpdates()
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
		const result = this.syncTransaction(operation)
		this.flushUpdates()
		return result
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
					`by updating the accessor tree while rendering or from within the 'update' event handler, which is a no-op. ` +
					`If you wish to mutate the tree in reaction to other changes, use the 'beforeUpdate' event.`,
			)
		}

		const newMetadata = this.getNewUpdateMetadata()

		if (!this.shouldFlushUpdates(newMetadata)) {
			return
		}

		ReactDOM.unstable_batchedUpdates(() => {
			this.isFrozenWhileUpdating = true
			this.triggerBeforeFlushEvents()
			this.onUpdate(newMetadata)
			this.flushPendingAccessorUpdates(Array.from(this.rootsWithPendingUpdates))

			this.rootsWithPendingUpdates.clear()
			this.isFrozenWhileUpdating = false
			this.previousMetadata = newMetadata
		})
	}

	private getNewUpdateMetadata(): UpdateMetadata {
		return {
			isMutating: this.isMutating,
		}
	}

	private shouldFlushUpdates(newMetadata: UpdateMetadata): boolean {
		if (this.transactionDepth > 0) {
			return false
		}
		if (this.previousMetadata === undefined) {
			return true
		}
		if (this.rootsWithPendingUpdates.size) {
			return true
		}
		for (const key in newMetadata) {
			const fromPrevious = this.previousMetadata[key as keyof UpdateMetadata]
			const fromNew = newMetadata[key as keyof UpdateMetadata]

			if (!Object.is(fromPrevious, fromNew)) {
				return true
			}
		}
		return false
	}

	public registerNewlyInitialized(newlyInitialized: StateNode) {
		const initializeListeners = this.getEventListeners(newlyInitialized, { type: 'initialize' })

		if (initializeListeners === undefined) {
			return
		}

		this.newlyInitializedWithListeners.add(newlyInitialized)

		if (this.transactionDepth === 0) {
			this.triggerOnInitialize()
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
		const beforeUpdateListeners = this.getEventListeners(justUpdated, { type: 'beforeUpdate' })
		if (beforeUpdateListeners !== undefined) {
			this.pendingWithBeforeUpdate.add(justUpdated)
		}
		justUpdated.accessor = undefined

		switch (justUpdated.type) {
			case 'entityRealm':
			case 'entityList': {
				justUpdated.unpersistedChangesCount += changesDelta

				if (import.meta.env.DEV) {
					if (justUpdated.unpersistedChangesCount < 0) {
						console.error(
							`We have *JUST* reached a completely invalid state. From now on, anything can (and likely will) ` +
								`go wrong. This is definitely a bug. Please try to report whatever led to this situation.`,
						)
					}
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
			case 'field': {
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

	private flushPendingAccessorUpdates(rootStates: Array<StateINode>) {
		// It is *CRUCIAL* that this is a BFS so that we update the components in top-down order.
		const agenda: StateNode[] = rootStates

		for (const state of agenda) {
			// yes, the calls are same, but this way we can avoid type casting
			const updateListeners =
				state.type === 'field'
					? this.getEventDispatchers(state, { type: 'update' }, [state.getAccessor()])
					: state.type === 'entityRealm'
					? this.getEventDispatchers(state, { type: 'update' }, [state.getAccessor()])
					: this.getEventDispatchers(state, { type: 'update' }, [state.getAccessor()])

			if (updateListeners !== undefined) {
				for (const handler of updateListeners) {
					// TS can't quite handle the polymorphism here but this is fine.
					handler()
				}
			}
			if (state.type === 'entityRealm' && state.fieldsWithPendingConnectionUpdates) {
				for (const updatedField of state.fieldsWithPendingConnectionUpdates) {
					const listeners = this.getEventListeners(state, { type: 'connectionUpdate', key: updatedField })
					if (!listeners) {
						continue
					}
					for (const listener of listeners) {
						listener(state.getAccessor())
					}
				}
			}

			switch (state.type) {
				case 'entityRealm':
				case 'entityList': {
					if (state.childrenWithPendingUpdates !== undefined) {
						for (const childState of state.childrenWithPendingUpdates) {
							agenda.push(childState)
						}
						state.childrenWithPendingUpdates.clear()
					}
					break
				}
				case 'field':
					// Do nothing
					break
				default:
					assertNever(state)
			}
		}
	}

	private async triggerAsyncMutatingEvent(eventType: 'beforePersist', options: AsyncBatchUpdatesOptions): Promise<void>
	private async triggerAsyncMutatingEvent(eventType: 'persistSuccess', options: PersistSuccessOptions): Promise<void>
	private async triggerAsyncMutatingEvent(
		eventType: 'beforePersist' | 'persistSuccess',
		options: AsyncBatchUpdatesOptions | PersistSuccessOptions,
	): Promise<void> {
		await this.asyncTransaction(async () => {
			// TODO if an entity from here (or its parent) gets deleted, we need to remove stale handlers from here.
			const callbackQueue: Array<
				[
					// The typings could be nicer but TS…
					StateINode,
					(
						| EntityAccessor.EntityEventListenerMap[typeof eventType]
						| EntityListAccessor.EntityListEventListenerMap[typeof eventType]
					),
				]
			> = []

			for (const [, subTreeState] of StateIterator.eachRootState(this.treeStore)) {
				for (const iNode of StateIterator.depthFirstINodes(subTreeState)) {
					const listeners = this.getEventListeners(iNode, { type: eventType }) ?? []
					for (const listener of listeners) {
						callbackQueue.push([iNode, listener])
					}
				}
			}
			for (
				let waterfallDepth = 0;
				waterfallDepth < this.config.getValue(`${eventType}SettleLimit` as const);
				waterfallDepth++
			) {
				const promiseReturns: Array<
					Promise<
						| void
						| EntityAccessor.EntityEventListenerMap[typeof eventType]
						| EntityListAccessor.EntityListEventListenerMap[typeof eventType]
					>
				> = []
				const correspondingStates: Array<StateINode> = []

				if (callbackQueue.length === 0) {
					break
				}

				for (const [state, callback] of callbackQueue) {
					correspondingStates.push(state)
					const changesCountBefore = this.dirtinessTracker.getTotalTouchCount()
					let validateChanges = false
					try {
						const result = callback(state.getAccessor as any, options as any) // TS can't quite handle this but this is sound.
						if (result instanceof Promise) {
							validateChanges = true
							promiseReturns.push(result)
						} else {
							promiseReturns.push(Promise.resolve(result))
						}
					} catch (e) {
						promiseReturns.push(Promise.reject(e))
					}
					if (validateChanges) {
						this.validateWithoutChanges(changesCountBefore, eventType)
					}
				}
				// TODO timeout

				const changesCountBefore = this.dirtinessTracker.getTotalTouchCount()
				const newCallbacks = await Promise.allSettled(promiseReturns)
				this.validateWithoutChanges(changesCountBefore, eventType)

				callbackQueue.length = 0 // Empties the queue

				// TODO we're drifting away from the original depth-first order. Let's see if that's ever even an issue.
				for (const newlyInitialized of this.newlyInitializedWithListeners) {
					if (newlyInitialized.type === 'field') {
						continue
					}
					const beforePersistHandlers = this.getEventListeners(newlyInitialized, { type: eventType })
					if (beforePersistHandlers) {
						for (const listener of beforePersistHandlers) {
							callbackQueue.push([newlyInitialized, listener])
						}
					}
				}

				this.triggerBeforeFlushEvents()
				this.handleRejections(eventType, newCallbacks)

				for (let i = 0; i < newCallbacks.length; i++) {
					const result = newCallbacks[i]
					const correspondingState = correspondingStates[i]

					if (result.status === 'fulfilled') {
						if (typeof result.value === 'function') {
							callbackQueue.push([correspondingState, result.value])
						}
						// Otherwise do nothing. This is just a handler that albeit async, doesn't appear to
						// interact with data binding.
					}
				}
			}
			if (import.meta.env.DEV) {
				if (callbackQueue.length) {
					throw new BindingError(
						`Exceeded the ${eventType} settle limit. Your code likely contains a deadlock. ` +
							`If that's not the case, raise the settle limit from DataBindingProvider.`,
					)
				}
			}
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
					const listeners = this.getEventListeners(state, { type: 'beforeUpdate' })
					if (listeners === undefined) {
						// This can happen if the listener has unsubscribed since we added it to the set.
						continue
					}
					switch (state.type) {
						case 'field':
							for (const listener of listeners) {
								(listener as FieldAccessor.BeforeUpdateListener)(state.getAccessor())
							}
							break
						case 'entityRealm':
						case 'entityList':
							for (const listener of listeners) {
								state.getAccessor().batchUpdates(listener as any)
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
				// yes, the calls are same, but this way we can avoid type casting
				const listeners =
					state.type === 'field'
						? this.getEventDispatchers(state, { type: 'initialize' }, [state.getAccessor, this.batchUpdatesOptions])
						: state.type === 'entityRealm'
						? this.getEventDispatchers(state, { type: 'initialize' }, [state.getAccessor, this.batchUpdatesOptions])
						: this.getEventDispatchers(state, { type: 'initialize' }, [state.getAccessor, this.batchUpdatesOptions])

				if (listeners) {
					for (const listener of listeners) {
						listener()
					}
				}
				if (state.type === 'entityRealm') {
					state.entity.hasIdSetInStone = true
				}
			}
			this.newlyInitializedWithListeners.clear()
		})
	}

	public async triggerOnPersistError(options: PersistErrorOptions) {
		await this.asyncTransaction(async () => {
			const handlerPromises: Array<Promise<void>> = []

			for (const [, subTreeState] of StateIterator.eachRootState(this.treeStore)) {
				for (const iNode of StateIterator.depthFirstINodes(subTreeState)) {
					// yes, the calls are same, but this way we can avoid type casting
					const dispatchers =
						iNode.type === 'entityRealm'
							? this.getEventDispatchers(iNode, { type: 'persistError' }, [iNode.getAccessor, options])
							: this.getEventDispatchers(iNode, { type: 'persistError' }, [iNode.getAccessor, options])
					if (dispatchers === undefined) {
						continue
					}
					for (const listener of dispatchers ?? []) {
						try {
							const result = listener()
							if (result instanceof Promise) {
								handlerPromises.push(result)
							} else {
								handlerPromises.push(Promise.resolve(result))
							}
						} catch (e) {
							handlerPromises.push(Promise.reject(e))
						}
					}
				}
			}

			// TODO timeout
			const handlerResults = await Promise.allSettled(handlerPromises)
			this.handleRejections('persistError', handlerResults)
		})
	}

	public async triggerOnBeforePersist() {
		return this.triggerAsyncMutatingEvent('beforePersist', this.asyncBatchUpdatesOptions)
	}

	public async triggerOnPersistSuccess(options: PersistSuccessOptions) {
		return this.triggerAsyncMutatingEvent('persistSuccess', options)
	}

	public getEventListeners<
		State extends StateNode,
		EventListenerTypes extends
			Exclude<State['eventListeners'], undefined> extends EventListenersStore<infer Keys, infer Map> ? [Keys, Map] : never,
		EventType extends EventListenerTypes[0],
	>(state: State, event: { type: EventType; key?: string }): Set<Exclude<EventListenerTypes[1][EventType], undefined>> | undefined {
		if (!state.eventListeners) {
			return undefined
		}
		return (state.eventListeners as EventListenersStore<EventType, EventListenerTypes[1]>).get(event) as Set<
			Exclude<EventListenerTypes[1][EventType], undefined>
		>
	}

	public getEventDispatchers<
		State extends StateNode,
		EventListenerTypes extends
			Exclude<State['eventListeners'], undefined> extends EventListenersStore<infer Keys, infer Map> ? [Keys, Map] : never,
		EventType extends EventListenerTypes[0],
	>(
		state: State,
		event: { type: EventType; key?: string },
		listenerArgs: Parameters<Exclude<EventListenerTypes[1][EventType], undefined>>,
	): Array<() => ReturnType<Exclude<EventListenerTypes[1][EventType], undefined>>> | undefined {
		const eventListeners = this.getEventListeners(state, event)
		if (eventListeners === undefined) {
			return undefined
		}
		return Array.from(eventListeners.values(), listener => {
			return () => listener(...listenerArgs)
		}) as Array<() => ReturnType<Exclude<EventListenerTypes[1][EventType], undefined>>>
	}

	private handleRejections(handler: string, promises: PromiseSettledResult<any>[]) {
		const rejections = promises.filter((it): it is PromiseRejectedResult => it.status === 'rejected')
		if (rejections.length === 0) {
			return
		}
		rejections.forEach(it => console.error(it.reason))
		if (import.meta.env.DEV) {
			throw new BindingError(
				`A ${handler} handler returned a promise that rejected. ` +
					`This is a no-op that will fail silently in production.`,
			)
		}
	}


	private validateWithoutChanges(initialCount: number, eventType: string): void {
		const changesCountAfter = this.dirtinessTracker.getTotalTouchCount()
		if (import.meta.env.DEV) {
			if (initialCount !== changesCountAfter) {
				// This isn't bulletproof. They could e.g. undo a change and make another one which would
				// slip through this detection. But for most cases, it should be good enough and not too expensive.
				throw new BindingError(
					`A ${eventType} event handler cannot be asynchronous and alter the accessor tree at the same time. ` +
					`To achieve this, prepare your data asynchronously but only touch the tree from a returned callback.`,
				)
			}
		}
	}
}
