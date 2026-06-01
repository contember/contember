import type { EntityListSubTreeMarker } from './EntityListSubTreeMarker.js'
import type { EntitySubTreeMarker } from './EntitySubTreeMarker.js'
import type { FieldMarker } from './FieldMarker.js'
import type { HasManyRelationMarker } from './HasManyRelationMarker.js'
import type { HasOneRelationMarker } from './HasOneRelationMarker.js'

export type MeaningfulMarker =
	| FieldMarker
	| HasOneRelationMarker
	| HasManyRelationMarker
	| EntityListSubTreeMarker
	| EntitySubTreeMarker
