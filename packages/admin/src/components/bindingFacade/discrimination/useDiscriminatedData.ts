import { BindingError, Scalar, useEnvironment, VariableInputTransformer } from '@contember/binding'
import { useMemo } from 'react'
import { LiteralDiscriminatedDatum } from './LiteralDiscriminatedDatum'
import { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData'
import { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum'
import { ScalarDiscriminatedDatum } from './ScalarDiscriminatedDatum'

export interface UseDiscriminatedDataOptions<
	BaseData extends object,
	LiteralBased extends LiteralDiscriminatedDatum & BaseData,
	ScalarBased extends ScalarDiscriminatedDatum & BaseData
> {
	undiscriminatedItemMessage?: string | ((item: LiteralBased | ScalarBased) => string)
	mixedDiscriminationMessage?: string
}

export const useDiscriminatedData = <
	BaseData extends object,
	LiteralBased extends LiteralDiscriminatedDatum & BaseData = LiteralDiscriminatedDatum & BaseData,
	ScalarBased extends ScalarDiscriminatedDatum & BaseData = ScalarDiscriminatedDatum & BaseData
>(
	source: Iterable<LiteralBased | ScalarBased>,
	options: UseDiscriminatedDataOptions<BaseData, LiteralBased, ScalarBased> = {},
): NormalizedDiscriminatedData<BaseData> => {
	const environment = useEnvironment()
	const undiscriminatedItemMessage = options.undiscriminatedItemMessage ?? 'Found an undiscriminated item.'
	const mixedDiscriminationMessage =
		options.mixedDiscriminationMessage ??
		`Detected a set of discriminated items of non-uniform discrimination methods. ` +
			`They all have to use either 'discriminateBy' or 'discriminateByScalar'.`

	return useMemo<NormalizedDiscriminatedData<BaseData>>(() => {
		const literalBased: Map<string, ResolvedDiscriminatedDatum<LiteralBased>> = new Map()
		const scalarBased: Map<Scalar, ResolvedDiscriminatedDatum<ScalarBased>> = new Map()

		for (const datum of source) {
			if ('discriminateBy' in datum && datum.discriminateBy !== undefined) {
				const literal = VariableInputTransformer.transformVariableLiteral(datum.discriminateBy, environment)
				literalBased.set(literal.value, {
					discriminateBy: literal,
					datum,
				})
			} else if ('discriminateByScalar' in datum && datum.discriminateByScalar !== undefined) {
				const scalar = VariableInputTransformer.transformVariableScalar(datum.discriminateByScalar, environment)
				scalarBased.set(scalar, {
					discriminateBy: scalar,
					datum,
				})
			} else {
				throw new BindingError(
					typeof undiscriminatedItemMessage === 'string'
						? undiscriminatedItemMessage
						: undiscriminatedItemMessage(datum),
				)
			}
		}

		if (scalarBased.size && literalBased.size === 0) {
			return scalarBased
		}
		if (scalarBased.size === 0) {
			return literalBased
		}

		throw new BindingError(mixedDiscriminationMessage)
	}, [environment, mixedDiscriminationMessage, source, undiscriminatedItemMessage])
}
