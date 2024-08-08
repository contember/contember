import { Environment } from '../environment'
import { BaseRelation, Schema, SchemaColumn, SchemaEntity, SchemaField, SchemaRelation } from '../schema'
import { BindingError } from '../BindingError'
import levenshtein from 'js-levenshtein'

export class TreeNodeUtils {

	public static resolveEntity(schema: Schema, entityName: string, type: 'entity' | 'entity list'): SchemaEntity {
		const entity = schema.getEntityOrUndefined(entityName)
		if (!entity) {
			const alternative = this.recommendAlternative(entityName, schema.getEntityNames())
			const didYouMean = alternative ? `Did you mean '${alternative}'?` : ''
			throw new BindingError(`Invalid ${type} sub tree: Entity '${entityName}' doesn't exist. ${didYouMean}`)
		}
		return entity
	}

	public static resolveHasOneRelation(environment: Environment, field: string, isReduced: boolean): SchemaRelation {
		if (isReduced) {
			return this.resolveRelation(environment, field, 'reduced has-one relation', ['ManyHasMany', 'OneHasMany'])
		}
		return this.resolveRelation(environment, field, 'a has-one relation', ['ManyHasOne', 'OneHasOne'])
	}


	public static resolveHasManyRelation(environment: Environment, field: string): SchemaRelation {
		return this.resolveRelation(environment, field, 'a has-many relation', ['ManyHasMany', 'OneHasMany'])
	}

	private static resolveRelation(environment: Environment, field: string, relationDescription: string, expectedRelationType: BaseRelation['type'][]): SchemaRelation {
		return this.resolveField(environment, field, (field): field is SchemaRelation => {
			return field.__typename === '_Relation' && expectedRelationType.includes(field.type)
		}, relationDescription)
	}

	public static resolveColumn(environment: Environment, fieldName: string): SchemaColumn {
		return this.resolveField(environment, fieldName, (field): field is SchemaColumn => field.__typename === '_Column', 'an ordinary field')
		// TODO check that defaultValue matches the type
		// TODO run custom validators
	}

	private static resolveField<T extends SchemaField>(environment: Environment, fieldName: string, matcher: (field: SchemaField) => field is T, expectedDescription: string): T {
		const treeLocation = environment.getSubTreeNode()
		const entity = treeLocation.entity
		const field = entity.fields.get(fieldName)
		if (!field) {
			const alternative = this.recommendAlternative(
				fieldName,
				Array.from(entity.fields)
					.filter(([, field]) => matcher(field))
					.map(([fieldName]) => fieldName),
			)
			const didYouMean = alternative ? `Did you mean '${alternative}'?` : ''
			throw new BindingError(`Field '${fieldName}' doesn't exist on ${this.describeLocation(environment)}. ${didYouMean}`)
		}
		if (!matcher(field)) {
			const actual = field.__typename === '_Column' ? 'an ordinary field' : `a ${field.type} relation`
			throw new BindingError(
				`Invalid field: the name '${field.name}' on ${this.describeLocation(environment)} ` +
				`refers to ${actual} but is being used as a ${expectedDescription}.`,
			)
		}
		return field
	}

	public static describeLocation(environment: Environment): string {
		const path = []
		const loc = environment.getSubTreeNode()
		for (let env = environment; ; env = env.getParent()) {
			const node = env.getSubTreeNode()
			if (node.type === 'subtree-entity' || node.type === 'subtree-entity-list') {
				return `entity '${loc.entity.name}' in path '${[node.entity.name, ...path.reverse()].join('.')}'`
			}
			path.push(node.field.name)
		}
	}

	public static recommendAlternative(original: string, possibleAlternatives: Iterable<string>): string | undefined {
		let bestAlternative: string | undefined = undefined
		let bestAlternativeDistance = Number.MAX_SAFE_INTEGER

		for (const alternative of possibleAlternatives) {
			const distance = levenshtein(original, alternative)

			if (distance < bestAlternativeDistance) {
				bestAlternative = alternative
				bestAlternativeDistance = distance
			}
		}
		return bestAlternative
	}
}
