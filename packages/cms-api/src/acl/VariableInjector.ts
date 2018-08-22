import { Acl, Input } from 'cms-common'

class VariableInjector {
	public inject(
		where: Input.Where<Acl.PredicateVariable>,
		variables: Acl.VariablesMap
	): Input.Where<Input.Condition<Input.ColumnValue>> {
		return Object.keys(where).reduce((result, key) => {
			const value = where[key]
			if (value === undefined) {
				return result
			}
			if (typeof value === 'string') {
				return { ...result, [key]: this.createCondition(variables[value] || undefined) }
			}
			if (Array.isArray(value)) {
				return { ...result, [key]: value.map(it => this.inject(it, variables)) }
			}
			return { ...result, [key]: this.inject(value, variables) }
		}, {})
	}

	private createCondition(variable: any): Input.Condition<Input.ColumnValue> {
		if (variable === undefined) {
			return { never: true }
		}
		if (Array.isArray(variable)) {
			return { in: variable }
		}
		if (typeof variable === 'string' || typeof variable === 'number') {
			return { eq: variable }
		}
		throw new Error('not implemented')
	}
}

export default VariableInjector
