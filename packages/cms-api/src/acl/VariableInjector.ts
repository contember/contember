import { Acl, Input } from 'cms-common'

class VariableInjector {
	constructor(private readonly variables: Acl.VariablesMap) {
	}

	public inject(where: Input.Where<Acl.PredicateVariable>): Input.Where {
		return Object.keys(where).reduce((result, key) => {
			const value = where[key]
			if (value === undefined) {
				return result
			}
			if (typeof value === 'string') {
				return { ...result, [key]: this.createCondition(this.variables[value] || undefined) }
			}
			if (Array.isArray(value)) {
				return { ...result, [key]: value.map(it => this.inject(it)) }
			}
			return { ...result, [key]: this.inject(value) }
		}, {})
	}

	private createCondition(variable: any): Input.Condition {
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
