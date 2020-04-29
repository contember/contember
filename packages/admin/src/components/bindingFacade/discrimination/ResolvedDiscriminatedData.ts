import { FieldValue } from '@contember/binding'

export interface ResolvedDiscriminatedData<Data> {
	discriminateBy: FieldValue
	data: Data
}
