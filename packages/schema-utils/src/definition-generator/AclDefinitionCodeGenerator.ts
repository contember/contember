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
		return Object.entries(acl.roles).map(([name, values]) => this.generateRole({
			name,
			values,
		})).join('')
	}

	private generateRole({ name, values }: { name: string; values: Acl.RolePermissions }): string {
		const { variables, entities, inherits, ...other } = values
		const roleVarName = this.definitionNamingConventions.roleVarName(name)
		return `\nexport const ${roleVarName} = acl.createRole(${printJsValue(name)}, ${printJsValue(other)})\n`
	}

	public generateAclVariables({ acl }: { acl: Acl.Schema }): string {
		const variablesOutput: string[] = []

		Object.entries(acl.roles).map(([roleName, roleValues]) => {
			Object.entries(roleValues.variables).map(([variableName, variableValues]) => {
				let variableDefinition = `\nexport const ${this.definitionNamingConventions.variableVarName(roleName, variableName)} = acl.`
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

	public generateEntityAcl({ entity, schema }: { entity: Model.Entity; schema: Schema  }): string {
		const aclOutput: string[] = []
		const numberOfEntityFieldsWithoutId = Object.keys(entity.fields).length - 1
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
					numberOfEntityFieldsWithoutId,
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
					aclOutput.push(`@acl.allow(${roleVarName}, ${aclDefinition})\n`)
				}
			}
			const trueOperations = this.getMatchingOperations({
				predicate: true,
				operations: entityPermission.operations,
				numberOfEntityFieldsWithoutId,
			})
			if (Object.keys(trueOperations).length > 0) {
				const aclDefinition = printJsValue({ ...trueOperations }, indentFirstLevel)
				aclOutput.push(`@acl.allow(${roleVarName}, ${aclDefinition})\n`)
			}
		}

		if (!aclOutput.length) {
			return ''
		}
		return `\n${aclOutput.join('')}`
	}

	private getMatchingOperations({ operations, predicate, numberOfEntityFieldsWithoutId }: {
		operations: Acl.EntityOperations
		predicate: Acl.Predicate
		numberOfEntityFieldsWithoutId: number
	}): { read?: string[] | true; create?: string[] | boolean; update?: string[] | boolean; delete?: true } {
		const result: ReturnType<AclDefinitionCodeGenerator['getMatchingOperations']> = {}
		for (const op of ['read', 'create', 'update'] as const) {
			const fields = Object.entries(operations[op] ?? {}).filter(([, it]) => it === predicate).map(([it]) => it)
			if (fields.length === 0) {
				continue
			} else if (fields.length === numberOfEntityFieldsWithoutId) {
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
}
