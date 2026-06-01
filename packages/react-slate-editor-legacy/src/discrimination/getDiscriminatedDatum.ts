import { FieldAccessor, FieldValue, isFieldAccessor } from '@contember/react-binding'
import type { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData.js'
import type { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum.js'

export const getDiscriminatedDatum = <Datum>(
	data: NormalizedDiscriminatedData<Datum>,
	discriminant: FieldAccessor | FieldValue,
): ResolvedDiscriminatedDatum<Datum> | undefined => {
	const discriminantValue: FieldValue = isFieldAccessor(discriminant) ? discriminant.value : discriminant

	return data.get(discriminantValue)
}
