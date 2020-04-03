import { acceptFieldVisitor } from '../model'
import { Acl, Input, Model } from '@contember/schema'

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
		return Object.entries(definition).reduce((result, [key, value]) => {
			if (value === undefined) {
				return result
			}
			if (key === 'not') {
				return {
					...result,
					not: this.processInternal(entity, value as Acl.PredicateDefinition<PredicateExtension>, handler, [
						...path,
						key,
					]),
				}
			} else if (key === 'and' || key === 'or') {
				return {
					...result,
					[key]: (value as Acl.PredicateDefinition[]).map(it =>
						this.processInternal(entity, it, handler, [...path, key]),
					),
				}
			}

			if (!entity.fields[key] && handler.handleUndefinedField) {
				const undefinedResult = handler.handleUndefinedField({ entity, name: key, value, path })
				if (undefinedResult !== undefined) {
					return { ...result, [key]: undefinedResult }
				}
			}

			const fieldWhere = acceptFieldVisitor<WhereValue | Input.Where | [string, WhereValue | Input.Where] | undefined>(
				this.schema,
				entity,
				key,
				{
					visitColumn: (entity, column) => {
						return handler.handleColumn({ entity, column, value: value as Input.Condition | PredicateExtension, path })
					},
					visitRelation: (entity, relation, targetEntity) => {
						const processedValue = handler.handleRelation({
							relation,
							entity,
							targetEntity,
							value: value as Acl.PredicateVariable | PredicateExtension,
							path,
						})
						if (
							typeof processedValue === 'object' &&
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
				},
			)
			if (fieldWhere === undefined) {
				return result
			}
			if (Array.isArray(fieldWhere) && fieldWhere.length === 2) {
				return { ...result, [fieldWhere[0]]: fieldWhere[1] }
			}
			return { ...result, [key]: fieldWhere }
		}, {})
	}
}

namespace PredicateDefinitionProcessor {
	export interface Handler<R, T> {
		handleColumn(ctx: {
			value: T | Acl.PredicateVariable | Input.Condition
			entity: Model.Entity
			column: Model.AnyColumn
			path: string[]
		}): R | Input.Where | undefined | [string, R | Input.Where]

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
