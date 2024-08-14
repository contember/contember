import { BindingError, EntityRealmKey, EntitySubTreeMarker, Environment, SchemaEntity } from '@contember/binding-common'
import { Entity } from '../../entities/Entity'
import { BaseEntityAccessor } from './BaseEntityAccessor'
import { EntityAccessorStore } from '../EntityAccessorStore'

export class SubTreeEntityAccessor extends BaseEntityAccessor {
	// intentionally struct, so it is copied by reference
	private readonly subTreeState: {
		marker: EntitySubTreeMarker
		entity: Entity
	}

	constructor(
		key: EntityRealmKey,
		schema: SchemaEntity,
		entity: Entity,
		environment: Environment,
		marker: EntitySubTreeMarker,
		entityAccessorStore: EntityAccessorStore,
	) {
		super(
			key,
			schema,
			environment,
			marker.fields,
			entityAccessorStore,
			marker.parameters.eventListeners?.clone(),
		)
		this.subTreeState = {
			marker,
			entity,
		}
	}

	get entity(): Entity {
		return this.subTreeState.entity
	}

	update(marker: EntitySubTreeMarker, entity: Entity): void {
		if (marker.placeholderName !== this.subTreeState.marker.placeholderName) {
			throw new BindingError('Cannot change placeholder name')
		}
		this.subTreeState.marker = marker
		if (this.entity === entity) {
			return
		}
		this.subTreeState.entity = entity

		this.notifyEntityReferenceChanged()
	}

	getMarker() {
		return this.subTreeState.marker
	}

	getParent() {
		return undefined
	}
}
