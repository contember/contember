import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { Dependencies } from './dependencies/index.js'
import { FieldNode, ObjectNode } from '../inputProcessing/index.js'

export class QueryAstFactory {
	constructor(private readonly model: Model.Schema) {}

	create(entityName: string, dependencies: Dependencies): ObjectNode {
		const entity = getEntity(this.model, entityName)
		let node = new ObjectNode(entityName, entityName, [], {}, {}, [])
		for (const [fieldName, deps] of Object.entries(dependencies)) {
			node = node.withField(this.createField(entity, fieldName, deps))
		}
		return node
	}

	private createField(entity: Model.Entity, fieldName: string, dependency: Dependencies): ObjectNode | FieldNode {
		let [targetEntity, newField] = acceptFieldVisitor<[Model.Entity | null, FieldNode | ObjectNode]>(
			this.model,
			entity,
			fieldName,
			{
				visitColumn: () => [null, new FieldNode(fieldName, fieldName, {})],
				visitRelation: ({}, {}, targetEntity) => [
					targetEntity,
					new ObjectNode(fieldName, fieldName, [], {}, {}, []).withField(
						new FieldNode(targetEntity.primary, targetEntity.primary, {}),
					),
				],
			},
		)
		const dependencyEntries = Object.entries(dependency)
		if (dependencyEntries.length > 0) {
			if (!(newField instanceof ObjectNode) || !targetEntity) {
				throw new Error(`Invalid path expression, trying to fetch field on non-relation`)
			}
			for (const [fieldName, deps] of dependencyEntries) {
				newField = (newField as ObjectNode).withField(this.createField(targetEntity, fieldName, deps))
			}
		}
		return newField
	}
}
