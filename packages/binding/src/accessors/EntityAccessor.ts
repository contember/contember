import { RuntimeId, SingleEntityPersistedData } from '../accessorTree'
import { BindingError } from '../BindingError'
import type { EntityOperations } from '../core/operations'
import type { Environment } from '../dao'
import { EntityFieldMarkers, HasManyRelationMarker, HasOneRelationMarker, PlaceholderGenerator } from '../markers'
import { QueryLanguage } from '../queryLanguage'
import type {
	EntityId,
	EntityName,
	EntityRealmKey,
	FieldName,
	FieldValue,
	HasManyRelation,
	HasOneRelation,
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
import type { EntityRealmState } from '../core/state'
import { getEntityMarker } from '../core/state'
import { TreeNodeUtils } from '../utils/TreeNodeUtils'
import { PlaceholderParametersGenerator } from '../markers/PlaceholderParametersGenerator'

class EntityAccessor implements Errorable {
	public constructor(
		private readonly state: EntityRealmState,
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
	) {
	}

	public get idOnServer(): EntityId | undefined {
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
		return this.operations.addError(this.state, ErrorAccessor.normalizeError(error))
	}

	public addEventListener<Type extends keyof EntityAccessor.RuntimeEntityEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	): () => void {
		return this.operations.addEventListener(this.state, event, listener)
	}

	public batchUpdates(performUpdates: EntityAccessor.BatchUpdatesHandler): void {
		this.operations.batchUpdates(this.state, performUpdates)
	}

	public connectEntityAtField(field: SugaredRelativeSingleEntity | string, entityToConnect: EntityAccessor): void {
		const desugared = QueryLanguage.desugarRelativeSingleEntity(field, this.environment)
		const relativeTo = this.getRelativeSingleEntity({
			hasOneRelationPath: desugared.hasOneRelationPath.slice(0, -1),
		})
		const fieldName = desugared.hasOneRelationPath[desugared.hasOneRelationPath.length - 1].field
		this.operations.connectEntityAtField(relativeTo.state, fieldName, entityToConnect)
	}

	public disconnectEntityAtField(field: SugaredRelativeSingleEntity | string, initializeReplacement?: EntityAccessor.BatchUpdatesHandler): void {
		const desugared = QueryLanguage.desugarRelativeSingleEntity(field, this.environment)
		const relativeTo = this.getRelativeSingleEntity({
			hasOneRelationPath: desugared.hasOneRelationPath.slice(0, -1),
		})
		const fieldName = desugared.hasOneRelationPath[desugared.hasOneRelationPath.length - 1].field
		this.operations.disconnectEntityAtField(relativeTo.state, fieldName, initializeReplacement)
	}

	public deleteEntity(): void {
		this.operations.deleteEntity(this.state)
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
	public getField<Value extends FieldValue = FieldValue>(field: SugaredRelativeSingleField | string): FieldAccessor<Value> {
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
		const entity = this.getRelativeSingleEntity(field)
		const fieldPlaceholder = PlaceholderGenerator.getFieldPlaceholder(field.field)
		const accessor = entity.fieldData.get(fieldPlaceholder)
		if (accessor) {
			return accessor.getAccessor() as FieldAccessor<Value>
		}

		TreeNodeUtils.resolveColumn(entity.environment, field.field)

		throw new BindingError(''
			+ 'EntityAccessor: cannot access field '
			+ `'${field.field}' on ${TreeNodeUtils.describeLocation(entity.environment)}.\n`
			+ 'The cause of the error is that this relation has not been registered during the static rendering process. As a result, it lacks a required marker and accessor.',
		)
	}

	public getRelativeSingleEntity(relativeSingleEntity: RelativeSingleEntity): EntityAccessor {
		let relativeTo: EntityAccessor = this

		for (const hasOneRelation of relativeSingleEntity.hasOneRelationPath) {
			const fieldPlaceholder = PlaceholderGenerator.getHasOneRelationPlaceholder(hasOneRelation)
			const accessor = relativeTo.fieldData.get(fieldPlaceholder)
			if (!accessor) {
				return this.raiseInvalidHasOneRelationError(relativeTo, hasOneRelation)
			}

			relativeTo = accessor.getAccessor() as EntityAccessor
		}
		return relativeTo
	}

	public getRelativeEntityList(entityList: RelativeEntityList): EntityListAccessor {
		const entity = this.getRelativeSingleEntity(entityList)
		const fieldPlaceholder = PlaceholderGenerator.getHasManyRelationPlaceholder(entityList.hasManyRelation)
		const accessor = entity.fieldData.get(fieldPlaceholder)
		if (!accessor) {
			return this.raiseInvalidHasManyRelationError(entity, entityList.hasManyRelation)
		}

		return accessor.getAccessor() as EntityListAccessor
	}

	private raiseInvalidHasOneRelationError(relativeTo: EntityAccessor, hasOneRelation: HasOneRelation): never {
		TreeNodeUtils.resolveHasOneRelation(relativeTo.environment, hasOneRelation.field, !!hasOneRelation.reducedBy)

		const entityMarker = relativeTo.getMarker()
		const possibleMarkers = this.getMarkersOfType(entityMarker.fields.markers, HasOneRelationMarker, hasOneRelation.field)
		const markerParams = possibleMarkers.map(it => PlaceholderParametersGenerator.createHasOneRelationParameters(it.parameters))

		const relationParams = PlaceholderParametersGenerator.createHasOneRelationParameters(hasOneRelation)

		this.raiseUndefinedRelationError(hasOneRelation.field, relativeTo.environment, relationParams, markerParams)
	}

	private raiseInvalidHasManyRelationError(entity: EntityAccessor, hasManyRelation: HasManyRelation): never {
		TreeNodeUtils.resolveHasManyRelation(entity.environment, hasManyRelation.field)

		const entityMarker = entity.getMarker()
		const possibleMarkers = this.getMarkersOfType(entityMarker.fields.markers, HasManyRelationMarker, hasManyRelation.field)
		const markerParams = possibleMarkers.map(it => PlaceholderParametersGenerator.createHasManyRelationParameters(it.parameters))

		const relationParams = PlaceholderParametersGenerator.createHasManyRelationParameters(hasManyRelation)

		this.raiseUndefinedRelationError(hasManyRelation.field, entity.environment, relationParams, markerParams)
	}

	private raiseUndefinedRelationError(field: string, environment: Environment, relationParams: any, otherMarkersParams: any[]): never {
		const hint = this.createHintMessage(otherMarkersParams)
		throw new BindingError(''
			+ `EntityAccessor: cannot access relation `
			+ `'${field}' on ${TreeNodeUtils.describeLocation(environment)}.\n`
			+ 'The cause of the error is that this relation has not been registered during the static rendering process. As a result, it lacks a required marker and accessor.\n\n'
			+ 'Provided parameters:\n'
			+ JSON.stringify(relationParams)
			+ hint,
		)
	}

	private createHintMessage(params: any[]): string {
		if (params.length === 0) {
			return ''
		}

		const serializedParams = params.map(it => JSON.stringify(it)).join('\n')
		const message = params.length === 1
			? 'However, there is existing marker for the same field, but it have different parameters:'
			: 'However, there are existing markers for the same field, but they have different parameters:'

		return `\n\n${message}\n${serializedParams}`
	}

	private getMarkersOfType<T extends { new(...args: any[]): HasManyRelationMarker | HasOneRelationMarker }>(
		markers: EntityFieldMarkers,
		markerConstructor: T,
		fieldName: string,
	): InstanceType<T>[] {
		return Array.from(markers.values())
			.filter((it): it is InstanceType<T> => (it instanceof markerConstructor) && it.parameters.field === fieldName)
	}

	public getParent(): EntityAccessor | EntityListAccessor | undefined {
		const blueprint = this.state.blueprint
		if (blueprint.type === 'subTree') {
			return undefined
		}
		return blueprint.parent.getAccessor()
	}

	public getMarker() {
		return getEntityMarker(this.state)
	}
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
}

export { EntityAccessor }
