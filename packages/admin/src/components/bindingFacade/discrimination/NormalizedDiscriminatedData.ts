import type { FieldValue } from '@contember/binding'
import type { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum'

export type NormalizedDiscriminatedData<Datum> = Map<FieldValue, ResolvedDiscriminatedDatum<Datum>>
