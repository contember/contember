import { Acl, Input, Model } from 'cms-common'
import { acceptFieldVisitor } from "../content-schema/modelUtils";

class VariableInjector {
	constructor(
		private readonly schema: Model.Schema,
		private readonly variables: Acl.VariablesMap,
	) {
	}

	public inject(entity: Model.Entity, where: Acl.PredicateDefinition): Input.Where {
		return Object.entries(where).reduce((result, [key, value]) => {
			if (value === undefined) {
				return result
			}
			if (key === 'not') {
				return {...result, not: this.inject(entity, value as Acl.PredicateDefinition)}
			} else if (key === 'and' || key === 'or') {
				return {...result, [key]: (value as Acl.PredicateDefinition[]).map(it => this.inject(entity, it))}
			}
			const fieldWhere = acceptFieldVisitor<Input.Condition | Input.Where>(this.schema, entity, key, {
				visitColumn: (): Input.Condition => {
					if (typeof value === 'string') {
						return this.createCondition(this.variables[value] || undefined)
					}
					return value as Input.Condition
				},
				visitRelation: (entity, relation, targetEntity): Input.Where => {
					if (typeof value === 'string') {
						return {[targetEntity.primary]: this.createCondition(this.variables[value] || undefined)}
					}

					return this.inject(targetEntity, value as Acl.PredicateDefinition)
				},
			})
			return {...result, [key]: fieldWhere}
		}, {})
	}

	private createCondition(variable: any): Input.Condition {
		if (variable === undefined) {
			return {never: true}
		}
		if (Array.isArray(variable)) {
			return {in: variable}
		}
		if (typeof variable === 'string' || typeof variable === 'number') {
			return {eq: variable}
		}
		throw new Error('not implemented')
	}
}

export default VariableInjector
