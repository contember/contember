import { Schema } from '@contember/schema'

export type SchemaGetter = (options?: { normalize?: boolean; stage?: string }) => Promise<Schema>
