import {
	BindingError,
	EntityAccessor,
	EntityFieldMarkersContainer,
	EntityId,
	EntityListAccessor,
	EntityListSubTreeMarker,
	EntityName,
	EntityRealmKey,
	EntitySubTreeMarker,
	Environment,
	ErrorAccessor, EventListenersStore,
	FieldAccessor,
	FieldMarker,
	FieldValue, HasManyRelationMarker, HasOneRelationMarker,
	PlaceholderGenerator,
	QueryLanguage,
	RelativeSingleEntity,
	RelativeSingleField,
	SchemaEntity,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	TreeNodeUtils,
} from '@contember/binding-common'
import { Entity } from '../../entities/Entity'
import { FieldAccessorImpl } from '../FieldAccessorImpl'
import { EntityAccessorStore } from '../EntityAccessorStore'
import { ChildEntityAccessor } from './ChildEntityAccessor'

export abstract class BaseEntityAccessor implements EntityAccessor {
	readonly __type = 'EntityAccessor' as const

	#fields: Map<string, FieldAccessorImpl<any>> = new Map()


	constructor(
		public readonly key: EntityRealmKey,
		public readonly schema: SchemaEntity,
		public readonly environment: Environment,
		private readonly markerFields: EntityFieldMarkersContainer,
		private readonly entityAccessorStore: EntityAccessorStore,
		private eventStore: EventListenersStore<EntityAccessor.EntityEventListenerMap> | undefined,
	) {
	}

	abstract get entity(): Entity

	get name(): EntityName {
		return this.schema.name
	}

	get hasUnpersistedChanges(): boolean {
		return this.entity.hasUnpersistedChanges
	}

	getAccessor: EntityAccessor.GetEntityAccessor = () => {
		return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
	}

	get idOnServer(): EntityId | undefined {
		return this.entity.existsOnServer ? this.entity.id.value : undefined
	}

	get id(): EntityId {
		return this.entity.id.value
	}

	get existsOnServer(): boolean {
		return this.entity.existsOnServer
	}

	get errors(): ErrorAccessor | undefined {
		return this.entity.errors
	}

	addError: ErrorAccessor.AddError = err => {
		return this.entity.addError(ErrorAccessor.normalizeError(err))
	}


	addEventListener: EntityAccessor.AddEventListener = () => {
		// todo implement
		// throw new Error('Not implemented')
		return () => null
	}

	batchUpdates = (performUpdates: EntityAccessor.BatchUpdatesHandler): void => {
		// todo implement
		throw new Error('Not implemented')
	}

	connectEntityAtField = (field: SugaredRelativeSingleEntity | string, entityToConnect: EntityAccessor): void => {
		// todo implement
		throw new Error('Not implemented')
	}

	disconnectEntityAtField = (field: SugaredRelativeSingleEntity | string, initializeReplacement?: EntityAccessor.BatchUpdatesHandler): void => {
		// todo implement
		throw new Error('Not implemented')
	}

	deleteEntity = (): void => {
		// todo implement
		throw new Error('Not implemented')
	}

	updateValues = (fieldValuePairs: EntityAccessor.FieldValuePairs): void => {
		// todo implement
		throw new Error('Not implemented')
	}

	/**
	 * Please keep in mind that this method signature is literally impossible to implement safely. The generic parameter
	 * is really just a way to succinctly write a type cast. Nothing more, really.
	 */
	getField = <Value extends FieldValue = FieldValue>(field: SugaredRelativeSingleField | string | RelativeSingleField): FieldAccessor<Value> => {
		if (typeof field === 'string' || !('hasOneRelationPath' in field)) {
			return this.getField<Value>(QueryLanguage.desugarRelativeSingleField(field, this.environment))
		}
		if (field.hasOneRelationPath.length > 0) {
			return this.getEntity(field).getField({ ...field, hasOneRelationPath: [] })
		}

		const fieldPlaceholder = PlaceholderGenerator.getFieldPlaceholder(field.field)
		const existingAccessor = this.#fields.get(fieldPlaceholder)
		if (existingAccessor) {
			return (existingAccessor as FieldAccessorImpl<Value>).getAccessor()
		}

		const marker = this.markerFields.markers.get(fieldPlaceholder)

		const schema = TreeNodeUtils.resolveColumn(this.environment, field.field)
		if (!marker || !(marker instanceof FieldMarker)) {
			throw new BindingError(''
				+ 'EntityAccessor: cannot access field '
				+ `'${field.field}' on ${TreeNodeUtils.describeLocation(this.environment)}.\n`
				+ 'The cause of the error is that this relation has not been registered during the static rendering process. As a result, it lacks a required marker and accessor.',
			)

		}
		return new FieldAccessorImpl<Value>(
			schema,
			this.entity.getField(field.field),
			marker,
			this,
		)

	}

	getEntity = (entity: SugaredRelativeSingleEntity | string | RelativeSingleEntity): EntityAccessor => {
		if (typeof entity === 'string' || !('hasOneRelationPath' in entity)) {
			return this.getEntity(QueryLanguage.desugarRelativeSingleEntity(entity, this.environment))
		}
		if (entity.hasOneRelationPath.length === 0) {
			return this
		}

		const [hasOneRelation, ...rest] = entity.hasOneRelationPath
		const fieldPlaceholder = PlaceholderGenerator.getHasOneRelationPlaceholder(hasOneRelation)

		const marker = this.markerFields.markers.get(fieldPlaceholder)

		if (!marker || !(marker instanceof HasOneRelationMarker)) {
			// todo
			throw new BindingError()
			// return this.raiseInvalidHasOneRelationError(relativeTo, hasOneRelation)
		}

		const relationEntity = this.entity.getHasOneValue({ relation: marker.parameters })

		const key = `${this.key}--one--${marker.parameters.field}--${fieldPlaceholder}--${relationEntity.globalKey}`

		const relativeTo = this.entityAccessorStore.getOrCreateEntityByKey(key, () => new ChildEntityAccessor(
			key,
			relationEntity.schema,
			relationEntity,
			marker.environment,
			marker,
			this,
			marker.parameters.eventListeners?.clone(),
			this.entityAccessorStore,
		))
		return rest.length === 0 ? relativeTo : relativeTo.getEntity({ hasOneRelationPath: rest })
	}

	getEntityList = (entityList: SugaredRelativeEntityList | string): EntityListAccessor => {
		// todo implement
		throw new Error('Not implemented')
	}

	abstract getMarker(): HasManyRelationMarker | HasOneRelationMarker | EntitySubTreeMarker | EntityListSubTreeMarker
	abstract getParent(): EntityAccessor | EntityListAccessor | undefined

	protected notifyEntityReferenceChanged(): void {
		this.#fields.forEach(it => it._cleanup())
		this.#fields.clear()
	}
}
