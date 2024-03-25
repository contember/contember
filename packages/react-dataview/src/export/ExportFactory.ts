import { EntityListSubTreeMarker, HasManyRelationMarker, HasOneRelationMarker } from '@contember/binding'

export interface ExportFormatterCreateOutputArgs {
	data: any[]
	marker: EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker
}

export interface ExportResult {
	blob: Blob
	extension: string
}

export interface ExportFactory {
	create(args: ExportFormatterCreateOutputArgs): ExportResult
}
