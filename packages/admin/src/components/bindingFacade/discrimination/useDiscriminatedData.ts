import { BindingError, Scalar, useEnvironment, VariableInputTransformer } from '@contember/binding'
import * as React from 'react'
import { LiteralDiscriminatedDatum } from './LiteralDiscriminatedDatum'
import { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData'
import { ResolvedDiscriminatedData } from './ResolvedDiscriminatedData'
import { ScalarDiscriminatedDatum } from './ScalarDiscriminatedDatum'

export interface UseDiscriminatedDataOptions<
	LiteralBased extends LiteralDiscriminatedDatum,
	ScalarBased extends ScalarDiscriminatedDatum
> {
	undiscriminatedItemMessage?: string | ((item: LiteralBased | ScalarBased) => string)
	mixedDiscriminationMessage?: string
}

export const useDiscriminatedData = <
	LiteralBased extends LiteralDiscriminatedDatum,
	ScalarBased extends ScalarDiscriminatedDatum
>(
	source: Iterable<LiteralBased | ScalarBased>,
	options: UseDiscriminatedDataOptions<LiteralBased, ScalarBased> = {},
): NormalizedDiscriminatedData<LiteralBased, ScalarBased> => {
	const environment = useEnvironment()
	const undiscriminatedItemMessage = options.undiscriminatedItemMessage ?? 'Found an undiscriminated item.'
	const mixedDiscriminationMessage =
		options.mixedDiscriminationMessage ??
		`Detected a set of discriminated items of non-uniform discrimination methods. ` +
			`They all have to use either 'discriminateBy' or 'discriminateByScalar'.`

	return React.useMemo<NormalizedDiscriminatedData<LiteralBased, ScalarBased>>(() => {
		const literalBased: Map<string, ResolvedDiscriminatedData<LiteralBased>> = new Map()
		const scalarBased: Map<Scalar, ResolvedDiscriminatedData<ScalarBased>> = new Map()

		for (const data of source) {
			if ('discriminateBy' in data && data.discriminateBy !== undefined) {
				const literal = VariableInputTransformer.transformVariableLiteral(data.discriminateBy, environment)
				literalBased.set(literal.value, {
					discriminateBy: literal,
					data,
				})
			} else if ('discriminateByScalar' in data && data.discriminateByScalar !== undefined) {
				const scalar = VariableInputTransformer.transformVariableScalar(data.discriminateByScalar, environment)
				scalarBased.set(scalar, {
					discriminateBy: scalar,
					data,
				})
			} else {
				throw new BindingError(
					typeof undiscriminatedItemMessage === 'string'
						? undiscriminatedItemMessage
						: undiscriminatedItemMessage(data),
				)
			}
		}

		if (scalarBased.size && literalBased.size === 0) {
			return {
				discriminationKind: 'scalar',
				data: scalarBased,
			}
		}
		if (scalarBased.size === 0) {
			return {
				discriminationKind: 'literal',
				data: literalBased,
			}
		}

		throw new BindingError(mixedDiscriminationMessage)
	}, [environment, mixedDiscriminationMessage, source, undiscriminatedItemMessage])
}
