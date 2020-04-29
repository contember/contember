import { Environment, FieldValue } from '@contember/binding'
import { getResolvedOptionalDiscriminant } from './getResolvedOptionalDiscrinminant'
import { SugaredDiscriminateBy } from './SugaredDiscriminateBy'
import { SugaredDiscriminateByScalar } from './SugaredDiscriminateByScalar'

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
