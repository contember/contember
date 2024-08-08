import { FieldAccessor, FieldValue, isFieldAccessor } from '@contember/react-binding'
import type { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData'
import type { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum'

export const getDiscriminatedDatum = <Datum>(
	data: NormalizedDiscriminatedData<Datum>,
	discriminant: FieldAccessor | FieldValue,
): ResolvedDiscriminatedDatum<Datum> | undefined => {
	const discriminantValue: FieldValue = isFieldAccessor(discriminant) ? discriminant.value : discriminant

	return data.get(discriminantValue)
}
