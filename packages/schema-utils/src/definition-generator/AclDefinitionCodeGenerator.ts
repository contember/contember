import { PredicateDefinitionProcessor } from '../acl'
import { IndentDecider, Literal, printJsValue } from '../utils/printJsValue'
import { Acl, Model, Schema } from '@contember/schema'
import { DefinitionNamingConventions } from './DefinitionNamingConventions'

const indentFirstLevel: IndentDecider = (val, path) => path.length === 0

export class AclDefinitionCodeGenerator {
	constructor(
		private readonly definitionNamingConventions = new DefinitionNamingConventions(),
	) {
	}

	public generateRoles({ acl }: { acl: Acl.Schema }): string {
		return Object.entries(acl.roles).map(([name, values]) =>
			this.generateRole({
				name,
				values,
			})
		).join('')
	}

	private generateRole({ name, values }: { name: string; values: Acl.RolePermissions }): string {
		const { variables, entities, inherits, ...other } = values
		const roleVarName = this.definitionNamingConventions.roleVarName(name)
		return `\nexport const ${roleVarName} = c.createRole(${printJsValue(name)}, ${printJsValue(other)})\n`
	}

	public generateAclVariables({ acl }: { acl: Acl.Schema }): string {
		const variablesOutput: string[] = []

		Object.entries(acl.roles).map(([roleName, roleValues]) => {
			Object.entries(roleValues.variables).map(([variableName, variableValues]) => {
				let variableDefinition = `\nexport const ${this.definitionNamingConventions.variableVarName(roleName, variableName)} = c.`
				const varFormatted = printJsValue(variableName)
				const roleVarName = this.definitionNamingConventions.roleVarName(roleName)

				if (variableValues.type === Acl.VariableType.predefined) {
					const varDefinition = printJsValue(variableValues.value)
					variableDefinition += `createPredefinedVariable(${varFormatted}, ${varDefinition}, ${roleVarName})\n`
				} else if (variableValues.type === Acl.VariableType.entity) {
					const varDefinition = printJsValue(variableValues.entityName)
					variableDefinition += `createEntityVariable(${varFormatted}, ${varDefinition}, ${roleVarName})\n`
				} else {
					throw new Error(`Variable type ${variableValues.type} not yet supported`)
				}

				variablesOutput.push(variableDefinition)
			})
		})

		return variablesOutput.join('')
	}

	public generateEntityAcl({ entity, schema }: { entity: Model.Entity; schema: Schema }): string {
		const aclOutput: string[] = []
		const nonPrimaryFields = Object.keys(entity.fields).filter(it => it !== entity.primary)
		for (const [roleName, roleDefinition] of Object.entries(schema.acl.roles)) {
			const entityPermission = roleDefinition.entities[entity.name]
			if (!entityPermission) {
				continue
			}
			const roleVarName = this.definitionNamingConventions.roleVarName(roleName)
			for (const [predicateName, predicateDefinition] of Object.entries(entityPermission.predicates)) {
				const operations = this.getMatchingOperations({
					predicate: predicateName,
					operations: entityPermission.operations,
					entity,
					nonPrimaryFields,
				})
				if (Object.keys(operations).length > 0) {
					const processor = new PredicateDefinitionProcessor(schema.model)
					const when = processor.process(entity, predicateDefinition, {
						handleColumn: ctx => {
							if (typeof ctx.value === 'string' && ctx.value in roleDefinition.variables) {
								return new Literal(this.definitionNamingConventions.variableVarName(roleName, ctx.value))
							}
							return ctx.value
						},
						handleRelation: ctx => {
							return ctx.value
						},
					})
					const aclDefinition = printJsValue({ when, ...operations }, indentFirstLevel)
					aclOutput.push(`@c.Allow(${roleVarName}, ${aclDefinition})\n`)
				}
			}
			const trueOperations = this.getMatchingOperations({
				predicate: true,
				operations: entityPermission.operations,
				entity,
				nonPrimaryFields,
			})
			if (Object.keys(trueOperations).length > 0) {
				const aclDefinition = printJsValue({ ...trueOperations }, indentFirstLevel)
				aclOutput.push(`@c.Allow(${roleVarName}, ${aclDefinition})\n`)
			}
		}

		if (!aclOutput.length) {
			return ''
		}
		return `${aclOutput.join('')}`
	}

	private getMatchingOperations({ operations, predicate, entity, nonPrimaryFields }: {
		operations: Acl.EntityOperations
		predicate: Acl.Predicate
		entity: Model.Entity
		nonPrimaryFields: string[]
	}): { read?: string[] | true; create?: string[] | boolean; update?: string[] | boolean; delete?: true } {
		const result: ReturnType<AclDefinitionCodeGenerator['getMatchingOperations']> = {}
		for (const op of ['read', 'create', 'update'] as const) {
			const fields = Object.entries(operations[op] ?? {}).filter(([, it]) => it === predicate).map(([it]) => it)
			if (fields.length === 0) {
			} else if (this.coversEveryNonPrimaryField(fields, entity, nonPrimaryFields)) {
				result[op] = true
			} else {
				result[op] = fields
			}
		}
		if (operations.delete === predicate) {
			result.delete = true
		}

		return result
	}

	/**
	 * `read: true` re-parses as every field except the primary, so it may only stand in for a grant that
	 * covers exactly that set. Comparing counts instead treated a grant naming the primary plus all but
	 * one field as complete, and regenerating it silently granted the missing field.
	 */
	private coversEveryNonPrimaryField(fields: string[], entity: Model.Entity, nonPrimaryFields: string[]): boolean {
		if (fields.includes(entity.primary)) {
			return false
		}
		const granted = new Set(fields)
		return nonPrimaryFields.every(it => granted.has(it))
	}
}
