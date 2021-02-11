import { FieldMarker, HasManyRelationMarker, HasOneRelationMarker, SubTreeMarker } from '../../markers'

export type RawMarkerPath = Array<SubTreeMarker | HasOneRelationMarker | HasManyRelationMarker | FieldMarker>
