import { RuntimeId, SingleEntityPersistedData } from '../accessorTree'
import { BindingError } from '../BindingError'
import type { EntityOperations } from '../core/operations'
import type { Environment } from '../dao'
import { PlaceholderGenerator } from '../markers'
import { QueryLanguage } from '../queryLanguage'
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
import type { EntityListAccessor } from './EntityListAccessor'
import type { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import type { FieldAccessor } from './FieldAccessor'
import type { PersistErrorOptions } from './PersistErrorOptions'
import type { PersistSuccessOptions } from './PersistSuccessOptions'
import type { EntityRealmState } from '../core/state'

class EntityAccessor implements Errorable {
	public constructor(
		private readonly stateKey: EntityRealmState,
		private readonly operations: EntityOperations,
		private readonly runtimeId: RuntimeId,
		public readonly key: EntityRealmKey, // ⚠️ This is *NOT* the id! ⚠️
		public readonly name: EntityName,
		private readonly fieldData: EntityAccessor.FieldData,
		private readonly dataFromServer: SingleEntityPersistedData | undefined,
		public readonly hasUnpersistedChanges: boolean,
		public readonly errors: ErrorAccessor | undefined,
		public readonly environment: Environment,
		public readonly getAccessor: EntityAccessor.GetEntityAccessor,
	) {}

	public get idOnServer(): string | undefined {
		return this.runtimeId.existsOnServer ? this.runtimeId.value : undefined
	}

	/**
	 * Note that for entities that don't yet exist on server this will return a dummy id.
	 */
	public get id(): EntityId {
		return this.runtimeId.value
	}

	public get existsOnServer(): boolean {
		return this.runtimeId.existsOnServer
	}

	//

	public addError(error: ErrorAccessor.Error | string): () => void {
		return this.operations.addError(this.stateKey, ErrorAccessor.normalizeError(error))
	}

	public addEventListener<Type extends keyof EntityAccessor.RuntimeEntityEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	): () => void {
		return this.operations.addEventListener(this.stateKey, event, listener)
	}

	public batchUpdates(performUpdates: EntityAccessor.BatchUpdatesHandler): void {
		this.operations.batchUpdates(this.stateKey, performUpdates)
	}

	public connectEntityAtField(field: FieldName, entityToConnect: EntityAccessor): void {
		this.operations.connectEntityAtField(this.stateKey, field, entityToConnect)
	}

	public disconnectEntityAtField(field: FieldName, initializeReplacement?: EntityAccessor.BatchUpdatesHandler): void {
		this.operations.disconnectEntityAtField(this.stateKey, field, initializeReplacement)
	}

	public deleteEntity(): void {
		this.operations.deleteEntity(this.stateKey)
	}

	//

	public updateValues(fieldValuePairs: EntityAccessor.FieldValuePairs): void {
		this.batchUpdates(getAccessor => {
			const entries = Array.isArray(fieldValuePairs) ? fieldValuePairs : Object.entries(fieldValuePairs)

			for (const [field, value] of entries) {
				getAccessor().getField(field).updateValue(value)
			}
		})
	}

	/**
	 * Please keep in mind that this method signature is literally impossible to implement safely. The generic parameter
	 * is really just a way to succinctly write a type cast. Nothing more, really.
	 */
	public getField<Value extends FieldValue = FieldValue>(
		field: SugaredRelativeSingleField | string,
	): FieldAccessor<Value> {
		return this.getRelativeSingleField<Value>(QueryLanguage.desugarRelativeSingleField(field, this.environment))
	}

	public getEntity(entity: SugaredRelativeSingleEntity | string): EntityAccessor {
		return this.getRelativeSingleEntity(QueryLanguage.desugarRelativeSingleEntity(entity, this.environment))
	}

	public getEntityList(entityList: SugaredRelativeEntityList | string): EntityListAccessor {
		return this.getRelativeEntityList(QueryLanguage.desugarRelativeEntityList(entityList, this.environment))
	}

	//

	/**
	 * @see EntityAccessor.getField
	 */
	public getRelativeSingleField<Value extends FieldValue = FieldValue>(field: RelativeSingleField): FieldAccessor<Value> {
		return this.getRelativeSingleEntity(field).getAccessorByPlaceholder(
			PlaceholderGenerator.getFieldPlaceholder(field.field),
		) as unknown as FieldAccessor<Value>
	}

	public getRelativeSingleEntity(relativeSingleEntity: RelativeSingleEntity): EntityAccessor {
		let relativeTo: EntityAccessor = this

		for (const hasOneRelation of relativeSingleEntity.hasOneRelationPath) {
			relativeTo = relativeTo.getAccessorByPlaceholder(
				PlaceholderGenerator.getHasOneRelationPlaceholder(hasOneRelation),
			) as EntityAccessor
		}
		return relativeTo
	}

	public getRelativeEntityList(entityList: RelativeEntityList): EntityListAccessor {
		return this.getRelativeSingleEntity(entityList).getAccessorByPlaceholder(
			PlaceholderGenerator.getHasManyRelationPlaceholder(entityList.hasManyRelation),
		) as EntityListAccessor
	}

	private getAccessorByPlaceholder(placeholderName: FieldName): EntityAccessor.NestedAccessor {
		const record = this.fieldData.get(placeholderName)
		if (record === undefined) {
			throw new BindingError(
				`EntityAccessor: unknown field placeholder '${placeholderName} on ${this.name}'. Unless this is just a typo, this is ` +
					`typically caused by one of the following:\n` +
					`\t• Trying to access a field that has not been registered during static render, and thus lacks a marker and an accessor.\n` +
					`\t• Misusing an EntityAccessor getter. If you used one of the getRelative[…] family, please make sure all ` +
					`parameters match the marker tree exactly.` +
					`\n\nFor more information, please consult the documentation.\n\n`,
			)
		}
		return record.getAccessor()
	}
}

namespace EntityAccessor {
	export interface FieldDatum {
		getAccessor(): NestedAccessor
	}
	export type NestedAccessor = EntityAccessor | EntityListAccessor | FieldAccessor

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
	) => void | Promise<void | BeforePersistHandler>

	export type PersistErrorHandler = (
		getAccessor: GetEntityAccessor,
		options: PersistErrorOptions,
	) => void | Promise<void>

	export type PersistSuccessHandler = (
		getAccessor: GetEntityAccessor,
		options: PersistSuccessOptions,
	) => void | Promise<void | PersistSuccessHandler>

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
}

export { EntityAccessor }
