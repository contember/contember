import { Entity } from './Entity'
import { SchemaRelation } from '@contember/binding-common'
import { HasOneRelation } from '@contember/binding-common'
import { PlaceholderGenerator } from '@contember/binding-common'

type EntityRelationshipValue = { matches: boolean ; relation: HasOneRelation}

export class EntityHasOneRelationship {
	#persistedValue: Entity | null | undefined
	#value: Entity | null = null

	#visibilityByPlaceholder: Map<string, EntityRelationshipValue> = new Map()

	constructor(
		private readonly entity: Entity,
		public readonly schema: SchemaRelation,
	) {
	}

	setPersistedValue({ relation, entity, matches }: {
		relation: HasOneRelation
		entity: Entity | null
		matches: boolean
	}): void {
		this.#persistedValue = entity
		this.setValueInternal({ relation, entity, matches })
	}

	setValue({ relation, entity }: {
		relation: HasOneRelation
		entity: Entity | null
	}): void {
		this.setValueInternal({ relation, entity, matches: true })
	}


	getValue(relation: HasOneRelation): Entity | null {
		if (!this.#value) {
			return null
		}
		const placeholder = PlaceholderGenerator.getHasOneRelationPlaceholder(relation)
		const visibility = this.#visibilityByPlaceholder.get(placeholder)
		if (!visibility) {
			return null
		}
		return visibility.matches ? this.#value : null
	}

	private setValueInternal({ relation, entity, matches }: {
		relation: HasOneRelation
		entity: Entity | null
		matches: boolean
	}): void {
		this.#value = entity
		const placeholder = PlaceholderGenerator.getHasOneRelationPlaceholder(relation)
		this.#visibilityByPlaceholder.set(placeholder, { matches, relation })
	}

}
