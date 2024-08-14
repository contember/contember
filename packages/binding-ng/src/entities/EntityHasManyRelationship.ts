import { Entity } from './Entity'
import { SchemaRelation } from '@contember/binding-common'
import { HasManyRelation } from '@contember/binding-common'
import { PlaceholderGenerator } from '@contember/binding-common'
import equal from 'fast-deep-equal/es6/index.js'
type EntityRelationshipValue = { value: Entity[]; relation: HasManyRelation }

export interface HasManyRelationshipParams {

}

export class EntityHasManyRelationship {
	#toAdd: Set<Entity> = new Set()
	#toRemove: Set<Entity> = new Set()

	#byPlaceholder: Map<string, EntityRelationshipValue> = new Map()

	constructor(
		private readonly entity: Entity,
		private readonly schema: SchemaRelation,
	) {
	}

	connectEntity({ relation, entity }: {
		relation?: HasManyRelation
		entity: Entity
	}): void {
		this.#toAdd.add(entity)
		this.#toRemove.delete(entity)
		if (relation) {
			this.getValueInternal(relation).value.push(entity)
		}

		// also add to all placeholders with matching or no "filter"
		// todo: ideally we would have a way to check if the filter matches
		for (const [, { value, relation: otherRelation }] of this.#byPlaceholder) {
			if (!otherRelation.filter || (relation && equal(otherRelation.filter, relation.filter))) {
				value.push(entity)
			}
		}
	}

	disconnectEntity({ relation, entity }: {
		relation?: HasManyRelation
		entity: Entity
	}): void {
		this.#toAdd.delete(entity)
		if (entity.existsOnServer) {
			this.#toRemove.add(entity)
		}
		for (const [, { value }] of this.#byPlaceholder) {
			const index = value.indexOf(entity)
			if (index !== -1) {
				value.splice(index, 1)
			}
		}
	}


	setPersistedValue({ relation, value }: {
		relation: HasManyRelation
		value: Entity[]
	}): void {
		const placeholder = PlaceholderGenerator.getHasManyRelationPlaceholder(relation)
		this.#byPlaceholder.set(placeholder, { value, relation })
	}

	getValue(relation: HasManyRelation): Entity[] {
		return this.getValueInternal(relation).value
	}

	private getValueInternal(relation: HasManyRelation): EntityRelationshipValue {
		const placeholder = PlaceholderGenerator.getHasManyRelationPlaceholder(relation)
		const entityRelationshipValue = this.#byPlaceholder.get(placeholder)
		if (!entityRelationshipValue) {
			throw new Error(`No value for placeholder ${placeholder}`)
		}
		return entityRelationshipValue
	}
}
