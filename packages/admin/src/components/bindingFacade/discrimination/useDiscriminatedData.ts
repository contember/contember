import { useEnvironment, VariableInputTransformer } from '@contember/binding'
import { useMemo } from 'react'
import { DiscriminatedDatum } from './DiscriminatedDatum'
import { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData'

export const useDiscriminatedData = <Datum extends DiscriminatedDatum = DiscriminatedDatum>(
	source: Iterable<Datum>,
): NormalizedDiscriminatedData<Datum> => {
	const environment = useEnvironment()

	return useMemo(() => {
		const normalized: NormalizedDiscriminatedData<Datum> = new Map()

		for (const datum of source) {
			const value = VariableInputTransformer.transformValue(datum.discriminateBy, environment)
			normalized.set(value, {
				discriminateBy: value,
				datum,
			})
		}

		return normalized
	}, [environment, source])
}
