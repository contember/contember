import { EntityId, RuntimeId, Schema, SchemaEntity, throwBindingError, UnpersistedEntityDummyId } from '@contember/binding-common'
import { Entity } from './Entity'

export class EntityStore {
	private readonly entities: Map<string, Map<EntityId, Entity>> = new Map()

	constructor(
		private readonly schema: Schema,
	) {
	}

	public getOrCreatePersistedEntity(entityName: string, id: RuntimeId): Entity {
		const entityMap = this.getEntityMap(entityName)
		const entity = entityMap.get(id.value)
		if (entity) {
			return entity
		}

		const entitySchema = this.getEntitySchema(entityName)
		const newEntity = new Entity(id, entitySchema, this)
		entityMap.set(id.value, newEntity)
		return newEntity
	}

	public getEntity(entityName: string, id: EntityId): Entity {
		return this.getEntityMap(entityName).get(id)
			?? throwBindingError(`Entity ${entityName} with id ${id} not found`)
	}

	public createNewEntity(entityName: string): Entity {
		const entityMap = this.getEntityMap(entityName)
		const entitySchema = this.getEntitySchema(entityName)

		const id = new UnpersistedEntityDummyId()
		const entity = new Entity(id, entitySchema, this)
		entityMap.set(id.value, entity)

		return entity
	}

	private getEntityMap(entityName: string): Map<EntityId, Entity> {
		const entityMap = this.entities.get(entityName)
		if (entityMap) {
			return entityMap
		}
		const newEntityMap = new Map()
		this.entities.set(entityName, newEntityMap)
		return newEntityMap
	}

	private getEntitySchema(entityName: string): SchemaEntity {
		return this.schema.getEntity(entityName)
	}
}
