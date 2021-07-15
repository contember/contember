import { Schema } from '@contember/schema'

export interface Project {
	readonly id: string
	readonly slug: string
	readonly name: string
}

export type ProjectSchemaResolver = (projectSlug: string) => Promise<Schema | undefined>
export type ProjectInitializer = (projectSlug: string) => Promise<{ log: string[] }>
