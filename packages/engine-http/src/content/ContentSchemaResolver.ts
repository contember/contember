import { DatabaseContext, SchemaProvider, SchemaWithMeta } from '@contember/engine-system-api'
import { calculateSchemaChecksum, filterSchemaByStage, normalizeSchema } from '@contember/schema-utils'
import { Schema } from '@contember/schema'
import { ContentApiSpecificCache } from './ContentApiSpecificCache'
import { createMemoizer } from '../utils/memoizeObject'

const memoizedSchema = createMemoizer(calculateSchemaChecksum)

export class ContentSchemaResolver {
	private baseSchemaCache: SchemaWithMeta | null = null

	constructor(private readonly schemaProvider: SchemaProvider) {
	}

	public clearCache() {
		this.baseSchemaCache = null
	}

	public async getSchema({ db, stage, normalize }: {
		db: DatabaseContext
		normalize?: boolean
		stage?: string
	}): Promise<SchemaWithMeta> {
		const prevBaseSchema = this.baseSchemaCache
		const { schema, meta } = await this.schemaProvider.fetch({ db, currentSchema: prevBaseSchema })
		this.baseSchemaCache = {
			schema: memoizedSchema(schema),
			meta: meta,
		}
		const finalSchema = getSchema(this.baseSchemaCache.schema, { stage, normalize })
		return {
			schema: finalSchema,
			meta: this.baseSchemaCache.meta,
		}
	}
}

const cache = new ContentApiSpecificCache<Schema, Schema>({})
const getSchema = (schema: Schema, options: { stage?: string; normalize?: boolean }) => {
	const cacheKey = [options.stage, options.normalize].join('\xff')
	return cache.fetch(schema, cacheKey, () => {
		let result = schema
		if (options.normalize) {
			result = normalizeSchema(result)
		}
		if (options.stage) {
			result = filterSchemaByStage(result, options.stage)
		}
		return result
	})
}

