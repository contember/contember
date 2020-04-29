import { Environment, FieldValue, VariableInputTransformer } from '@contember/binding'
import { SugaredDiscriminateBy } from './SugaredDiscriminateBy'
import { SugaredDiscriminateByScalar } from './SugaredDiscriminateByScalar'

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
