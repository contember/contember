import { Model } from '@contember/schema'
import { EventFilter } from './DiffBuilder'
import { acceptFieldVisitor, getEntity, ModelError, ModelErrorCode } from '@contember/schema-utils'
import { EntitiesRelationsInput } from '../dependencies/content'

export class InvalidFilterError {
	constructor(public readonly message: string) {}
}

export class EventFilterValidator {
	public static validateFilter(model: Model.Schema, filter: EventFilter): void {
		const entity = EventFilterValidator.getEntity(model, filter.entity)
		EventFilterValidator.validateRelations(model, entity, filter.relations, [entity.name])
	}

	private static getEntity(model: Model.Schema, entityName: string): Model.Entity {
		try {
			return getEntity(model, entityName)
		} catch (e) {
			if (e instanceof ModelError && e.code === ModelErrorCode.ENTITY_NOT_FOUND) {
				throw new InvalidFilterError(`${entityName}: entity not found`)
			}
			throw e
		}
	}

	private static validateRelations(
		model: Model.Schema,
		entity: Model.Entity,
		relations: EntitiesRelationsInput,
		path: string[],
	): void {
		for (const relation of relations) {
			const newPath = [...path, relation.name]
			try {
				const targetEntity = acceptFieldVisitor(model, entity, relation.name, {
					visitColumn: () => {
						throw new InvalidFilterError(`${newPath.join('.')}: not a relation`)
					},
					visitRelation: ({}, {}, targetEntity) => {
						return targetEntity
					},
				})
				EventFilterValidator.validateRelations(model, targetEntity, relation.relations, newPath)
			} catch (e) {
				if (e instanceof ModelError && e.code === ModelErrorCode.FIELD_NOT_FOUND) {
					throw new InvalidFilterError(`${newPath.join('.')}: field not found`)
				}
			}
		}
	}
}
