import { Schema } from '@contember/schema'

export type SchemaWithMeta =
	& Schema
	& {
		meta?: {
			takenIndexNames: Record<string, true>
		}
	}

export const resolveIndexName = (schema: SchemaWithMeta, indexName: string): string => {
	for (let i = 0; ; i++) {
		const name = indexName + (i === 0 ? '' : `${i}`)
		if (!schema.meta || !(name in schema.meta.takenIndexNames)) {
			return name
		}
	}
}
