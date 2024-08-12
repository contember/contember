import { Environment } from '../environment'
import { EntityListSubTreeMarker, EntitySubTreeMarker, HasManyRelationMarker, HasOneRelationMarker } from '../markers'
import type {
	EntityId,
	EntityName,
	EntityRealmKey,
	FieldName,
	FieldValue,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
} from '../treeParameters'
import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import { EntityListAccessor } from './EntityListAccessor'
import type { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import type { FieldAccessor } from './FieldAccessor'
import type { PersistErrorOptions } from './PersistErrorOptions'
import type { PersistSuccessOptions } from './PersistSuccessOptions'

export const isEntityAccessor = (accessor: unknown): accessor is EntityAccessor =>
	accessor !== null && typeof accessor === 'object' && '__type' in accessor && accessor.__type === 'EntityAccessor'

interface EntityAccessor extends Errorable {
	readonly __type: 'EntityAccessor'
	/**
	 * The key is a unique identifier of the entity. It is not the id of the entity.
	 */
	readonly key: EntityRealmKey
	readonly name: EntityName
	readonly hasUnpersistedChanges: boolean
	readonly errors: ErrorAccessor | undefined
	readonly environment: Environment
	readonly getAccessor: EntityAccessor.GetEntityAccessor
	readonly idOnServer: EntityId | undefined
	readonly id: EntityId
	readonly existsOnServer: boolean

	addError: ErrorAccessor.AddError

	addEventListener: EntityAccessor.AddEventListener

	batchUpdates(performUpdates: EntityAccessor.BatchUpdatesHandler): void

	connectEntityAtField(field: SugaredRelativeSingleEntity | string, entityToConnect: EntityAccessor): void

	disconnectEntityAtField(field: SugaredRelativeSingleEntity | string, initializeReplacement?: EntityAccessor.BatchUpdatesHandler): void

	deleteEntity(): void

	updateValues(fieldValuePairs: EntityAccessor.FieldValuePairs): void

	/**
	 * Please keep in mind that this method signature is literally impossible to implement safely. The generic parameter
	 * is really just a way to succinctly write a type cast. Nothing more, really.
	 */
	getField<Value extends FieldValue = FieldValue>(field: SugaredRelativeSingleField | string): FieldAccessor<Value>

	getEntity(entity: SugaredRelativeSingleEntity | string): EntityAccessor

	getEntityList(entityList: SugaredRelativeEntityList | string): EntityListAccessor

	/**
	 * @todo internal only?
	 */
	getRelativeSingleEntity(relativeSingleEntity: RelativeSingleEntity): EntityAccessor

	/**
	 * @todo internal only?
	 */
	getRelativeSingleField<Value extends FieldValue = FieldValue>(field: RelativeSingleField): FieldAccessor<Value>

	/**
	 * @todo internal only?
	 */
	getRelativeEntityList(entityList: RelativeEntityList): EntityListAccessor

	getParent(): EntityAccessor | EntityListAccessor | undefined

	getMarker(): HasManyRelationMarker | HasOneRelationMarker | EntitySubTreeMarker | EntityListSubTreeMarker
}

namespace EntityAccessor {
	export interface FieldDatum {
		getAccessor(): NestedAccessor
	}
	export type NestedAccessor = EntityAccessor | EntityListAccessor | FieldAccessor<any>

	export type FieldValuePairs =
		| {
			[field: string]: FieldValue
		  }
		| Iterable<[SugaredRelativeSingleField | string, FieldValue]>

	export type FieldData = Map<FieldName, FieldDatum>

	export type GetEntityAccessor = () => EntityAccessor
	export type BatchUpdatesHandler = (getAccessor: GetEntityAccessor, options: BatchUpdatesOptions) => void
	export type UpdateListener = (accessor: EntityAccessor) => void

	export type BeforePersistHandler = (
		getAccessor: GetEntityAccessor,
		options: AsyncBatchUpdatesOptions,
	) => void | BeforePersistHandler | Promise<void | BeforePersistHandler>

	export type PersistErrorHandler = (
		getAccessor: GetEntityAccessor,
		options: PersistErrorOptions,
	) => void | Promise<void>

	export type PersistSuccessHandler = (
		getAccessor: GetEntityAccessor,
		options: PersistSuccessOptions,
	) => void | PersistSuccessHandler | Promise<void | PersistSuccessHandler>

	export interface RuntimeEntityEventListenerMap {
		beforePersist: BeforePersistHandler
		beforeUpdate: BatchUpdatesHandler
		connectionUpdate: UpdateListener
		persistError: PersistErrorHandler
		persistSuccess: PersistSuccessHandler
		update: UpdateListener
	}
	export interface EntityEventListenerMap extends RuntimeEntityEventListenerMap {
		initialize: BatchUpdatesHandler
	}
	export type EntityEventType = keyof EntityEventListenerMap

	export type AddEventListener = <Type extends keyof EntityAccessor.RuntimeEntityEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	) => () => void
}

export type { EntityAccessor }
