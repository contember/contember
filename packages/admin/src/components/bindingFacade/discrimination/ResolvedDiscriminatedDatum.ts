import type { FieldValue } from '@contember/binding'

export interface ResolvedDiscriminatedDatum<Datum> {
	discriminateBy: FieldValue
	datum: Datum
}
