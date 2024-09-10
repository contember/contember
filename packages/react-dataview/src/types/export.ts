import { EntityListSubTreeMarker, FieldMarker, HasManyRelationMarker, HasOneRelationMarker } from '@contember/react-binding'

export type DataViewDataForExport = {
	markerPath: (EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker | FieldMarker)[]
	values: any[]
}[]
