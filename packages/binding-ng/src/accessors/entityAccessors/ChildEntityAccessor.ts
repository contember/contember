import {
	EntityAccessor, EntityListAccessor, EntityListSubTreeMarker,
	EntityRealmKey,
	Environment,
	EventListenersStore,
	HasManyRelationMarker,
	HasOneRelationMarker,
	SchemaEntity,
} from '@contember/binding-common'
import { Entity } from '../../entities/Entity'
import { EntityAccessorStore } from '../EntityAccessorStore'
import { BaseEntityAccessor } from './BaseEntityAccessor'

export class ChildEntityAccessor extends BaseEntityAccessor {
	public readonly entity: Entity
	private readonly marker: HasOneRelationMarker | HasManyRelationMarker | EntityListSubTreeMarker
	private readonly parent: EntityAccessor | EntityListAccessor

	constructor(
		key: EntityRealmKey,
		schema: SchemaEntity,
		entity: Entity,
		environment: Environment,
		marker: HasOneRelationMarker | HasManyRelationMarker | EntityListSubTreeMarker,
		parent: EntityAccessor | EntityListAccessor,
		eventStore: EventListenersStore<EntityAccessor.EntityEventListenerMap> | undefined,
		entityAccessorStore: EntityAccessorStore,
	) {
		super(
			key,
			schema,
			environment,
			marker.fields,
			entityAccessorStore,
			eventStore,
		)
		this.entity = entity
		this.marker = marker
		this.parent = parent
	}


	getParent = (): EntityAccessor | EntityListAccessor => {
		return this.parent
	}

	getMarker = (): HasOneRelationMarker | HasManyRelationMarker | EntityListSubTreeMarker => {
		return this.marker
	}
}
