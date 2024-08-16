import type { EntityListSubTreeMarker } from './EntityListSubTreeMarker'
import type { EntitySubTreeMarker } from './EntitySubTreeMarker'
import type { FieldMarker } from './FieldMarker'
import type { HasManyRelationMarker } from './HasManyRelationMarker'
import type { HasOneRelationMarker } from './HasOneRelationMarker'

export type MeaningfulMarker =
	| FieldMarker
	| HasOneRelationMarker
	| HasManyRelationMarker
	| EntityListSubTreeMarker
	| EntitySubTreeMarker
