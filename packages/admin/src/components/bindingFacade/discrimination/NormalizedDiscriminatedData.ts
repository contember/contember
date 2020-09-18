import { FieldValue } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { ResolvedDiscriminatedDatum } from './ResolvedDiscriminatedDatum'

export type NormalizedDiscriminatedData<Data> = Map<
	Exclude<FieldValue, GraphQlBuilder.Literal>,
	ResolvedDiscriminatedDatum<Data>
>
