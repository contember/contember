import { Scalar } from '@contember/binding'
import { ResolvedDiscriminatedData } from './ResolvedDiscriminatedData'

export type NormalizedDiscriminatedData<LiteralBased, ScalarBased = LiteralBased> =
	| {
			discriminationKind: 'literal'
			data: Map<string, ResolvedDiscriminatedData<LiteralBased>>
	  }
	| {
			discriminationKind: 'scalar'
			data: Map<Scalar, ResolvedDiscriminatedData<ScalarBased>>
	  }
