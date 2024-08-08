import { EntityRealmState, getEntityMarker } from '../core/state'
import type { EntityOperations } from '../core/operations'
import { SingleEntityPersistedData } from '../accessorTree'
import {
	EntityFieldMarkers,
	EntityListAccessor,
	FieldAccessor,
	FieldValue,
	HasManyRelation,
	HasManyRelationMarker,
	HasOneRelation,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	SugaredRelativeEntityList,
	SugaredRelativeSingleField,
} from '@contember/binding-common'
import {
	BindingError,
	EntityAccessor,
	EntityId,
	EntityName,
	EntityRealmKey,
	Environment,
	ErrorAccessor,
	HasOneRelationMarker,
	PlaceholderGenerator,
	PlaceholderParametersGenerator,
	QueryLanguage,
	RuntimeId,
	SugaredRelativeSingleEntity,
	TreeNodeUtils,
} from '@contember/binding-common'

export class EntityAccessorImpl implements EntityAccessor {
	public readonly __type = 'EntityAccessor' as const

	public constructor(
		private readonly state: EntityRealmState,
		private readonly operations: EntityOperations,
		private readonly runtimeId: RuntimeId,
		readonly key: EntityRealmKey, // ⚠️ This is *NOT* the id! ⚠️
		readonly name: EntityName,
		private readonly fieldData: EntityAccessor.FieldData,
		private readonly dataFromServer: SingleEntityPersistedData | undefined,
		readonly hasUnpersistedChanges: boolean,
		readonly errors: ErrorAccessor | undefined,
		readonly environment: Environment,
		readonly getAccessor: EntityAccessor.GetEntityAccessor,
	) {
	}

	get idOnServer(): EntityId | undefined {
		return this.runtimeId.existsOnServer ? this.runtimeId.value : undefined
	}

	/**
	 * Note that for entities that don't yet exist on server this will return a dummy id.
	 */
	get id(): EntityId {
		return this.runtimeId.value
	}

	get existsOnServer(): boolean {
		return this.runtimeId.existsOnServer
	}

	//

	addError(error: ErrorAccessor.Error | string): () => void {
		return this.operations.addError(this.state, ErrorAccessor.normalizeError(error))
	}

	addEventListener<Type extends keyof EntityAccessor.RuntimeEntityEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	): () => void {
		return this.operations.addEventListener(this.state, event, listener)
	}

	batchUpdates(performUpdates: EntityAccessor.BatchUpdatesHandler): void {
		this.operations.batchUpdates(this.state, performUpdates)
	}

	connectEntityAtField(field: SugaredRelativeSingleEntity | string, entityToConnect: EntityAccessor): void {
		const desugared = QueryLanguage.desugarRelativeSingleEntity(field, this.environment)
		const relativeTo = this.getRelativeSingleEntity({
			hasOneRelationPath: desugared.hasOneRelationPath.slice(0, -1),
		})
		const fieldName = desugared.hasOneRelationPath[desugared.hasOneRelationPath.length - 1].field
		this.operations.connectEntityAtField(relativeTo.state, fieldName, entityToConnect)
	}

	disconnectEntityAtField(field: SugaredRelativeSingleEntity | string, initializeReplacement?: EntityAccessor.BatchUpdatesHandler): void {
		const desugared = QueryLanguage.desugarRelativeSingleEntity(field, this.environment)
		const relativeTo = this.getRelativeSingleEntity({
			hasOneRelationPath: desugared.hasOneRelationPath.slice(0, -1),
		})
		const fieldName = desugared.hasOneRelationPath[desugared.hasOneRelationPath.length - 1].field
		this.operations.disconnectEntityAtField(relativeTo.state, fieldName, initializeReplacement)
	}

	deleteEntity(): void {
		this.operations.deleteEntity(this.state)
	}

	//

	updateValues(fieldValuePairs: EntityAccessor.FieldValuePairs): void {
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
	getField<Value extends FieldValue = FieldValue>(field: SugaredRelativeSingleField | string): FieldAccessor<Value> {
		return this.getRelativeSingleField<Value>(QueryLanguage.desugarRelativeSingleField(field, this.environment))
	}

	getEntity(entity: SugaredRelativeSingleEntity | string): EntityAccessor {
		return this.getRelativeSingleEntity(QueryLanguage.desugarRelativeSingleEntity(entity, this.environment))
	}

	getEntityList(entityList: SugaredRelativeEntityList | string): EntityListAccessor {
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

	public getRelativeSingleEntity(relativeSingleEntity: RelativeSingleEntity): EntityAccessorImpl {
		let relativeTo: EntityAccessorImpl = this

		for (const hasOneRelation of relativeSingleEntity.hasOneRelationPath) {
			const fieldPlaceholder = PlaceholderGenerator.getHasOneRelationPlaceholder(hasOneRelation)
			const accessor = relativeTo.fieldData.get(fieldPlaceholder)
			if (!accessor) {
				return this.raiseInvalidHasOneRelationError(relativeTo, hasOneRelation)
			}

			relativeTo = accessor.getAccessor() as EntityAccessorImpl
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

	getParent(): EntityAccessor | EntityListAccessor | undefined {
		const blueprint = this.state.blueprint
		if (blueprint.type === 'subTree') {
			return undefined
		}
		return blueprint.parent.getAccessor()
	}

	getMarker() {
		return getEntityMarker(this.state)
	}
}
