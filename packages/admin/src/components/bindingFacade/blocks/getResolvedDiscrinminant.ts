import { Environment, FieldValue } from '@contember/binding'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from './Block'
import { getResolvedOptionalDiscriminant } from './getResolvedOptionalDiscrinminant'

export const getResolvedDiscriminant = (
	discriminateBy:
		| {
				discriminateBy: SugaredDiscriminateBy
		  }
		| {
				discriminateByScalar: SugaredDiscriminateByScalar
		  },
	environment: Environment,
): FieldValue => getResolvedOptionalDiscriminant(discriminateBy, environment)!
