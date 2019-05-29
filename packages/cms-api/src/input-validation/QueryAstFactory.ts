import ObjectNode from '../content-api/graphQlResolver/ObjectNode'
import FieldNode from '../content-api/graphQlResolver/FieldNode'
import { acceptFieldVisitor, getEntity } from '../content-schema/modelUtils'
import { Model } from 'cms-common'

class QueryAstFactory {
	constructor(private readonly model: Model.Schema) {

	}
	create(entityName: string, dependencies: string[][]): ObjectNode {
		const entity = getEntity(this.model, entityName)
		let node = new ObjectNode(entityName, entityName, [], {}, {}, [])
		for (const dependency of dependencies) {
			node = this.appendField(entity, node, [...dependency])
		}
		return node
	}

	private appendField(entity: Model.Entity,
		node: ObjectNode,
		dependency: string[]
	): ObjectNode {
		const fieldName = dependency.shift() as string
		let currentField = node.findField(fieldName)

		const [targetEntity, newField] = acceptFieldVisitor<[Model.Entity | null, FieldNode | ObjectNode]>(
			this.model,
			entity,
			fieldName,
			{
				visitColumn: () => [null, new FieldNode(fieldName, fieldName, {})],
				visitRelation: ({}, {}, targetEntity) => [targetEntity, new ObjectNode(fieldName, fieldName, [], {}, {}, [])],
			}
		)
		if (!currentField) {
			currentField = newField
		}

		if (dependency.length > 0) {
			if (!(currentField instanceof ObjectNode) || !targetEntity) {
				throw new Error(`Invalid path expression, trying to fetch field on non-relation`)
			}
			currentField = this.appendField(targetEntity, currentField, [...dependency])
		}

		return node.withField(currentField)
	}
}

export default QueryAstFactory
