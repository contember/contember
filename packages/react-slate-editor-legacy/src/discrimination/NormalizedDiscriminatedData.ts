import type { FieldValue } from '@contember/react-binding'
import type { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum.js'

export type NormalizedDiscriminatedData<Datum> = Map<FieldValue, ResolvedDiscriminatedDatum<Datum>>
