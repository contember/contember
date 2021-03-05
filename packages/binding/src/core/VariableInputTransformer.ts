import { BindingError } from '../BindingError'
import { Environment, VariableFieldValue } from '../dao'
import { FieldValue, OptionallyVariableFieldValue, Scalar } from '../treeParameters'

export class VariableInputTransformer {
	public static transformValue(value: OptionallyVariableFieldValue, environment: Environment): FieldValue {
		if (value instanceof VariableFieldValue) {
			return VariableInputTransformer.transformVariableFieldValue(value, environment)
		}
		return value
	}

	public static transformVariableFieldValue(variableFieldValue: VariableFieldValue, environment: Environment): Scalar {
		const value = environment.getValueOrElse(variableFieldValue.variableName, undefined)

		if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number' && value !== null) {
			throw new BindingError(
				`The value of the '${variableFieldValue.variableName}' must be a scalar or null, not '${typeof value}'.`,
			)
		}
		return value
	}
}
