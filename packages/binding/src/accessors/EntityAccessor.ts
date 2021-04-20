import { RuntimeId, ServerGeneratedUuid, SingleEntityPersistedData } from '../accessorTree'
import { BindingError } from '../BindingError'
import { EntityOperations } from '../core/operations'
import { Environment } from '../dao'
import { PlaceholderGenerator } from '../markers'
import { QueryLanguage } from '../queryLanguage'
import {
	DesugaredRelativeEntityList,
	DesugaredRelativeSingleEntity,
	DesugaredRelativeSingleField,
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
import { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import { BatchUpdatesOptions } from './BatchUpdatesOptions'
import { EntityListAccessor } from './EntityListAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { FieldAccessor } from './FieldAccessor'
import { PersistErrorOptions } from './PersistErrorOptions'
import { PersistSuccessOptions } from './PersistSuccessOptions'

class EntityAccessor implements Errorable {
	public constructor(
		private readonly stateKey: any,
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

	public addError(error: ErrorAccessor.SugaredValidationError): () => void {
		return this.operations.addError(this.stateKey, error)
	}

	public addEventListener(
		type: 'beforePersist',
		listener: EntityAccessor.EntityEventListenerMap['beforePersist'],
	): () => void
	public addEventListener(
		type: 'beforeUpdate',
		listener: EntityAccessor.EntityEventListenerMap['beforeUpdate'],
	): () => void
	public addEventListener(
		type: 'connectionUpdate',
		hasOneField: FieldName,
		listener: EntityAccessor.EntityEventListenerMap['connectionUpdate'],
	): () => void
	public addEventListener(
		type: 'persistError',
		listener: EntityAccessor.EntityEventListenerMap['persistError'],
	): () => void
	public addEventListener(
		type: 'persistSuccess',
		listener: EntityAccessor.EntityEventListenerMap['persistSuccess'],
	): () => void
	public addEventListener(type: 'update', listener: EntityAccessor.EntityEventListenerMap['update']): () => void
	public addEventListener(type: keyof EntityAccessor.RuntimeEntityEventListenerMap, ...args: unknown[]): () => void {
		return this.operations.addEventListener(this.stateKey, type, ...args)
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

	public updateValues(fieldValuePairs: EntityAccessor.FieldValuePairs) {
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

	public getKeyConnectedOnServer(entity: SugaredRelativeSingleEntity | string): string | null {
		const desugared = QueryLanguage.desugarRelativeSingleEntity(entity, this.environment)
		const lastHasOne = desugared.hasOneRelationPath[desugared.hasOneRelationPath.length - 1]
		const lastHasOnePlaceholder = PlaceholderGenerator.getHasOneRelationPlaceholder(lastHasOne)

		let containingAccessor: EntityAccessor = this

		if (desugared.hasOneRelationPath.length > 1) {
			containingAccessor = this.getRelativeSingleEntity({
				hasOneRelationPath: desugared.hasOneRelationPath.slice(0, -1),
			})
		}
		return containingAccessor.getPersistedKeyByPlaceholder(lastHasOnePlaceholder)
	}

	//

	/**
	 * @see EntityAccessor.getField
	 */
	public getRelativeSingleField<Value extends FieldValue = FieldValue>(
		field: RelativeSingleField | DesugaredRelativeSingleField,
	): FieldAccessor<Value> {
		return (this.getRelativeSingleEntity(field).getAccessorByPlaceholder(
			PlaceholderGenerator.getFieldPlaceholder(field.field),
		) as unknown) as FieldAccessor<Value>
	}

	public getRelativeSingleEntity(
		relativeSingleEntity: RelativeSingleEntity | DesugaredRelativeSingleEntity,
	): EntityAccessor {
		let relativeTo: EntityAccessor = this

		for (const hasOneRelation of relativeSingleEntity.hasOneRelationPath) {
			relativeTo = relativeTo.getAccessorByPlaceholder(
				PlaceholderGenerator.getHasOneRelationPlaceholder(hasOneRelation),
			) as EntityAccessor
		}
		return relativeTo
	}

	public getRelativeEntityList(entityList: RelativeEntityList | DesugaredRelativeEntityList): EntityListAccessor {
		return this.getRelativeSingleEntity(entityList).getAccessorByPlaceholder(
			PlaceholderGenerator.getHasManyRelationPlaceholder(entityList.hasManyRelation),
		) as EntityListAccessor
	}

	private getAccessorByPlaceholder(placeholderName: FieldName): EntityAccessor.NestedAccessor {
		const record = this.fieldData.get(placeholderName)
		if (record === undefined) {
			throw new BindingError(
				`EntityAccessor: unknown field placeholder '${placeholderName}'. Unless this is just a typo, this is ` +
					`typically caused by one of the following:\n` +
					`\t• Trying to access a field that has not been registered during static render, and thus lacks a marker and an accessor.\n` +
					`\t• Misusing an EntityAccessor getter. If you used one of the getRelative[…] family, please make sure all ` +
					`parameters match the marker tree exactly.` +
					`\n\nFor more information, please consult the documentation.\n\n`,
			)
		}
		return record.getAccessor()
	}

	private getPersistedKeyByPlaceholder(placeholderName: string): string | null {
		if (this.dataFromServer === undefined) {
			return null
		}
		const key = this.dataFromServer.get(placeholderName)

		if (key instanceof ServerGeneratedUuid) {
			return key.value
		}
		if (key === null) {
			// TODO this also returns null and fails to throw when placeholderName points to a regular scalar field that
			// 	happens to be also null.
			return null
		}

		// From now on, we're past the happy path, way into error land.
		if (key === undefined) {
			throw new BindingError(
				`EntityAccessor.getKeyConnectedOnServer: unknown placeholder '${placeholderName}'. Unless this is just ` +
					`a typo, this typically happens when a has-one relation hasn't been registered during static render.`,
			)
		}
		if (key instanceof Set) {
			throw new BindingError(
				`EntityAccessor.getKeyConnectedOnServer: the placeholder '${placeholderName}' refers to a has-many relation, ` +
					`not a has-one. This method is meant exclusively for has-one relations.`,
			)
		}
		throw new BindingError(
			`EntityAccessor.getKeyConnectedOnServer: the placeholder '${placeholderName}' refers to a scalar field, not a` +
				`has-one relation. This method is meant exclusively for has-one relations.`,
		)
	}

	/**
	 * @deprecated
	 * @see EntityAccessor.name
	 */
	public get typeName() {
		return this.name
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
