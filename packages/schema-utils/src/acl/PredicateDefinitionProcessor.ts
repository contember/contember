import { acceptFieldVisitor } from '../model'
import { Acl, Input, Model, Writable } from '@contember/schema'

class PredicateDefinitionProcessor {
	constructor(private readonly schema: Model.Schema) {}

	public process<WhereValue, PredicateExtension = never>(
		entity: Model.Entity,
		definition: Acl.PredicateDefinition<PredicateExtension>,
		handler: PredicateDefinitionProcessor.Handler<WhereValue, PredicateExtension>,
	): Input.Where<WhereValue> {
		return this.processInternal(entity, definition, handler, [])
	}

	private processInternal<WhereValue, PredicateExtension = never>(
		entity: Model.Entity,
		definition: Acl.PredicateDefinition<PredicateExtension>,
		handler: PredicateDefinitionProcessor.Handler<WhereValue, PredicateExtension>,
		path: string[],
	): Input.Where<WhereValue> {
		const result: Writable<Input.Where<WhereValue>> = {}
		for (const [key, value] of Object.entries(definition)) {
			if (value === undefined) {
				// do nothing
			} else if (key === 'not') {
				result.not = this.processInternal(entity, value as Acl.PredicateDefinition<PredicateExtension>, handler, [
					...path,
					key,
				])
			} else if (key === 'and' || key === 'or') {
				result[key] = (value as Acl.PredicateDefinition[]).map(it =>
					this.processInternal(entity, it, handler, [...path, key]),
				)
			} else if (!entity.fields[key] && handler.handleUndefinedField) {
				const undefinedResult = handler.handleUndefinedField({ entity, name: key, value, path })
				if (undefinedResult !== undefined) {
					result[key] = undefinedResult as (typeof result)[keyof typeof result]
				}
			} else {
				const fieldWhere = acceptFieldVisitor<
					WhereValue | Input.Where | Input.Condition | [string, WhereValue | Input.Where | Input.Condition] | undefined
				>(this.schema, entity, key, {
					visitColumn: ({ entity, column }) => {
						return handler.handleColumn({
							entity,
							column,
							value: value as Input.Condition | PredicateExtension,
							path,
						})
					},
					visitRelation: ({ entity, relation, targetEntity }) => {
						const processedValue = handler.handleRelation({
							relation,
							entity,
							targetEntity,
							value: value as Acl.PredicateVariable | PredicateExtension,
							path,
						})
						if (
							typeof processedValue === 'object' &&
							processedValue !== null &&
							'constructor' in processedValue &&
							processedValue.constructor.name === 'Object'
						) {
							return this.processInternal(
								targetEntity,
								processedValue as Acl.PredicateDefinition<PredicateExtension>,
								handler,
								[...path, key],
							)
						}
						return processedValue
					},
				})
				if (fieldWhere === undefined) {
					// do nothing
				} else if (Array.isArray(fieldWhere) && fieldWhere.length === 2) {
					result[fieldWhere[0]] = fieldWhere[1] as (typeof result)[keyof typeof result]
				} else {
					result[key] = fieldWhere as (typeof result)[keyof typeof result]
				}
			}
		}
		return result
	}
}

namespace PredicateDefinitionProcessor {
	export interface Handler<R, T> {
		handleColumn(ctx: {
			value: T | Acl.PredicateVariable | Input.Condition
			entity: Model.Entity
			column: Model.AnyColumn
			path: string[]
		}): R | Input.Where | Input.Condition | undefined | [string, R | Input.Where | Input.Condition]

		handleRelation(ctx: {
			value: T | Acl.PredicateVariable
			entity: Model.Entity
			relation: Model.Relation
			targetEntity: Model.Entity
			path: string[]
		}): R | Input.Where | undefined | [string, R | Input.Where]

		handleUndefinedField?(ctx: {
			entity: Model.Entity
			name: string
			value: any
			path: string[]
		}): never | undefined | R | Input.Where
	}
}

export { PredicateDefinitionProcessor }
