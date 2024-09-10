import type { FieldValue, OptionallyVariableFieldValue } from '../treeParameters'
import { VariableFieldValue } from './VariableFieldValue'
import { Environment } from './Environment'
import { BindingError } from '../BindingError'

export class VariableInputTransformer {
	public static transformValue(value: OptionallyVariableFieldValue, environment: Environment): FieldValue {
		if (value instanceof VariableFieldValue) {
			return VariableInputTransformer.transformVariableFieldValue(value, environment)
		}
		return value
	}

	public static transformVariableFieldValue(variableFieldValue: VariableFieldValue, environment: Environment): FieldValue {
		const value = environment.getVariableOrElse(variableFieldValue.variableName, undefined)
			?? environment.getParameterOrElse(variableFieldValue.variableName, undefined)

		if (value === undefined) {
			throw new BindingError(`Variable '${variableFieldValue.variableName}' not found.`)
		}

		if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number' && value !== null) {
			throw new BindingError(`The value of the '${variableFieldValue.variableName}' must be a scalar or null, not '${typeof value}'.`)
		}
		return value
	}
}
