import { FieldAccessor, FieldValue } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData'
import { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum'

export const getDiscriminatedDatum = <Datum>(
	data: NormalizedDiscriminatedData<Datum>,
	discriminant: FieldAccessor | FieldValue,
): ResolvedDiscriminatedDatum<Datum> | undefined => {
	const discriminantValue: FieldValue = discriminant instanceof FieldAccessor ? discriminant.currentValue : discriminant

	if (discriminantValue instanceof GraphQlBuilder.Literal) {
		return data.get(discriminantValue.value)
	}
	return data.get(discriminantValue)
}
