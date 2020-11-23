import {
	ClientGeneratedUuid,
	ServerGeneratedUuid,
	SingleEntityPersistedData,
	UnpersistedEntityKey,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import { PlaceholderGenerator } from '../markers'
import { QueryLanguage } from '../queryLanguage'
import {
	DesugaredRelativeEntityList,
	DesugaredRelativeSingleEntity,
	DesugaredRelativeSingleField,
	FieldName,
	FieldValue,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
} from '../treeParameters'
import { BindingOperations } from './BindingOperations'
import { EntityListAccessor } from './EntityListAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { FieldAccessor } from './FieldAccessor'
import { PersistErrorOptions } from './PersistErrorOptions'
import { PersistSuccessOptions } from './PersistSuccessOptions'

class EntityAccessor implements Errorable {
	public constructor(
		public readonly runtimeId: EntityAccessor.RuntimeId,
		public readonly typeName: string | undefined,
		private readonly fieldData: EntityAccessor.FieldData,
		private readonly dataFromServer: SingleEntityPersistedData | undefined,
		public readonly errors: ErrorAccessor | undefined,
		public readonly environment: Environment,
		public readonly addError: EntityAccessor.AddError,
		public readonly addEventListener: EntityAccessor.AddEntityEventListener,
		public readonly batchUpdates: EntityAccessor.BatchUpdates,
		public readonly connectEntityAtField: EntityAccessor.ConnectEntityAtField,
		public readonly disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField,
		public readonly deleteEntity: EntityAccessor.DeleteEntity,
	) {}

	public get primaryKey(): string | undefined {
		return this.runtimeId.existsOnServer ? this.runtimeId.value : undefined
	}

	public get existsOnServer(): boolean {
		return this.runtimeId.existsOnServer
	}

	public get key(): string {
		return this.runtimeId.value
	}

	public updateValues(fieldValuePairs: EntityAccessor.FieldValuePairs) {
		this.batchUpdates(getAccessor => {
			const entries = Array.isArray(fieldValuePairs) ? fieldValuePairs : Object.entries(fieldValuePairs)

			for (const [field, value] of entries) {
				getAccessor().getField(field).updateValue(value)
			}
		})
	}

	/**
	 * Please keep in mind that this method signature is literally impossible to implement safely. The generic parameters
	 * are really just a way to succinctly write a type cast. Nothing more, really.
	 */
	public getField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
		field: SugaredRelativeSingleField | string,
	): FieldAccessor<Persisted, Produced> {
		return this.getRelativeSingleField<Persisted, Produced>(
			QueryLanguage.desugarRelativeSingleField(field, this.environment),
		)
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
	public getRelativeSingleField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
		field: RelativeSingleField | DesugaredRelativeSingleField,
	): FieldAccessor<Persisted, Produced> {
		return (this.getRelativeSingleEntity(field).getAccessorByPlaceholder(
			PlaceholderGenerator.getFieldPlaceholder(field.field),
		) as unknown) as FieldAccessor<Persisted, Produced>
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
}

namespace EntityAccessor {
	export type RuntimeId = ServerGeneratedUuid | ClientGeneratedUuid | UnpersistedEntityKey

	export interface FieldDatum {
		getAccessor(): NestedAccessor
	}
	export type NestedAccessor = EntityAccessor | EntityListAccessor | FieldAccessor

	export type FieldValuePairs =
		| {
				[field: string]: FieldValue
		  }
		| Array<[SugaredRelativeSingleField | string, FieldValue]>

	export type FieldData = Map<FieldName, FieldDatum>

	export type GetEntityAccessor = () => EntityAccessor
	export type AddError = ErrorAccessor.AddError
	export type BatchUpdates = (performUpdates: EntityAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (getAccessor: GetEntityAccessor, bindingOperations: BindingOperations) => void
	export type ConnectEntityAtField = (field: FieldName, entityToConnectOrItsKey: EntityAccessor | string) => void
	export type DeleteEntity = () => void
	export type DisconnectEntityAtField = (
		field: FieldName,
		initializeReplacement?: EntityAccessor.BatchUpdatesHandler,
	) => void
	export type UpdateListener = (accessor: EntityAccessor) => void

	export type BeforePersistHandler = (
		getAccessor: GetEntityAccessor,
		bindingOperations: BindingOperations,
	) => void | Promise<BeforePersistHandler>

	export type PersistErrorHandler = (
		getAccessor: GetEntityAccessor,
		options: PersistErrorOptions,
	) => void | Promise<void>

	export type PersistSuccessHandler = (getAccessor: GetEntityAccessor, options: PersistSuccessOptions) => void

	export interface EntityEventListenerMap {
		beforePersist: BeforePersistHandler
		beforeUpdate: BatchUpdatesHandler
		connectionUpdate: UpdateListener
		initialize: BatchUpdatesHandler
		persistError: PersistErrorHandler
		persistSuccess: PersistSuccessHandler
		update: UpdateListener
	}
	export type EntityEventType = keyof EntityEventListenerMap
	export interface AddEntityEventListener {
		(type: 'beforePersist', listener: EntityEventListenerMap['beforePersist']): () => void
		(type: 'beforeUpdate', listener: EntityEventListenerMap['beforeUpdate']): () => void
		(type: 'connectionUpdate', hasOneField: FieldName, listener: EntityEventListenerMap['connectionUpdate']): () => void
		(type: 'update', listener: EntityEventListenerMap['update']): () => void

		// It's too late to add this by the time the accessor exists…
		//(type: 'initialize', listener: EntityEventListenerMap['initialize']): () => void
	}
}

export { EntityAccessor }
