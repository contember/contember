import type { FieldValue } from '@contember/react-binding'

export interface ResolvedDiscriminatedDatum<Datum> {
	discriminateBy: FieldValue
	datum: Datum
}
