import type { Environment } from '../environment'
import type { EntityId, EntityName, EntityRealmKey } from '../treeParameters'
import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import type { EntityAccessor } from './EntityAccessor'
import type { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import type { PersistErrorOptions } from './PersistErrorOptions'
import type { PersistSuccessOptions } from './PersistSuccessOptions'
import { RuntimeId } from '../RuntimeId'
import { EntityListSubTreeMarker, HasManyRelationMarker } from '../markers'

export const isEntityListAccessor = (accessor: unknown): accessor is EntityListAccessor =>
	accessor !== null && typeof accessor === 'object' && '__type' in accessor && accessor.__type === 'EntityListAccessor'

interface EntityListAccessor extends Errorable {
	readonly __type: 'EntityListAccessor'
	readonly name: EntityName
	readonly hasUnpersistedChanges: boolean
	readonly errors: ErrorAccessor | undefined
	readonly environment: Environment
	readonly getAccessor: EntityListAccessor.GetEntityListAccessor

	/**
	 * Returns all entity keys that are on the list.
	 * **KEYS ARE NOT IDS!**
	 * @see EntityAccessor.key
	 */
	keys(): IterableIterator<EntityRealmKey>

	ids(): IterableIterator<EntityId>

	/**
	 * This will only contain the ids that the server knows about. Not necessarily the ids that have been added on
	 * the list since the last server query.
	 */
	idsPersistedOnServer: Set<EntityId>

	[Symbol.iterator](): IterableIterator<EntityAccessor>

	hasEntityId(id: EntityId): boolean

	isEmpty(): boolean

	length: number

	hasEntityOnServer(entityOrItsId: EntityAccessor | EntityId): boolean

	deleteAll(): void

	disconnectAll(): void

	addError(error: ErrorAccessor.Error | string): () => void

	addEventListener: EntityListAccessor.AddEventListener

	addChildEventListener: EntityListAccessor.AddChildEventListener

	batchUpdates(performUpdates: EntityListAccessor.BatchUpdatesHandler): void

	connectEntity(entityToConnect: EntityAccessor): void

	createNewEntity(initialize?: EntityAccessor.BatchUpdatesHandler): RuntimeId
	disconnectEntity(childEntity: EntityAccessor, options?: { noPersist?: boolean }): void
	getChildEntityById(id: EntityId): EntityAccessor

	getParent(): EntityAccessor | undefined

	getMarker(): EntityListSubTreeMarker | HasManyRelationMarker
}

namespace EntityListAccessor {
	export type GetEntityListAccessor = () => EntityListAccessor
	export type BatchUpdatesHandler = (getAccessor: GetEntityListAccessor, options: BatchUpdatesOptions) => void

	export type UpdateListener = (accessor: EntityListAccessor) => void

	export type BeforePersistHandler = (
		getAccessor: GetEntityListAccessor,
		options: AsyncBatchUpdatesOptions,
	) => void | Promise<void | BeforePersistHandler>

	export type PersistErrorHandler = (
		getAccessor: GetEntityListAccessor,
		options: PersistErrorOptions,
	) => void | Promise<void>

	export type PersistSuccessHandler = (
		getAccessor: GetEntityListAccessor,
		options: PersistSuccessOptions,
	) => void | Promise<void | PersistSuccessHandler>

	export type ChildEventListenerMap = {
		childBeforeUpdate: EntityAccessor.BatchUpdatesHandler
		childInitialize: EntityAccessor.BatchUpdatesHandler
		childUpdate: EntityAccessor.UpdateListener
	}

	export interface RuntimeEntityListEventListenerMap {
		beforePersist: BeforePersistHandler
		beforeUpdate: BatchUpdatesHandler
		persistError: PersistErrorHandler
		persistSuccess: PersistSuccessHandler
		update: UpdateListener
	}
	export interface EntityListEventListenerMap extends RuntimeEntityListEventListenerMap {
		initialize: BatchUpdatesHandler
	}
	export type EntityListEventType = keyof EntityListEventListenerMap

	export type AddEventListener = <Type extends keyof EntityListAccessor.RuntimeEntityListEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityListAccessor.RuntimeEntityListEventListenerMap[Type],
	) => () => void

	export type AddChildEventListener = <Type extends keyof EntityAccessor.EntityEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	) => () => void
}

export { type EntityListAccessor }
