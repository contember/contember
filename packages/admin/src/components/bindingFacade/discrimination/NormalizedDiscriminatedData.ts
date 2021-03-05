import { FieldValue } from '@contember/binding'
import { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum'

export type NormalizedDiscriminatedData<Datum> = Map<FieldValue, ResolvedDiscriminatedDatum<Datum>>
