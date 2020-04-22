import { Environment, FieldValue, VariableInputTransformer } from '@contember/binding'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from './Block'

export const getResolvedOptionalDiscriminant = (
	discriminateBy: {
		discriminateBy?: SugaredDiscriminateBy
		discriminateByScalar?: SugaredDiscriminateByScalar
	},
	environment: Environment,
): FieldValue | undefined => {
	if (discriminateBy.discriminateBy) {
		return VariableInputTransformer.transformVariableLiteral(discriminateBy.discriminateBy, environment)
	}
	if (discriminateBy.discriminateByScalar) {
		return VariableInputTransformer.transformVariableScalar(discriminateBy.discriminateByScalar, environment)
	}
	return undefined
}
